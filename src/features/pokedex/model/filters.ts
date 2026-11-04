import { GENERATIONS, POKEMON_TYPES, type Generation, type PokemonSummary, type PokemonType } from '@/shared/models'
import { displayName } from '@/shared/utils'
import type { RegionalEntry } from './regional'
import { matchesQuery } from './search'

// ADR-011: 검색어 AND 타입 AND 세대, 정렬은 도감 번호순(기본)·이름순. 상태는 URL 쿼리와 동기화한다.
// ADR-017: 세대(지방)를 고르면 그 지방 도감 전체를 보여 주고, 도감 번호순은 지방 번호 순이 된다(전국 번호순은 sort=national).
// 타입은 최대 2개까지 고르며, 고른 타입을 모두 가진 포켓몬만 남긴다(타입 조합). URL: type=fire&type=flying

/** id = 도감 번호순(지방을 고르면 지방 번호 순), national = 전국 도감 번호순, name = 이름순 */
export type SortKey = 'id' | 'national' | 'name'

export type PokedexFilters = {
  q: string
  /** 고른 타입(0~2개), 항상 POKEMON_TYPES 순서 */
  types: PokemonType[]
  gen: Generation | null
  sort: SortKey
}

export const DEFAULT_FILTERS: PokedexFilters = { q: '', types: [], gen: null, sort: 'id' }

/** 포켓몬은 타입을 최대 2개 가지므로 조합 필터도 2개까지 */
export const MAX_TYPES = 2

/** 표준 순서(POKEMON_TYPES)로 정렬·중복 제거·최대 2개 — URL과 비교가 항상 같은 모양이 되게 한다 */
export function normalizeTypes(types: readonly string[]): PokemonType[] {
  return POKEMON_TYPES.filter((t) => types.includes(t)).slice(0, MAX_TYPES)
}

/** 무한 스크롤 1회 추가 개수 (OQ-20 제안값, 확정 시 이 값만 바꾼다) */
export const PAGE_SIZE = 24

// URL에서는 세대를 숫자로 쓴다: gen=1 ↔ 'generation-i'
const genToParam = (gen: Generation) => String(GENERATIONS.indexOf(gen) + 1)
const paramToGen = (value: string | null): Generation | null => {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= GENERATIONS.length ? GENERATIONS[n - 1] : null
}

const parseSort = (value: string | null): SortKey => (value === 'name' || value === 'national' ? value : 'id')

/** 잘못된 값은 무시하고 기본값을 쓴다 */
export function parseFilters(params: URLSearchParams): PokedexFilters {
  return {
    q: params.get('q')?.trim() ?? '',
    // type=fire&type=flying (쉼표 구분 type=fire,flying도 읽는다)
    types: normalizeTypes(params.getAll('type').flatMap((v) => v.split(','))),
    gen: paramToGen(params.get('gen')),
    sort: parseSort(params.get('sort')),
  }
}

/** 기본값인 항목은 URL에 쓰지 않는다 */
export function toSearchParams(filters: PokedexFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  for (const type of normalizeTypes(filters.types)) params.append('type', type)
  if (filters.gen) params.set('gen', genToParam(filters.gen))
  if (filters.sort !== 'id') params.set('sort', filters.sort)
  return params
}

export function isDefaultFilters(filters: PokedexFilters): boolean {
  return !filters.q && filters.types.length === 0 && !filters.gen && filters.sort === 'id'
}

const nameCollator = new Intl.Collator('ko')

/**
 * regional: 고른 지방의 도감 순서(지방 도감 데이터가 있을 때). 없으면 세대(처음 나온 세대)로 거른다.
 */
export function applyFilters(
  list: PokemonSummary[],
  filters: PokedexFilters,
  regional?: ReadonlyMap<number, RegionalEntry>,
): PokemonSummary[] {
  const inScope = (p: PokemonSummary) =>
    !filters.gen || (regional ? regional.has(p.id) : p.generation === filters.gen)
  const filtered = list.filter(
    (p) => inScope(p) && matchesQuery(p, filters.q) && filters.types.every((t) => p.types.includes(t)),
  )
  if (filters.sort === 'name') {
    return filtered.sort((a, b) => nameCollator.compare(displayName(a), displayName(b)) || a.id - b.id)
  }
  if (filters.sort === 'id' && filters.gen && regional) {
    return filtered.sort((a, b) => regional.get(a.id)!.order - regional.get(b.id)!.order)
  }
  return filtered.sort((a, b) => a.id - b.id)
}

export function countByGeneration(list: PokemonSummary[]): Record<Generation, number> {
  const counts = Object.fromEntries(GENERATIONS.map((g) => [g, 0])) as Record<Generation, number>
  for (const p of list) counts[p.generation]++
  return counts
}
