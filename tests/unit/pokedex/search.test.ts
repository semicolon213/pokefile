import { describe, expect, it } from 'vitest'
import { matchesQuery, normalizeText, parseDexNumberQuery, searchPokemon } from '@/features/pokedex/model/search'
import type { PokemonSummary } from '@/shared/models'

const p = (id: number, nameEn: string, nameKo?: string): PokemonSummary => ({
  id,
  nameEn,
  nameKo,
  types: ['normal'],
  generation: 'generation-i',
  megaForms: [],
})

const LIST = [
  p(1, 'Bulbasaur', '이상해씨'),
  p(2, 'Ivysaur', '이상해풀'),
  p(25, 'Pikachu', '피카츄'),
  p(122, 'Mr. Mime', '마임맨'),
  p(250, 'Ho-Oh', '칠색조'),
  p(669, 'Flabébé', '플라베베'),
  p(700, 'Sylveon'),
]

describe('parseDexNumberQuery', () => {
  it('번호 형식을 인식한다', () => {
    expect(parseDexNumberQuery('25')).toBe(25)
    expect(parseDexNumberQuery('#25')).toBe(25)
    expect(parseDexNumberQuery('025')).toBe(25)
    expect(parseDexNumberQuery(' #0025 ')).toBe(25)
    expect(parseDexNumberQuery('pikachu')).toBeNull()
    expect(parseDexNumberQuery('25a')).toBeNull()
  })
})

describe('normalizeText', () => {
  it('공백·대소문자·악센트·구두점을 무시한다', () => {
    expect(normalizeText('Flabébé')).toBe('flabebe')
    expect(normalizeText(' Mr. Mime ')).toBe('mrmime')
    expect(normalizeText('Farfetch’d')).toBe(normalizeText("Farfetch'd"))
    expect(normalizeText('Porygon-Z')).toBe('porygonz')
    expect(normalizeText('이상 해씨')).toBe('이상해씨')
  })
})

describe('matchesQuery / searchPokemon', () => {
  it('FR-01 한국어 이름 부분 일치', () => {
    expect(searchPokemon(LIST, '피카츄').map((x) => x.id)).toEqual([25])
    expect(searchPokemon(LIST, '이상해').map((x) => x.id)).toEqual([1, 2])
    expect(searchPokemon(LIST, '이상 해').map((x) => x.id)).toEqual([1, 2])
  })

  it('FR-02 영어 이름 부분 일치(대소문자·악센트 무시)', () => {
    expect(searchPokemon(LIST, 'pikachu').map((x) => x.id)).toEqual([25])
    expect(searchPokemon(LIST, 'SAUR').map((x) => x.id)).toEqual([1, 2])
    expect(searchPokemon(LIST, 'flabebe').map((x) => x.id)).toEqual([669])
    expect(searchPokemon(LIST, 'mr. mime').map((x) => x.id)).toEqual([122])
    expect(searchPokemon(LIST, 'mr mime').map((x) => x.id)).toEqual([122])
    expect(searchPokemon(LIST, 'mrmime').map((x) => x.id)).toEqual([122])
    expect(searchPokemon(LIST, 'ho-oh').map((x) => x.id)).toEqual([250])
    expect(searchPokemon(LIST, 'hooh').map((x) => x.id)).toEqual([250])
  })

  it('FR-03 도감 번호는 정확히 일치', () => {
    expect(searchPokemon(LIST, '25').map((x) => x.id)).toEqual([25])
    expect(searchPokemon(LIST, '#0001').map((x) => x.id)).toEqual([1])
    expect(searchPokemon(LIST, '2').map((x) => x.id)).toEqual([2])
    expect(searchPokemon(LIST, '999')).toEqual([])
  })

  it('한국어 이름이 없으면 영어 이름으로 검색된다', () => {
    expect(matchesQuery(LIST[6], 'sylveon')).toBe(true)
    expect(matchesQuery(LIST[6], '님피아')).toBe(false)
  })

  it('빈 검색어는 전체를 반환한다', () => {
    expect(searchPokemon(LIST, '   ')).toHaveLength(LIST.length)
  })
})
