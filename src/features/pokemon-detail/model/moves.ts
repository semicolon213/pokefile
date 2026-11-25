import { POKEMON_TYPES } from '@/shared/models'
import type { PokemonType } from '@/shared/models'
import type { NamedResource } from '../api/pokeapi'
import { VERSION_GROUPS, versionGroupsOf } from './evolution'

/**
 * 기술 표 (FR-27, TASK-015). 범위는 OQ-23 담당자 제안(2026-11-25):
 * 레벨업(폼 변경 기술 포함)·기술머신·기술 가르침. 교배 기술은 진화 첫 단계에만 기록돼 이번 범위에서 뺀다.
 * 배우는 기술 목록은 상세가 이미 받는 /pokemon 응답에서, 한국어 이름·타입·위력 등과 기술머신 번호는
 * 정적 기술 데이터(data/moves.json, build-moves.mjs)에서 가져온다.
 */

/** /pokemon 응답의 moves 필드 (RawPokemon에 더해 읽는다) */
export type RawPokemonMoves = {
  moves?: {
    move: NamedResource
    version_group_details: { level_learned_at: number; move_learn_method: NamedResource; version_group: NamedResource }[]
  }[]
}

export type DamageClass = 'physical' | 'special' | 'status'

/** 정적 기술 데이터. moves 값은 [한국어 이름, 타입, 분류, 위력, 명중, PP] */
export type MoveData = {
  moves: Record<string, [string | null, string | null, DamageClass | null, number | null, number | null, number | null]>
  /** 판(version_group) → 기술 → 도구 이름(tm01·hm01·tr01). 확장팩 판은 본편 판에 합쳐져 있다 */
  machines: Record<string, Record<string, string>>
}

type LearnMethod = 'level-up' | 'form-change' | 'machine' | 'tutor'
const LEARN_METHODS: readonly string[] = ['level-up', 'form-change', 'machine', 'tutor']

export type LearnRecord = { move: string; method: LearnMethod; level: number }
/** 판 → 그 판에서 배우는 기술 기록 */
export type Learnset = Record<string, LearnRecord[]>

/** 내 게임으로 고를 수 있는 판만 (콜로세움·XD·일본판·Champions 제외) */
const IN_SCOPE_GROUPS = new Set(VERSION_GROUPS.filter((g) => g.versions.length > 0).map((g) => g.name))

export function toLearnset(raw: RawPokemonMoves): Learnset {
  const learnset: Learnset = {}
  for (const { move, version_group_details } of raw.moves ?? []) {
    for (const detail of version_group_details) {
      const group = detail.version_group.name
      const method = detail.move_learn_method.name
      if (!IN_SCOPE_GROUPS.has(group) || !LEARN_METHODS.includes(method)) continue
      ;(learnset[group] ??= []).push({ move: move.name, method: method as LearnMethod, level: detail.level_learned_at })
    }
  }
  return learnset
}

/** 기술 기록이 있는 판, 최신 게임부터 */
export function gamesWithMoves(learnset: Learnset): string[] {
  return VERSION_GROUPS.map((g) => g.name)
    .filter((name) => (learnset[name]?.length ?? 0) > 0)
    .reverse()
}

/**
 * 처음 보여 줄 판. 내 게임(FR-26)이 있으면 그 게임의 판, 그 판에 기록이 없으면 가장 최신 판을 보여 주고
 * myGameMissing으로 알린다(기본 폼이나 다른 게임 기록으로 바꿔 '내 게임 기준'이라고 하지 않는다).
 */
export function defaultGame(games: readonly string[], myVersion: string | null | undefined): { game: string | null; myGameMissing: boolean } {
  if (!myVersion) return { game: games[0] ?? null, myGameMissing: false }
  const mine = versionGroupsOf(myVersion).find((group) => games.includes(group))
  return mine ? { game: mine, myGameMissing: false } : { game: games[0] ?? null, myGameMissing: true }
}

export type MachineNumber = { kind: 'tm' | 'hm' | 'tr'; number: number }

