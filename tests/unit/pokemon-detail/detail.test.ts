import { describe, expect, it } from 'vitest'
import type { RawPokemon, RawSpecies } from '@/features/pokemon-detail/api/pokeapi'
import { pickFlavorText, statTotal, toFormDetail, toSpeciesDetail } from '@/features/pokemon-detail/model/detail'
import { availableForms, pokemonResourceName, resolveFormKey } from '@/features/pokemon-detail/model/forms'

const res = (name: string, url = '') => ({ name, url })
const lang = (name: string) => res(name)

const charizardMegaX: RawPokemon = {
  id: 10034,
  name: 'charizard-mega-x',
  height: 17,
  weight: 1105,
  types: [
    { slot: 2, type: res('dragon') },
    { slot: 1, type: res('fire') },
  ],
  abilities: [{ slot: 1, is_hidden: false, ability: res('tough-claws') }],
  stats: [
    { base_stat: 78, stat: res('hp') },
    { base_stat: 130, stat: res('attack') },
    { base_stat: 111, stat: res('defense') },
    { base_stat: 130, stat: res('special-attack') },
    { base_stat: 85, stat: res('special-defense') },
    { base_stat: 100, stat: res('speed') },
  ],
  sprites: { front_default: 'png', other: { showdown: { front_default: 'gif' } } },
  forms: [res('charizard-mega-x')],
}

describe('toFormDetail (FR-11·12·14)', () => {
  it('단위를 m·kg로 바꾸고 타입은 slot 순서, 종족값은 고정 순서로 정규화한다', () => {
    const form = toFormDetail(charizardMegaX)
    expect(form.heightM).toBe(1.7)
    expect(form.weightKg).toBe(110.5)
    expect(form.types).toEqual(['fire', 'dragon'])
    expect(form.stats.map((s) => [s.label, s.value])).toEqual([
      ['HP', 78],
      ['공격', 130],
      ['방어', 111],
      ['특수공격', 130],
      ['특수방어', 85],
      ['스피드', 100],
    ])
    expect(statTotal(form.stats)).toBe(634)
  })

  it('이미지는 showdown GIF → PNG 순서이고 없는 값은 건너뛴다 (ADR-013)', () => {
    expect(toFormDetail(charizardMegaX).imageUrls).toEqual(['gif', 'png'])
    expect(toFormDetail({ ...charizardMegaX, sprites: { front_default: 'png' } }).imageUrls).toEqual(['png'])
  })
})

describe('도감 설명 버전 (OQ-17 제안값)', () => {
  const entry = (version: string, language: string, text: string) => ({
    flavor_text: text,
    language: lang(language),
    version: res(version),
  })

  it('x 버전 한국어 설명을 우선하고 줄바꿈을 공백으로 바꾼다', () => {
    expect(
      pickFlavorText([entry('sword', 'ko', '검'), entry('omega-ruby', 'ko', '오루'), entry('x', 'ko', '입에서\n불꽃을\f토한다.')]),
    ).toBe('입에서 불꽃을 토한다.')
  })

  it('x가 없으면 omega-ruby를 쓰고, 6세대 ko 설명이 없으면 undefined', () => {
    expect(pickFlavorText([entry('x', 'en', 'en'), entry('omega-ruby', 'ko', '오루')])).toBe('오루')
    expect(pickFlavorText([entry('sword', 'ko', '검')])).toBeUndefined()
  })
})

describe('toSpeciesDetail (FR-12)', () => {
  it('한국어 이름·분류와 진화 체인 ID를 추출한다', () => {
    const raw: RawSpecies = {
      id: 6,
      name: 'charizard',
      names: [
        { name: '리자몽', language: lang('ko') },
        { name: 'Charizard', language: lang('en') },
      ],
      genera: [
        { genus: 'Flame Pokémon', language: lang('en') },
        { genus: '화염포켓몬', language: lang('ko') },
      ],
      flavor_text_entries: [],
      evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/2/' },
    }
    expect(toSpeciesDetail(raw)).toEqual({
      id: 6,
      name: 'charizard',
      nameKo: '리자몽',
      nameEn: 'Charizard',
      genus: '화염포켓몬',
      flavorText: undefined,
      evolutionChainId: 2,
    })
  })
})

describe('메가 폼 결정 (ADR-009·011)', () => {
  const charizard = availableForms(['mega-x', 'mega-y'])

  it('기본 폼이 항상 먼저 온다', () => {
    expect(charizard).toEqual(['default', 'mega-x', 'mega-y'])
    expect(availableForms([])).toEqual(['default'])
  })

  it.each([
    ['mega-x', charizard, 'mega-x'],
    [null, charizard, 'default'],
    ['abc', charizard, 'default'],
    ['mega', charizard, 'default'],
    ['mega-x', ['default'], 'default'],
  ] as const)('?form=%s → %s', (param, forms, expected) => {
    expect(resolveFormKey(param, forms)).toBe(expected)
  })

  it('메가 리소스 이름은 {species-name}-{formKey}', () => {
    expect(pokemonResourceName('charizard', 'mega-x')).toBe('charizard-mega-x')
    expect(pokemonResourceName('venusaur', 'mega')).toBe('venusaur-mega')
  })
})
