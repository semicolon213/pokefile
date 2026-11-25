import { describe, expect, it } from 'vitest'
import { normalizeSmogonSets, selectSmogonSets } from '@/features/battle-tools/model/smogon'
import { ADDITIONAL_INDEX, ADDITIONAL_SMOGON } from '../../integration/shared/additional-form-fixtures'

const cases = ADDITIONAL_INDEX.flatMap((pokemon) => pokemon.forms.map((form) => ({
  speciesName: pokemon.nameEn.toLowerCase(), formKey: form.key, resourceName: form.resource!.name,
  generation: pokemon.id === 773 ? 7 : 9,
})))

describe('C-01 추가 폼 실전 세팅 매핑 (TASK-025 / TC-06)', () => {
  it.each(cases)('$resourceName 세팅을 정확한 $formKey 폼에 연결한다', ({ speciesName, formKey, resourceName, generation }) => {
    const data = normalizeSmogonSets(ADDITIONAL_SMOGON)
    const result = selectSmogonSets(data, { speciesName, formKey }, generation)
    expect(result.flatMap(({ sets }) => sets.map(({ name }) => name))).toEqual([`${resourceName} set`])
  })

  it.each(['arceus', 'silvally', 'sinistcha'])('%s 추가 폼 세팅이 없으면 기본 세팅으로 채우지 않는다', (speciesName) => {
    const data = normalizeSmogonSets({ [speciesName]: { ou: { Normal: { moves: ['Protect'] } } } })
    const formKey = speciesName === 'sinistcha' ? 'masterpiece' : 'fire'
    expect(selectSmogonSets(data, { speciesName, formKey }, 9)).toEqual([])
  })

  it('35폼 조회 후에도 원본 세팅 캐시를 변경하지 않는다', () => {
    const data = normalizeSmogonSets(ADDITIONAL_SMOGON)
    const before = JSON.stringify(data)
    for (const { speciesName, formKey, generation } of cases) selectSmogonSets(data, { speciesName, formKey }, generation)
    expect(JSON.stringify(data)).toBe(before)
  })
})
