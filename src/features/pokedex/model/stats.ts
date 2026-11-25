import type { PokemonSummary } from '@/shared/models'

// FR-34 종족값 정렬·조건 검색 (TASK-027). 값은 검색 인덱스의 기본 폼 종족값(PokemonSummary.stats).

export const STAT_KEYS = ['total', 'hp', 'attack', 'defense', 'sp-attack', 'sp-defense', 'speed'] as const
export type StatKey = (typeof STAT_KEYS)[number]

export const STAT_LABELS: Record<StatKey, string> = {
  total: '합계',
  hp: 'HP',
  attack: '공격',
  defense: '방어',
  'sp-attack': '특수공격',
  'sp-defense': '특수방어',
  speed: '스피드',
}

/** 조건을 처음 고를 때 넣는 값 (합계 500, 능력치 100) */
export const DEFAULT_MIN: Record<StatKey, number> = {
  total: 500,
  hp: 100,
  attack: 100,
  defense: 100,
  'sp-attack': 100,
  'sp-defense': 100,
  speed: 100,
}

/** 하한 입력 범위: 능력치 1~255, 합계 1~1000 */
export const statMax = (stat: StatKey) => (stat === 'total' ? 1000 : 255)

export const isStatKey = (value: string | null | undefined): value is StatKey =>
  (STAT_KEYS as readonly string[]).includes(value ?? '')

/** 종족값 하나. 인덱스에 종족값이 없으면 null */
export function statValue(pokemon: PokemonSummary, stat: StatKey): number | null {
  const stats = pokemon.stats
  if (!stats) return null
  if (stat === 'total') return stats.reduce((sum, v) => sum + v, 0)
  return stats[STAT_KEYS.indexOf(stat) - 1]
}

/** 종족값 하한 조건 (URL min=speed:100) */
export type StatMin = { stat: StatKey; value: number }

export function parseStatMin(value: string | null): StatMin | null {
  const match = value?.match(/^([a-z-]+):(\d{1,4})$/)
  if (!match || !isStatKey(match[1])) return null
  const n = Number(match[2])
  return n >= 1 && n <= statMax(match[1]) ? { stat: match[1], value: n } : null
}

export const formatStatMin = (min: StatMin) => `${min.stat}:${min.value}`
