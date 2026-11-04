import { POKEMON_TYPES, type PokemonType } from '@/shared/models'

/** 방어 타입은 2개까지 (포켓몬의 타입 수) */
export const MAX_DEFENSE_TYPES = 2

/** `?type=fire&type=flying` → 표준 순서, 중복·잘못된 값 제거, 최대 2개 */
export function parseDefenseTypes(params: URLSearchParams): PokemonType[] {
  const raw = params.getAll('type').flatMap((v) => v.split(','))
  return POKEMON_TYPES.filter((t) => raw.includes(t)).slice(0, MAX_DEFENSE_TYPES)
}

/** 타입 상성 화면 경로. 방어 타입을 미리 고른 상태로 연다. */
export function typeChartPath(types: readonly PokemonType[] = []): string {
  const params = new URLSearchParams()
  for (const t of POKEMON_TYPES) if (types.includes(t)) params.append('type', t)
  const q = params.toString()
  return q ? `/types?${q}` : '/types'
}
