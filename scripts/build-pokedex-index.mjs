#!/usr/bin/env node
// 정적 검색 인덱스 생성 (ADR-010)
// PokéAPI에서 #1~#721과 6세대 메가 정보를 모아 public/data/pokedex-index.json을 만든다.
// 실행: npm run build:index  (네트워크 필요, 결과 파일은 저장소에 커밋한다)
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const POKEAPI = 'https://pokeapi.co/api/v2'
const MAX_ID = 721 // ADR-008
const MEGA_VERSION_GROUPS = ['x-y', 'omega-ruby-alpha-sapphire'] // 6세대에 도입된 메가만
const CONCURRENCY = 12

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'public', 'data', 'pokedex-index.json')

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

// 'charizard-mega-x' → 'mega-x', 'venusaur-mega' → 'mega'
const formKeyOf = (pokemonName) => pokemonName.match(/-(mega(?:-[xy])?)$/)?.[1]

async function main() {
  const ids = Array.from({ length: MAX_ID }, (_, i) => i + 1)

  console.log(`species ${MAX_ID}건 조회`)
  const species = await pool(ids, (id) => getJson(`${POKEAPI}/pokemon-species/${id}`))
  console.log(`pokemon ${MAX_ID}건 조회`)
  const pokemon = await pool(ids, (id) => getJson(`${POKEAPI}/pokemon/${id}`))

  console.log('6세대 메가 폼 조회')
  const list = await getJson(`${POKEAPI}/pokemon?limit=2000`)
  const megaNames = list.results.map((r) => r.name).filter((n) => /-mega(-[xy])?$/.test(n))
  const forms = await pool(megaNames, (n) => getJson(`${POKEAPI}/pokemon-form/${n}`))
  const megaFormsBySpecies = new Map()
  for (const form of forms) {
    if (!form.is_mega || !MEGA_VERSION_GROUPS.includes(form.version_group.name)) continue
    const mega = await getJson(form.pokemon.url)
    const speciesId = Number(mega.species.url.match(/\/(\d+)\/?$/)[1])
    if (speciesId > MAX_ID) continue
    const list = megaFormsBySpecies.get(speciesId) ?? []
    list.push(formKeyOf(mega.name))
    megaFormsBySpecies.set(speciesId, list.sort())
  }

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
      types: [...p.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
      generation: s.generation.name,
      megaForms: megaFormsBySpecies.get(id) ?? [],
    }
  })

  const megaCount = entries.reduce((n, e) => n + e.megaForms.length, 0)
  const missingKo = entries.filter((e) => !e.nameKo).length
  if (megaCount !== 48) throw new Error(`6세대 메가 수가 48이 아님: ${megaCount}`)

  const index = {
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    source: 'PokéAPI (https://pokeapi.co)',
    count: entries.length,
    pokemon: entries,
  }
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, JSON.stringify(index) + '\n')
  console.log(`완료: ${entries.length}종, 메가 ${megaCount}개, 한국어 이름 누락 ${missingKo}건 → ${outFile}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
