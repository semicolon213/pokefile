import { describe, expect, it } from 'vitest'
import { applyFilters, DEFAULT_FILTERS, parseFilters } from '@/features/pokedex/model/filters'
import { dexesFor, editionLabel, formatRegionalNumber, regionalOrder } from '@/features/pokedex/model/regional'
import { findGameVersion } from '@/shared/state'
import type { PokemonSummary } from '@/shared/models'

const mon = (id: number, nameKo: string, generation: string): PokemonSummary => ({
  id, nameEn: nameKo, nameKo, types: ['normal'], generation, forms: [],
})
const LIST = [mon(16, '구구', 'generation-i'), mon(152, '치코리타', 'generation-ii'), mon(494, '비크티니', 'generation-v'), mon(495, '주리비얀', 'generation-v')]
const DATA = {
  'updated-johto': { start: 1, ids: [152, 16] },
  'original-unova': { start: 0, ids: [494, 495] },
  galar: { start: 1, ids: [16] },
  'isle-of-armor': { start: 1, ids: [152, 16] },
}

describe('지방 도감 판 고르기 (ADR-017)', () => {
  it('내 게임이 없으면 가장 많이 수록한 판을 쓴다', () => {
    expect(dexesFor('generation-ii', null)).toEqual(['updated-johto'])
    expect(dexesFor('generation-vi', null)).toEqual(['kalos-central', 'kalos-coastal', 'kalos-mountain'])
  })

  it('내 게임이 그 지방 게임이면 그 게임의 도감을 쓰고, 다른 지방이면 기본 판을 쓴다', () => {
    expect(dexesFor('generation-ii', findGameVersion('gold'))).toEqual(['original-johto'])
    expect(dexesFor('generation-i', findGameVersion('lets-go-eevee'))).toEqual(['letsgo-kanto'])
    expect(dexesFor('generation-vi', findGameVersion('legends-za'))).toEqual(['lumiose-city', 'hyperspace'])
    expect(dexesFor('generation-i', findGameVersion('heartgold'))).toEqual(['letsgo-kanto'])
    // 히스이는 사이드바 지방이 아니므로 8세대는 가라르 기본 판
    expect(dexesFor('generation-viii', findGameVersion('legends-arceus'))).toEqual(['galar', 'isle-of-armor', 'crown-tundra'])
  })

  it('판 안내는 그 도감 조합을 쓰는 게임 이름이다', () => {
    expect(editionLabel(['updated-johto'])).toBe('하트골드·소울실버')
    expect(editionLabel(['kalos-central', 'kalos-coastal', 'kalos-mountain'])).toBe('X·Y')
  })
})

describe('지방 도감 순서 (FR-31)', () => {
  it('도감을 이어 붙이고, 여러 도감에 있는 종은 처음 나온 도감 번호를 쓴다', () => {
    const order = regionalOrder(['galar', 'isle-of-armor'], DATA)
    expect([...order.keys()]).toEqual([16, 152])
    expect(formatRegionalNumber(order.get(16)!)).toBe('가라르 #001')
    expect(formatRegionalNumber(order.get(152)!)).toBe('갑옷의 외딴섬 #001')
  })

  it('하나 도감은 #000부터 시작한다', () => {
    expect(formatRegionalNumber(regionalOrder(['original-unova'], DATA).get(494)!)).toBe('하나 #000')
  })

  it('지방을 고르면 다른 세대 포켓몬도 포함한 지방 도감 전체를 지방 번호 순으로 보여 준다', () => {
    const regional = regionalOrder(['updated-johto'], DATA)
    const gen2 = { ...DEFAULT_FILTERS, gen: 'generation-ii' }
    expect(applyFilters(LIST, gen2, regional).map((p) => p.id)).toEqual([152, 16])
    expect(applyFilters(LIST, { ...gen2, sort: 'national' }, regional).map((p) => p.id)).toEqual([16, 152])
    expect(applyFilters(LIST, { ...gen2, sort: 'name' }, regional).map((p) => p.nameKo)).toEqual(['구구', '치코리타'])
  })

  it('지방 도감 데이터가 없으면 처음 나온 세대로 거른다', () => {
    expect(applyFilters(LIST, { ...DEFAULT_FILTERS, gen: 'generation-ii' }).map((p) => p.id)).toEqual([152])
  })

  it('sort=national을 URL에서 읽는다', () => {
    expect(parseFilters(new URLSearchParams('gen=2&sort=national')).sort).toBe('national')
    expect(parseFilters(new URLSearchParams('sort=weird')).sort).toBe('id')
  })
})