export type MoveRow = {
  /** PokéAPI 기술 식별자 */
  name: string
  /** 한국어 이름. 정적 데이터에 없으면 식별자 */
  label: string
  type: PokemonType | null
  damageClass: DamageClass | null
  power: number | null
  accuracy: number | null
  pp: number | null
  /** 레벨업 표: 배우는 레벨. 0은 진화할 때, 'form'은 폼을 바꿀 때 */
  level?: number | 'form'
  /** 기술머신 표: 머신 번호. 정적 데이터에 없으면 undefined */
  machine?: MachineNumber
}

export type GameMoves = { levelUp: MoveRow[]; machine: MoveRow[]; tutor: MoveRow[] }

const isPokemonType = (value: string | null): value is PokemonType =>
  value !== null && (POKEMON_TYPES as readonly string[]).includes(value)

function toRow(name: string, data: MoveData): MoveRow {
  const [ko, type, damageClass, power, accuracy, pp] = data.moves[name] ?? [null, null, null, null, null, null]
  return { name, label: ko ?? name, type: isPokemonType(type) ? type : null, damageClass, power, accuracy, pp }
}

function parseMachine(item: string | undefined): MachineNumber | undefined {
  const match = /^(tm|hm|tr)(\d+)$/.exec(item ?? '')
  return match ? { kind: match[1] as MachineNumber['kind'], number: Number(match[2]) } : undefined
}

const MACHINE_ORDER: Record<MachineNumber['kind'], number> = { tm: 0, hm: 1, tr: 2 }
const byLabel = (a: MoveRow, b: MoveRow) => a.label.localeCompare(b.label, 'ko')
const levelRank = (level: MoveRow['level']) => (level === 'form' ? -1 : (level ?? 0))

/**
 * 판 하나의 기술 표. 레벨업은 레벨 순(폼 변경 → 진화 → Lv.1 …), 기술머신은 기술머신·비전머신·기술레코드 번호 순,
 * 기술 가르침은 이름 순. 같은 기술이 같은 방법으로 두 번 기록되면(레벨이 같을 때) 한 번만 둔다.
 */
export function movesForGame(learnset: Learnset, game: string, data: MoveData): GameMoves {
  const levelUp = new Map<string, MoveRow>()
  const machine = new Map<string, MoveRow>()
  const tutor = new Map<string, MoveRow>()
  for (const record of learnset[game] ?? []) {
    if (record.method === 'level-up' || record.method === 'form-change') {
      const level = record.method === 'form-change' ? 'form' : record.level
      levelUp.set(`${record.move}:${level}`, { ...toRow(record.move, data), level })
    } else if (record.method === 'machine') {
      machine.set(record.move, { ...toRow(record.move, data), machine: parseMachine(data.machines[game]?.[record.move]) })
    } else {
      tutor.set(record.move, toRow(record.move, data))
    }
  }
  return {
    levelUp: [...levelUp.values()].sort((a, b) => levelRank(a.level) - levelRank(b.level) || byLabel(a, b)),
    machine: [...machine.values()].sort((a, b) => {
      if (!a.machine || !b.machine) return a.machine ? -1 : b.machine ? 1 : byLabel(a, b)
      return MACHINE_ORDER[a.machine.kind] - MACHINE_ORDER[b.machine.kind] || a.machine.number - b.machine.number
    }),
    tutor: [...tutor.values()].sort(byLabel),
  }
}

const MACHINE_LABELS: Record<MachineNumber['kind'], string> = { tm: '기술머신', hm: '비전머신', tr: '기술레코드' }

/** 예: 기술머신 01, 비전머신 03, 기술레코드 12, 기술머신 125 */
export function machineLabel(machine: MachineNumber): string {
  return `${MACHINE_LABELS[machine.kind]} ${String(machine.number).padStart(2, '0')}`
}

export function levelLabel(level: MoveRow['level']): string {
  if (level === 'form') return '폼 변경'
  if (level === 0) return '진화'
  return `Lv.${level ?? '—'}`
}

export const DAMAGE_CLASS_LABELS: Record<DamageClass, string> = { physical: '물리', special: '특수', status: '변화' }
