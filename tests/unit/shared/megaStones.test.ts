import { describe, expect, it } from 'vitest'
import indexJson from '../../../public/data/pokedex-index.json?raw'
import type { PokemonSummary } from '@/shared/models'
import { GEN6_MEGA_STONES, isGen6MegaStone, megaStoneFor, toShowdownId } from '@/shared/utils'

describe('6세대 메가스톤 대응 (ADR-009 / CR-007-INTEGRATION)', () => {
  it('6세대 메가스톤 47개는 모두 도감 인덱스의 메가 폼과 대응한다 (인덱스는 메가 97개, ADR-016)', () => {
    const index = JSON.parse(indexJson) as { pokemon: PokemonSummary[] }
    const forms = index.pokemon.flatMap((pokemon) =>
      pokemon.forms.filter((f) => f.category === 'mega').map((f) => ({ name: pokemon.nameEn, form: f.key })),
    )
    expect(forms).toHaveLength(97)
    const mapped = forms.filter(({ name, form }) => megaStoneFor(name, form) !== undefined)
    expect(mapped.map(({ name, form }) => toShowdownId(`${name}-${form}`)).sort())
      .toEqual(Object.keys(GEN6_MEGA_STONES).sort())
    // 메가레쿠쟈는 인덱스에 있지만 스톤이 없다. 6세대 이후 메가의 스톤은 TASK-025에서 다룬다.
    expect(forms).toContainEqual({ name: 'Rayquaza', form: 'mega' })
    expect(megaStoneFor('rayquaza', 'mega')).toBeUndefined()
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
