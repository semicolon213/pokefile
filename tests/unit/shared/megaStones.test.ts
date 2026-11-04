import { describe, expect, it } from 'vitest'
import indexJson from '../../../public/data/pokedex-index.json?raw'
import type { PokemonSummary } from '@/shared/models'
import { GEN6_MEGA_STONES, isGen6MegaStone, megaStoneFor, toShowdownId } from '@/shared/utils'

describe('6세대 메가스톤 대응 (ADR-009 / CR-007-INTEGRATION)', () => {
  it('도감 인덱스의 48개 메가 폼 중 스톤이 있는 47개만 대응한다', () => {
    const index = JSON.parse(indexJson) as { pokemon: PokemonSummary[] }
    const forms = index.pokemon.flatMap((pokemon) => pokemon.megaForms.map((form) => ({ name: pokemon.nameEn, form })))
    expect(forms).toHaveLength(48)
    const mapped = forms.filter(({ name, form }) => megaStoneFor(name, form) !== undefined)
    expect(mapped).toHaveLength(47)
    expect(mapped.map(({ name, form }) => toShowdownId(`${name}-${form}`)).sort())
      .toEqual(Object.keys(GEN6_MEGA_STONES).sort())
    expect(forms.filter(({ name, form }) => !megaStoneFor(name, form)).map(({ name }) => name.toLowerCase()))
      .toEqual(['rayquaza'])
  })

  it('리자몽·뮤츠의 X/Y 스톤을 구분한다', () => {
    expect(megaStoneFor('charizard', 'mega-x')).toBe('Charizardite X')
    expect(megaStoneFor('Charizard', 'mega-y')).toBe('Charizardite Y')
    expect(megaStoneFor('mewtwo', 'mega-x')).toBe('Mewtwonite X')
    expect(megaStoneFor('mewtwo', 'mega-y')).toBe('Mewtwonite Y')
  })

  it('기본·미지원·CAP 폼과 메가레쿠쟈에 스톤을 추정하지 않는다', () => {
    expect(megaStoneFor('charizard', 'default')).toBeUndefined()
    expect(megaStoneFor('charizard', 'mega')).toBeUndefined()
    expect(megaStoneFor('pikachu', 'mega')).toBeUndefined()
    expect(megaStoneFor('crucibelle', 'mega')).toBeUndefined()
    expect(megaStoneFor('rayquaza', 'mega')).toBeUndefined()
    expect(isGen6MegaStone('Eviolite')).toBe(false)
    expect(isGen6MegaStone('Charizardite X')).toBe(true)
  })
})
