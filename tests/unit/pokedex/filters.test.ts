import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FILTERS,
  applyFilters,
  countByGeneration,
  isDefaultFilters,
  parseFilters,
  toSearchParams,
} from '@/features/pokedex/model/filters'
import type { PokemonSummary } from '@/shared/models'

const p = (id: number, nameKo: string, types: PokemonSummary['types'], generation: PokemonSummary['generation']): PokemonSummary => ({
  id,
  nameEn: `en-${id}`,
  nameKo,
  types,
  generation,
  megaForms: [],
})

const LIST = [
  p(6, '리자몽', ['fire', 'flying'], 'generation-i'),
  p(4, '파이리', ['fire'], 'generation-i'),
  p(155, '브케인', ['fire'], 'generation-ii'),
  p(25, '피카츄', ['electric'], 'generation-i'),
  p(700, '님피아', ['fairy'], 'generation-vi'),
]
const ids = (list: PokemonSummary[]) => list.map((x) => x.id)

describe('parseFilters / toSearchParams', () => {
  it('URL 쿼리를 필터로 읽는다', () => {
    expect(parseFilters(new URLSearchParams('q=피카&type=electric&gen=1&sort=name'))).toEqual({
      q: '피카',
      type: 'electric',
      gen: 'generation-i',
      sort: 'name',
    })
  })

  it('잘못된 값은 무시한다', () => {
    expect(parseFilters(new URLSearchParams('type=shadow&gen=7&sort=weight'))).toEqual(DEFAULT_FILTERS)
    expect(parseFilters(new URLSearchParams('gen=0'))).toEqual(DEFAULT_FILTERS)
    expect(parseFilters(new URLSearchParams('gen=abc'))).toEqual(DEFAULT_FILTERS)
  })

  it('기본값은 URL에 쓰지 않고, 왕복 변환이 같다', () => {
    expect(toSearchParams(DEFAULT_FILTERS).toString()).toBe('')
    const filters = { q: '리자몽', type: 'fire', gen: 'generation-vi', sort: 'name' } as const
    expect(parseFilters(toSearchParams(filters))).toEqual(filters)
    expect(toSearchParams(filters).get('gen')).toBe('6')
  })

  it('isDefaultFilters', () => {
    expect(isDefaultFilters(DEFAULT_FILTERS)).toBe(true)
    expect(isDefaultFilters({ ...DEFAULT_FILTERS, sort: 'name' })).toBe(false)
  })
})

describe('applyFilters', () => {
  it('기본은 도감 번호순', () => {
    expect(ids(applyFilters(LIST, DEFAULT_FILTERS))).toEqual([4, 6, 25, 155, 700])
  })

  it('FR-04 타입 필터 (복합 타입 포함)', () => {
    expect(ids(applyFilters(LIST, { ...DEFAULT_FILTERS, type: 'fire' }))).toEqual([4, 6, 155])
    expect(ids(applyFilters(LIST, { ...DEFAULT_FILTERS, type: 'flying' }))).toEqual([6])
  })

  it('FR-05 세대 필터', () => {
    expect(ids(applyFilters(LIST, { ...DEFAULT_FILTERS, gen: 'generation-i' }))).toEqual([4, 6, 25])
  })

  it('검색어 AND 타입 AND 세대', () => {
    expect(ids(applyFilters(LIST, { q: '리', type: 'fire', gen: 'generation-i', sort: 'id' }))).toEqual([4, 6])
    expect(ids(applyFilters(LIST, { q: '피카츄', type: 'fire', gen: null, sort: 'id' }))).toEqual([])
  })

  it('FR-06 이름순은 한국어 가나다순', () => {
    expect(applyFilters(LIST, { ...DEFAULT_FILTERS, sort: 'name' }).map((x) => x.nameKo)).toEqual([
      '님피아',
      '리자몽',
      '브케인',
      '파이리',
      '피카츄',
    ])
  })

  it('원본 배열을 바꾸지 않는다', () => {
    const before = ids(LIST)
    applyFilters(LIST, { ...DEFAULT_FILTERS, sort: 'name' })
    expect(ids(LIST)).toEqual(before)
  })
})

describe('countByGeneration', () => {
  it('세대별 수를 센다', () => {
    expect(countByGeneration(LIST)).toEqual({
      'generation-i': 3,
      'generation-ii': 1,
      'generation-iii': 0,
      'generation-iv': 0,
      'generation-v': 0,
      'generation-vi': 1,
    })
  })
})
