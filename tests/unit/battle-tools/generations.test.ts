import { describe, expect, it } from 'vitest'
import { smogonGenerations, supportsSmogonForm } from '@/features/battle-tools/model/generations'

describe('Smogon 세대 설정 호환 (TASK-025 / TC-06)', () => {
  it('새 설정을 최신순·중복 없이 읽으며 단일 세대 설정도 지원한다', () => {
    expect(smogonGenerations({ smogon: { generation: 6, generations: [6, 9, 7, 8, 9] } })).toEqual([9, 8, 7, 6])
    expect(smogonGenerations({ smogon: { generation: 6 } })).toEqual([6])
  })

  it('잘못된 세대 값으로 요청을 만들지 않는다', () => {
    expect(smogonGenerations({ smogon: { generation: 6, generations: [NaN, 0, -1, 6.5, 9] } })).toEqual([9])
  })

  it('메가는 6·7세대만 지원하고 일반·리전폼은 세대별로 조회한다', () => {
    for (const form of ['mega', 'mega-x', 'mega-z', 'female-mega', 'male-mega']) {
      expect([9, 8, 7, 6].filter((gen) => supportsSmogonForm(gen, form))).toEqual([7, 6])
    }
    expect(supportsSmogonForm(9, 'alola')).toBe(true)
    expect(supportsSmogonForm(8, 'gmax')).toBe(true)
  })
})
