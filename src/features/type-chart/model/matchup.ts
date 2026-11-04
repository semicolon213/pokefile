import { POKEMON_TYPES, type PokemonType } from '@/shared/models'
import chart from '../data/type-chart.json'

// FR-24 타입 상성 (TASK-021). 데이터는 scripts/build-type-chart.mjs가 PokéAPI damage_relations에서 만든다.
// 특성(부유·저수 등)·테라스탈·날씨는 반영하지 않는다.

const ATTACK = chart.attack as Record<PokemonType, Partial<Record<PokemonType, number>>>

/** 공격 타입 하나가 방어 타입 하나에 주는 배율 (0 · 0.5 · 1 · 2) */
export function typeEffectiveness(attack: PokemonType, defense: PokemonType): number {
  return ATTACK[attack][defense] ?? 1
}

/** 방어 타입 조합(1~2개)이 공격 타입에게 받는 배율. 두 타입의 배율을 곱한다 (0 · 0.25 · 0.5 · 1 · 2 · 4) */
export function damageTaken(attack: PokemonType, defense: readonly PokemonType[]): number {
  return defense.reduce((m, t) => m * typeEffectiveness(attack, t), 1)
}

export const MULTIPLIERS = [4, 2, 0.5, 0.25, 0] as const
export type Multiplier = (typeof MULTIPLIERS)[number]

/** 받는 피해 배율별 공격 타입 (1배는 제외, 큰 배율부터) */
export function defenseGroups(defense: readonly PokemonType[]): { multiplier: Multiplier; types: PokemonType[] }[] {
  return MULTIPLIERS.map((multiplier) => ({
    multiplier,
    types: POKEMON_TYPES.filter((attack) => damageTaken(attack, defense) === multiplier),
  })).filter((group) => group.types.length > 0)
}

/** 배율 표기: 0.5 → '½', 0.25 → '¼' */
export function formatMultiplier(m: number): string {
  if (m === 0.5) return '½'
  if (m === 0.25) return '¼'
  return String(m)
}
