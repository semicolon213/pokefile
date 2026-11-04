#!/usr/bin/env node
// 타입 상성표 생성 (FR-24, TASK-021)
// PokéAPI /type/{name}의 damage_relations(현재 세대 기준)에서 공격 타입 → 방어 타입 배율을 모아
// src/features/type-chart/data/type-chart.json을 만든다. 6세대 이후 상성은 바뀌지 않았다.
// 실행: npm run build:type-chart  (네트워크 필요, 결과 파일은 저장소에 커밋한다)
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const POKEAPI = 'https://pokeapi.co/api/v2'
// shared/models POKEMON_TYPES와 같은 순서
const TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
]

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'src', 'features', 'type-chart', 'data', 'type-chart.json')

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.json()
}

async function main() {
  const attack = {}
  for (const type of TYPES) {
    const { damage_relations: rel } = await getJson(`${POKEAPI}/type/${type}`)
    const row = {}
    for (const [key, value] of [['double_damage_to', 2], ['half_damage_to', 0.5], ['no_damage_to', 0]]) {
      for (const { name } of rel[key]) if (TYPES.includes(name)) row[name] = value
    }
    // 배율 1은 적지 않는다. 방어 순서(TYPES)로 정렬해 diff를 읽기 쉽게 한다.
    attack[type] = Object.fromEntries(TYPES.filter((t) => t in row).map((t) => [t, row[t]]))
  }
  const chart = {
    source: 'PokéAPI /type damage_relations (https://pokeapi.co)',
    generatedAt: new Date().toISOString().slice(0, 10),
    attack,
  }
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, JSON.stringify(chart, null, 2) + '\n')
  const cells = Object.values(attack).reduce((n, row) => n + Object.keys(row).length, 0)
  console.log(`완료: 공격 타입 ${TYPES.length}개, 1배가 아닌 칸 ${cells}개 → ${outFile}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
