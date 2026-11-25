#!/usr/bin/env node
// 기술 표(FR-27, TASK-015)용 정적 기술 데이터 생성 — OQ-23 A안: 상세 feature 안에 두고 화면에서 필요할 때만 불러온다.
// PokéAPI /move 938개(한국어 이름·타입·분류·위력·명중·PP)와 /machine 2508개(판별 기술머신 번호)를 모은다.
// 기술마다 따로 요청하면 포켓몬 한 마리에 50~130번·1.5~4MB가 들어(2026-11-25 실측) 정적 표로 바꿨다.
// 실행: node src/features/pokemon-detail/data/build-moves.mjs  →  같은 폴더 moves.json
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const API = 'https://pokeapi.co/api/v2'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'moves.json')

// 확장팩 판의 기술머신은 본편 판에 합친다. 포켓몬의 기술 목록도 본편 판으로만 기록된다(2026-11-25 실측).
const DLC_TO_BASE = { 'the-teal-mask': 'scarlet-violet', 'the-indigo-disk': 'scarlet-violet', 'mega-dimension': 'legends-za' }
const DAMAGE_CLASSES = ['physical', 'special', 'status']

// PokéAPI past_values에는 분류 변경이 없다. 4~8세대 개별 기술의 이전 분류는 Pokémon Showdown 세대별 기술 데이터에서 가져온다
// (QA D-015-01-R1: 물수리검은 6세대까지 물리, 7세대부터 특수. 2026-11-25 기준 변경은 이 1건). 3세대까지는 타입으로 정해져 화면에서 계산한다.
// genN 파일의 category는 N세대까지의 값이므로 N+1세대 첫 판을 '바뀐 판'으로 기록한다.
const SHOWDOWN_MODS = 'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods'
const NEXT_GENERATION_GROUP = { 4: 'black-white', 5: 'x-y', 6: 'sun-moon', 7: 'sword-shield', 8: 'scarlet-violet' }

async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${response.status} ${url}`)
      return await response.json()
    } catch (error) {
      if (attempt >= 4) throw error
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
    }
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++
        results[i] = await fn(items[i])
      }
    }),
  )
  return results
}

const list = (await getJson(`${API}/move?limit=2000`)).results
console.log(`기술 ${list.length}개 조회`)
const rawMoves = await mapLimit(list, 16, (entry) => getJson(entry.url))

// Showdown 기술 id(영숫자 소문자) → 세대별 이전 분류 [바뀐 판, 분류]
const pastClasses = {}
for (const [generation, changedAt] of Object.entries(NEXT_GENERATION_GROUP)) {
  const response = await fetch(`${SHOWDOWN_MODS}/gen${generation}/moves.ts`)
  if (!response.ok) throw new Error(`${response.status} Showdown gen${generation} moves`)
  for (const [, id, body] of (await response.text()).matchAll(/\n\t(\w+): \{([\s\S]*?)\n\t\},/g)) {
    const category = /\n\t\tcategory: "(Physical|Special|Status)"/.exec(body)?.[1]
    if (category) (pastClasses[id] ??= []).push([changedAt, category.toLowerCase()])
  }
}
console.log(`Showdown 이전 분류: ${JSON.stringify(pastClasses)}`)

const moves = {}
const machineUrls = []
const pastGroups = new Set()
for (const move of rawMoves) {
  const ko = move.names.find((n) => n.language.name === 'ko')?.name ?? null
  const damageClass = move.damage_class?.name ?? null
  // [한국어 이름, 타입, 분류, 위력, 명중, PP] — 값이 없으면 null
  const row = [ko, move.type?.name ?? null, DAMAGE_CLASSES.includes(damageClass) ? damageClass : null, move.power, move.accuracy, move.pp]
  // 이전 게임의 값(QA D-015-01): [바뀐 판, 타입, 위력, 명중, PP, 분류]. 그 판보다 앞선 게임에서 쓰던 값이고 null은 바뀌지 않은 항목
  const past = move.past_values.map((p) => [p.version_group.name, p.type?.name ?? null, p.power, p.accuracy, p.pp])
  for (const [changedAt, pastClass] of pastClasses[move.name.replace(/[^a-z0-9]/g, '')] ?? []) {
    const same = past.find((p) => p[0] === changedAt)
    if (same) same[5] = pastClass
    else past.push([changedAt, null, null, null, null, pastClass])
    pastGroups.add(changedAt)
  }
  if (past.length) row.push(past)
  moves[move.name] = row
  for (const p of move.past_values) pastGroups.add(p.version_group.name)
  for (const machine of move.machines) machineUrls.push(machine.machine.url)
}

console.log(`기술머신 ${machineUrls.length}개 조회`)
const rawMachines = await mapLimit(machineUrls, 16, getJson)
const machines = {}
const conflicts = []
for (const machine of rawMachines) {
  const group = DLC_TO_BASE[machine.version_group.name] ?? machine.version_group.name
  const byMove = (machines[group] ??= {})
  // 확장팩 판은 본편과 같은 번호를 다시 기록한다(예: 스칼렛·바이올렛 불꽃펀치 tm67). 번호가 다르면 알린다
  const previous = byMove[machine.move.name]
  if (previous && previous !== machine.item.name) conflicts.push(`${group} ${machine.move.name} ${previous}/${machine.item.name}`)
  byMove[machine.move.name] ??= machine.item.name
}
if (conflicts.length) console.warn(`번호가 다른 중복 기록 ${conflicts.length}개: ${conflicts.join(', ')}`)

const sorted = (record) => Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))
const data = {
  source: 'PokéAPI /move, /machine',
  generatedAt: new Date().toISOString().slice(0, 10),
  moves: sorted(moves),
  machines: Object.fromEntries(Object.entries(sorted(machines)).map(([group, byMove]) => [group, sorted(byMove)])),
}
writeFileSync(OUT, JSON.stringify(data))
const missingKo = Object.entries(moves).filter(([, value]) => !value[0]).map(([name]) => name)
console.log(`저장: ${OUT} (${(JSON.stringify(data).length / 1024).toFixed(0)}KB), 한국어 이름 없음 ${missingKo.length}개 ${missingKo.join(' ')}`)
console.log(`이전 값이 바뀐 판: ${[...pastGroups].join(' ')}`)
