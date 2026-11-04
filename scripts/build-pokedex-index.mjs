#!/usr/bin/env node
// 정적 검색 인덱스 생성 (ADR-010)
// 지원 범위(src/shared/config/scope.json)의 포켓몬과 모든 폼(ADR-016)을 PokéAPI에서 모아 public/data/pokedex-index.json을 만든다.
// 실행: npm run build:index  (네트워크 필요, 결과 파일은 저장소에 커밋한다)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formCategoryOf, formKeyOf, formNameKoOf } from './lib/form-names.mjs'

const POKEAPI = 'https://pokeapi.co/api/v2'
const CONCURRENCY = 12

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// 지원 범위는 앱과 같은 설정 파일을 읽는다 (TASK-013, ADR-015)
const scope = JSON.parse(readFileSync(join(root, 'src', 'shared', 'config', 'scope.json'), 'utf8'))
const MAX_ID = scope.maxPokemonId
const outFile = join(root, 'public', 'data', 'pokedex-index.json')
// API에 한국어 폼 이름이 없거나 맞지 않는 폼의 번역표 (ADR-016, OQ-26)
const translations = JSON.parse(readFileSync(join(root, 'scripts', 'data', 'form-names-ko.json'), 'utf8')).names

async function getJson(url, attempt = 1) {
  const res = await fetch(url)
  if (res.ok) return res.json()
  if (attempt < 3 && res.status >= 500) return getJson(url, attempt + 1)
  throw new Error(`${url} → HTTP ${res.status}`)
}

async function pool(items, fn) {
  const out = new Array(items.length)
  let next = 0
  let done = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i])
        if (++done % 100 === 0) process.stdout.write(`  ${done}/${items.length}\n`)
      }
    }),
  )
  return out
}

const nameIn = (names, lang) => names.find((n) => n.language.name === lang)?.name
const titleCase = (key) => key.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
const typesOf = (pokemon) => [...pokemon.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name)

async function main() {
  const ids = Array.from({ length: MAX_ID }, (_, i) => i + 1)

  console.log(`species ${MAX_ID}건 조회`)
  const species = await pool(ids, (id) => getJson(`${POKEAPI}/pokemon-species/${id}`))
  console.log(`pokemon ${MAX_ID}건 조회`)
  const pokemon = await pool(ids, (id) => getJson(`${POKEAPI}/pokemon/${id}`))

  // 기본 폼이 아닌 모든 폼 (ADR-016). 순서는 species.varieties 순서를 따른다.
  const variants = species.flatMap((s) =>
    s.varieties.filter((v) => !v.is_default).map((v) => ({ speciesId: s.id, name: v.pokemon.name })),
  )
  console.log(`폼 ${variants.length}건 조회`)
  const formData = await pool(variants, async ({ name }) => {
    const p = await getJson(`${POKEAPI}/pokemon/${name}`)
    const f = await getJson(p.forms[0].url)
    return { p, f }
  })
  const formsBySpecies = new Map()
  variants.forEach(({ speciesId, name }, i) => {
    const { p, f } = formData[i]
    const s = species[speciesId - 1]
    const key = formKeyOf(name, s.name)
    const category = formCategoryOf(key, f.is_mega)
    const nameKo = formNameKoOf({
      pokemonName: name,
      key,
      category,
      apiNameKo: nameIn(f.form_names, 'ko'),
      speciesKo: nameIn(s.names, 'ko') ?? s.name,
      translations,
    })
    const form = {
      key,
      ...(nameKo ? { nameKo } : {}),
      nameEn: nameIn(f.form_names, 'en') ?? nameIn(f.names, 'en') ?? titleCase(key),
      category,
      types: typesOf(p),
      battleOnly: f.is_battle_only,
    }
    formsBySpecies.set(speciesId, [...(formsBySpecies.get(speciesId) ?? []), form])
  })

  const entries = ids.map((id, i) => {
    const s = species[i]
    const p = pokemon[i]
    if (s.id !== id || p.id !== id) throw new Error(`id mismatch at ${id}`)
    const nameEn = nameIn(s.names, 'en') ?? s.name
    const nameKo = nameIn(s.names, 'ko')
    return {
      id,
      nameEn,
      ...(nameKo ? { nameKo } : {}),
      types: typesOf(p),
      generation: s.generation.name,
      forms: formsBySpecies.get(id) ?? [],
    }
  })

  // 지방 도감 (TASK-019, ADR-017): 도감마다 시작 번호와 지방 번호 순서의 전국도감 번호 목록
  console.log(`지방 도감 ${scope.pokedexes.length}개 조회`)
  const regionalDexes = {}
  for (const { name } of scope.pokedexes) {
    const dex = await getJson(`${POKEAPI}/pokedex/${name}`)
    const sorted = [...dex.pokemon_entries].sort((a, b) => a.entry_number - b.entry_number)
    // 하나 도감은 #000(비크티니)부터 시작한다. 시작 번호는 0 또는 1이고 그 뒤로는 빠짐없이 이어져야 한다.
    const start = sorted[0].entry_number
    if (start !== 0 && start !== 1) throw new Error(`${name}: 시작 번호 ${start}`)
    sorted.forEach((e, i) => {
      if (e.entry_number !== start + i) throw new Error(`${name}: 지방 번호가 이어지지 않음 (${e.entry_number})`)
    })
    const ids = sorted.map((e) => Number(e.pokemon_species.url.match(/\/(\d+)\/?$/)[1]))
    const outside = ids.filter((id) => id > MAX_ID)
    if (outside.length) throw new Error(`${name}: 지원 범위 밖 종 ${outside.join(', ')}`)
    regionalDexes[name] = { start, ids }
  }

  for (const e of entries) {
    const keys = e.forms.map((f) => f.key)
    if (new Set(keys).size !== keys.length) throw new Error(`폼 키 중복: #${e.id}`)
  }
  const allForms = entries.flatMap((e) => e.forms)
  const formSummary = Object.entries(Object.groupBy(allForms, (f) => f.category))
    .map(([category, list]) => `${category} ${list.length}`)
    .join(', ')
  const formsWithoutKo = entries.flatMap((e) => e.forms.filter((f) => !f.nameKo).map((f) => `${e.nameEn}-${f.key}`))
  const missingKo = entries.filter((e) => !e.nameKo).length
  const gens = new Set(entries.map((e) => e.generation))
  const unknownGen = [...gens].filter((g) => !scope.generations.some((s) => s.id === g))
  if (unknownGen.length) throw new Error(`scope.json generations에 없는 세대: ${unknownGen.join(', ')}`)

  const index = {
    version: 2,
    generatedAt: new Date().toISOString().slice(0, 10),
    source: 'PokéAPI (https://pokeapi.co)',
    count: entries.length,
    pokemon: entries,
    regionalDexes,
  }
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, JSON.stringify(index) + '\n')
  console.log(`완료: ${entries.length}종, 폼 ${allForms.length}개(${formSummary}), 한국어 이름 누락 ${missingKo}건 → ${outFile}`)
  console.log('지방 도감:', Object.entries(regionalDexes).map(([n, d]) => `${n} ${d.ids.length}`).join(', '))
  console.log(`한국어 폼 이름 없음(영문 표시) ${formsWithoutKo.length}개:`, formsWithoutKo.join(', ') || '없음')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
