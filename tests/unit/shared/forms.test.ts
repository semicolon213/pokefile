import { describe, expect, it } from 'vitest'
import indexJson from '../../../public/data/pokedex-index.json?raw'
import translationJson from '../../../scripts/data/form-names-ko.json?raw'
import { formCategoryOf, formKeyOf, formNameKoOf } from '../../../scripts/lib/form-names.mjs'
import { parseFormKey, type PokemonSummary } from '@/shared/models'
import { formFullName, formLabel } from '@/shared/utils'

const index = JSON.parse(indexJson) as { pokemon: PokemonSummary[] }
const translations = (JSON.parse(translationJson) as { names: Record<string, string>; unverified: string[] })
const byName = (nameEn: string) => index.pokemon.find((p) => p.nameEn === nameEn)!

describe('폼 키·분류·한국어 이름 규칙 (ADR-016)', () => {
  it('폼 키는 pokemon 이름에서 종 이름을 뺀 부분이다', () => {
    expect(formKeyOf('charizard-mega-x', 'charizard')).toBe('mega-x')
    expect(formKeyOf('tauros-paldea-combat-breed', 'tauros')).toBe('paldea-combat-breed')
    expect(formKeyOf('mr-mime-galar', 'mr-mime')).toBe('galar')
    expect(() => formKeyOf('pikachu', 'raichu')).toThrow()
  })

  it.each([
    ['mega-x', true, 'mega'],
    ['gmax', false, 'gmax'],
    ['amped-gmax', false, 'gmax'],
    ['alola', false, 'regional'],
    ['galar-standard', false, 'regional'],
    ['paldea-aqua-breed', false, 'regional'],
    ['alola-cap', false, 'other'],
    ['totem-alola', false, 'other'],
    ['galar-zen', false, 'other'],
    ['wash', false, 'other'],
  ] as const)('%s → %s', (key, isMega, expected) => {
    expect(formCategoryOf(key, isMega)).toBe(expected)
  })

  it('번역표 → API 이름 → 규칙 순서로 정한다', () => {
    const base = { speciesKo: '라이츄', translations: { 'raichu-mega-x': '번역표' } }
    expect(formNameKoOf({ ...base, pokemonName: 'raichu-mega-x', key: 'mega-x', category: 'mega', apiNameKo: 'API' })).toBe('번역표')
    expect(formNameKoOf({ ...base, pokemonName: 'raichu-alola', key: 'alola', category: 'regional', apiNameKo: 'API' })).toBe('API')
    expect(formNameKoOf({ ...base, pokemonName: 'raichu-mega-y', key: 'mega-y', category: 'mega' })).toBe('메가라이츄Y')
    expect(formNameKoOf({ ...base, pokemonName: 'clefable-mega', key: 'mega', category: 'mega', speciesKo: '픽시' })).toBe('메가픽시')
    expect(formNameKoOf({ ...base, pokemonName: 'x-gmax', key: 'gmax', category: 'gmax' })).toBe('거다이맥스')
    expect(formNameKoOf({ ...base, pokemonName: 'x-hisui', key: 'hisui', category: 'regional' })).toBe('히스이의 모습')
    expect(formNameKoOf({ ...base, pokemonName: 'x', key: 'paldea-blaze-breed', category: 'regional' })).toBe('팔데아의 모습·블레이즈종')
    expect(formNameKoOf({ ...base, pokemonName: 'x-foo', key: 'foo', category: 'other' })).toBeUndefined()
  })

  it('번역표의 검수 전 목록은 번역표에 있는 폼만 가리킨다 (OQ-26)', () => {
    for (const name of translations.unverified) expect(translations.names).toHaveProperty(name)
  })
})

describe('검색 인덱스의 폼 (ADR-016)', () => {
  const forms = index.pokemon.flatMap((p) => p.forms)

  it('기본 폼이 아닌 폼 326개를 분류별로 모두 담는다', () => {
    const count = (c: string) => forms.filter((f) => f.category === c).length
    expect(forms).toHaveLength(326)
    expect([count('mega'), count('gmax'), count('regional'), count('other')]).toEqual([97, 34, 57, 138])
  })

  it('모든 폼 키가 URL ?form= 형식이고 종 안에서 겹치지 않으며, 한국어 이름이 겹치지 않는다', () => {
    for (const p of index.pokemon) {
      for (const f of p.forms) expect(parseFormKey(f.key)).toBe(f.key)
      expect(new Set(p.forms.map((f) => f.key)).size).toBe(p.forms.length)
      expect(new Set(p.forms.map(formLabel)).size).toBe(p.forms.length)
    }
  })

  it('메가레쿠쟈·최신 메가·리전폼·거다이맥스가 빠지지 않는다', () => {
    expect(byName('Rayquaza').forms.map((f) => f.key)).toContain('mega')
    expect(byName('Raichu').forms.map((f) => f.key)).toEqual(['alola', 'mega-x', 'mega-y'])
    expect(byName('Charizard').forms.map((f) => f.key)).toEqual(['mega-x', 'mega-y', 'gmax'])
    expect(byName('Kyogre').forms.map((f) => f.key)).toContain('primal')
  })
})

describe('폼 전체 이름 (ADR-016)', () => {
  const form = (nameKo: string | undefined, category: 'mega' | 'gmax' | 'regional' | 'other', nameEn = 'Form') => ({ nameKo, nameEn, category })

  it.each([
    ['리자몽', form('메가리자몽X', 'mega'), '메가리자몽X'],
    ['리자몽', form('거다이맥스', 'gmax'), '거다이맥스 리자몽'],
    ['라이츄', form('알로라의 모습', 'regional'), '라이츄 (알로라의 모습)'],
    ['로토무', form('워시로토무', 'other'), '워시로토무'],
    ['스트린더', form('거다이맥스·하이한 모습', 'gmax'), '스트린더 (거다이맥스·하이한 모습)'],
    ['피카츄', form(undefined, 'other', 'Starter'), '피카츄 (Starter)'],
  ] as const)('%s + %o → %s', (species, f, expected) => {
    expect(formFullName(species, f)).toBe(expected)
  })
})
