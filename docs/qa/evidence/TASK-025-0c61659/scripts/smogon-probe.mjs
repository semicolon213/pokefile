// TASK-025 QA: 앱이 실제로 넘기는 값(PokéAPI species.name + 폼 키)으로 4개 세대 Smogon 데이터 매핑을 전수 점검
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const WT = process.argv[2], OUT = process.argv[3]
const req = createRequire(path.join(WT, 'package.json'))
const { rolldown } = await import(pathToFileURL(req.resolve('rolldown')).href)
const b = await rolldown({ input: path.join(WT, 'src/features/battle-tools/model/smogon.ts'), resolve: { alias: { '@': path.join(WT, 'src') } }, platform: 'node',
  transform: { define: { 'import.meta.env': '{"BASE_URL":"/","DEV":false}' } } })
const file = path.join(OUT, 'smogon.bundle.mjs'); await b.write({ file, format: 'esm' })
const m = await import(pathToFileURL(file).href)
const cache = (name, fn) => { const f = path.join(OUT, name); if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')); return fn().then((v) => (fs.writeFileSync(f, JSON.stringify(v)), v)) }
const raw = {}
for (const g of [9, 8, 7, 6]) raw[g] = await cache(`gen${g}.json`, async () => (await fetch(`https://data.pkmn.cc/sets/gen${g}.json`)).json())
const speciesList = await cache('species.json', async () => (await (await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=1025')).json()).results.map((r) => r.name))
const index = JSON.parse(fs.readFileSync(path.join(WT, 'public/data/pokedex-index.json'), 'utf8')).pokemon
const data = Object.fromEntries(Object.entries(raw).map(([g, v]) => [g, m.normalizeSmogonSets(v)]))
const sid = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const fp = (format, set) => `${format}|${set.name}|${JSON.stringify(set.moves)}`
// Smogon key → 세트 지문
const owner = {}
for (const g of [9, 8, 7, 6]) for (const sp of data[g]) for (const f of sp.formats) for (const s of f.sets) (owner[`${g}|${fp(f.format, s)}`] ??= new Set()).add(sp.speciesName)
const reached = { 9: new Set(), 8: new Set(), 7: new Set(), 6: new Set() }
let speciesWithAny = 0, speciesNone = []
const formRows = []
for (const p of index) {
  const speciesName = speciesList[p.id - 1]
  const keys = ['default', ...p.forms.map((f) => f.key)]
  let any = false
  for (const formKey of keys) {
    const gens = []
    for (const g of [9, 8, 7, 6]) {
      const res = m.selectSmogonSets(data[g], { speciesName, formKey }, g)
      if (res.length) gens.push(g)
      for (const f of res) for (const s of f.sets) for (const k of owner[`${g}|${fp(f.format, s)}`] ?? []) reached[g].add(k)
      // 매핑된 세트가 다른 종의 세트인지(혼입) 확인
      for (const f of res) for (const s of f.sets) {
        const owners = owner[`${g}|${fp(f.format, s)}`]
        if (owners && ![...owners].some((o) => sid(o).startsWith(sid(speciesName).slice(0, 4)))) console.log('MIX?', g, speciesName, formKey, [...owners])
      }
    }
    if (formKey === 'default' && gens.length) any = true
    formRows.push({ id: p.id, speciesName, formKey, gens })
  }
  if (any) speciesWithAny++; else speciesNone.push(p.id)
}
console.log('species(기본 폼) 세팅 있음', speciesWithAny, '없음', speciesNone.length)
const nonDefault = formRows.filter((r) => r.formKey !== 'default')
console.log('기본 외 폼', nonDefault.length, '세팅 있음', nonDefault.filter((r) => r.gens.length).length)
console.log('\n== 앱이 한 번도 닿지 않는 Smogon 키 (세대별) ==')
for (const g of [9, 8, 7, 6]) {
  const miss = data[g].map((s) => s.speciesName).filter((n) => !reached[g].has(n) && data[g].find((s) => s.speciesName === n).formats.length)
  console.log(`gen${g} (${data[g].length}키) 미도달 ${miss.length}:`, miss.join(', '))
}
console.log('\n== 주요 폼 ==')
for (const [id, k] of [[6, 'mega-x'], [6, 'mega-y'], [6, 'gmax'], [384, 'default'], [384, 'mega'], [26, 'alola'], [128, 'paldea-blaze-breed'], [800, 'dusk'], [1017, 'wellspring-mask'], [718, 'complete'], [718, '10-power-construct'], [892, 'rapid-strike'], [925, 'family-of-three'], [29, 'default'], [32, 'default'], [122, 'default'], [866, 'default'], [250, 'default'], [681, 'blade'], [646, 'black'], [479, 'wash'], [745, 'midnight'], [745, 'dusk'], [658, 'ash'], [26, 'mega-x']]) {
  const r = formRows.find((x) => x.id === id && x.formKey === k)
  console.log(`#${id} ${speciesList[id - 1]}/${k}:`, r ? (r.gens.length ? r.gens.join(',') : '없음') : '(인덱스에 폼 없음)')
}
const rq = (g, k) => m.selectSmogonSets(data[g], { speciesName: 'rayquaza', formKey: k }, g).map((f) => `${f.format}:${f.sets.map((s) => s.name).join('/')}`)
console.log('\n레쿠쟈 gen7 default', rq(7, 'default')); console.log('레쿠쟈 gen7 mega', rq(7, 'mega')); console.log('레쿠쟈 gen6 mega', rq(6, 'mega')); console.log('레쿠쟈 gen8 default', rq(8, 'default'))
const fmts = new Set(); for (const g of [9, 8, 7, 6]) for (const sp of data[g]) for (const f of sp.formats) fmts.add(f.format)
console.log('\n남은 포맷', [...fmts].sort().join(' '))
const rawF = new Set(); for (const g of [9, 8, 7, 6]) for (const v of Object.values(raw[g])) for (const f of Object.keys(v)) rawF.add(f)
console.log('제외된 포맷', [...rawF].filter((f) => !fmts.has(f)).sort().join(' '))
