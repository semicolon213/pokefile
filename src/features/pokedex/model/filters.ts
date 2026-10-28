import { GENERATIONS, POKEMON_TYPES, type Generation, type PokemonSummary, type PokemonType } from '@/shared/models'
import { displayName } from '@/shared/utils'
import { matchesQuery } from './search'

// ADR-011: 검색어 AND 타입 AND 세대, 정렬은 도감 번호순(기본)·이름순. 상태는 URL 쿼리와 동기화한다.

export type SortKey = 'id' | 'name'

export type PokedexFilters = {
  q: string
  type: PokemonType | null
  gen: Generation | null
  sort: SortKey
}

export const DEFAULT_FILTERS: PokedexFilters = { q: '', type: null, gen: null, sort: 'id' }

/** 무한 스크롤 1회 추가 개수 (OQ-20 제안값, 확정 시 이 값만 바꾼다) */
export const PAGE_SIZE = 24

// URL에서는 세대를 숫자로 쓴다: gen=1 ↔ 'generation-i'
const genToParam = (gen: Generation) => String(GENERATIONS.indexOf(gen) + 1)
const paramToGen = (value: string | null): Generation | null => {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= GENERATIONS.length ? GENERATIONS[n - 1] : null
}

/** 잘못된 값은 무시하고 기본값을 쓴다 */
export function parseFilters(params: URLSearchParams): PokedexFilters {
  const type = params.get('type')
  return {
    q: params.get('q')?.trim() ?? '',
    type: (POKEMON_TYPES as readonly string[]).includes(type ?? '') ? (type as PokemonType) : null,
    gen: paramToGen(params.get('gen')),
    sort: params.get('sort') === 'name' ? 'name' : 'id',
  }
}

/** 기본값인 항목은 URL에 쓰지 않는다 */
export function toSearchParams(filters: PokedexFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.type) params.set('type', filters.type)
  if (filters.gen) params.set('gen', genToParam(filters.gen))
  if (filters.sort !== 'id') params.set('sort', filters.sort)
  return params
}

export function isDefaultFilters(filters: PokedexFilters): boolean {
  return !filters.q && !filters.type && !filters.gen && filters.sort === 'id'
}

const nameCollator = new Intl.Collator('ko')

export function applyFilters(list: PokemonSummary[], filters: PokedexFilters): PokemonSummary[] {
  const filtered = list.filter(
    (p) =>
      matchesQuery(p, filters.q) &&
      (!filters.type || p.types.includes(filters.type)) &&
      (!filters.gen || p.generation === filters.gen),
  )
  return filters.sort === 'name'
    ? filtered.sort((a, b) => nameCollator.compare(displayName(a), displayName(b)) || a.id - b.id)
    : filtered.sort((a, b) => a.id - b.id)
}

export function countByGeneration(list: PokemonSummary[]): Record<Generation, number> {
  const counts = Object.fromEntries(GENERATIONS.map((g) => [g, 0])) as Record<Generation, number>
  for (const p of list) counts[p.generation]++
  return counts
}
