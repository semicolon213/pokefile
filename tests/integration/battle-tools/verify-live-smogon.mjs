// 실행할 때만 외부 API를 호출한다. Vitest의 fixture 기반 단위·통합 테스트에는 포함되지 않는다.
// TASK-025 / FR-17·18, DR-08 / TC-06. node tests/integration/battle-tools/verify-live-smogon.mjs
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { normalizeSmogonSets, selectSmogonSets } = await server.ssrLoadModule('/src/features/battle-tools/model/smogon.ts')
  const datasets = new Map()
  for (const generation of [9, 8, 7, 6]) {
    const url = `https://data.pkmn.cc/sets/gen${generation}.json`
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    assert.equal(response.status, 200, url)
    const body = await response.text()
    const data = normalizeSmogonSets(JSON.parse(body))
    assert.ok(data.length > 0)
    datasets.set(generation, data)
    console.log(JSON.stringify({ generation, url: response.url, speciesKeys: data.length,
      cors: response.headers.get('access-control-allow-origin'),
      sha256: createHash('sha256').update(body).digest('hex') }))
  }
  const cases = [
    [9, 'raichu', 'alola'], [9, 'tauros', 'paldea-blaze-breed'],
    [8, 'darmanitan', 'galar-standard'], [9, 'indeedee', 'female'],
    [7, 'charizard', 'mega-x'], [6, 'charizard', 'mega-y'], [7, 'rayquaza', 'mega'],
    [9, 'necrozma', 'dusk'], [8, 'necrozma', 'dusk'], [7, 'necrozma', 'dusk'],
    [8, 'necrozma', 'dawn'], [7, 'necrozma', 'dawn'],
    [9, 'ogerpon', 'wellspring-mask'], [9, 'ogerpon', 'hearthflame-mask'], [9, 'ogerpon', 'cornerstone-mask'],
  ]
  for (const [generation, speciesName, formKey] of cases) {
    const formats = selectSmogonSets(datasets.get(generation), { speciesName, formKey }, generation)
    assert.ok(formats.length > 0, `${generation}: ${speciesName}/${formKey}`)
    console.log(JSON.stringify({ generation, speciesName, formKey, formats: formats.map(({ format }) => format) }))
  }
  const index = JSON.parse(readFileSync('public/data/pokedex-index.json', 'utf8')).pokemon
  let checkedForms = 0
  const before = JSON.stringify([...datasets])
  for (const pokemon of index) for (const { key } of pokemon.forms) {
    for (const [generation, data] of datasets) {
      const formats = selectSmogonSets(data, { speciesName: pokemon.nameEn, formKey: key }, generation)
      assert.ok(formats.every(({ sets }) => sets.length > 0))
    }
    checkedForms++
  }
  assert.equal(checkedForms, index.reduce((sum, pokemon) => sum + pokemon.forms.length, 0))
  assert.equal(JSON.stringify([...datasets]), before, '전체 폼 조회 후 캐시 불변')
  console.log(`PASS: 세대 파일 4개 정규화 및 실제 폼 매핑 ${cases.length}건, 인덱스 ${checkedForms}개 폼 × 4세대 조회·캐시 불변`)
} finally {
  await server.close()
}
