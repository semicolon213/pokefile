import { describe, expect, it } from 'vitest'
import type { PokemonForm } from '@/shared/models'
import { availableForms, pokemonResourceName, resolveFormKey } from '@/features/pokemon-detail/model/forms'

const familyOfThree: PokemonForm = {
  key: 'family-of-three', nameKo: '세 식구', nameEn: 'Family of Three',
  category: 'other', types: ['normal'], battleOnly: false,
}

describe('파밀리쥐 폼 표시 (TASK-025 / D-04 / CR-025-D04-DETAIL / TC-04·06)', () => {
  it('세 식구를 먼저 표시하고 네 식구는 실제 기본 폼에 연결한다', () => {
    expect(availableForms([familyOfThree], 925)).toEqual([
      { key: 'family-of-three', label: '세 식구', category: 'other' },
      { key: 'default', label: '네 식구', category: 'default' },
    ])
    expect(pokemonResourceName('maushold', 'family-of-three')).toBe('maushold-family-of-three')
  })

  it.each([
    [null, 'family-of-three'],
    [undefined, 'family-of-three'],
    ['', 'family-of-three'],
    ['family-of-three', 'family-of-three'],
    ['default', 'default'],
    ['unknown', 'family-of-three'],
    ['INVALID!', 'family-of-three'],
  ])('파밀리쥐 ?form=%s는 %s를 표시한다', (param, expected) => {
    expect(resolveFormKey(param, availableForms([familyOfThree], 925))).toBe(expected)
  })

  it('폼 인덱스를 사용할 수 없으면 실제 기본 폼만 제공한다', () => {
    const forms = availableForms([], 925)
    expect(forms).toEqual([{ key: 'default', label: '네 식구', category: 'default' }])
    expect(resolveFormKey(null, forms)).toBe('default')
  })
})
