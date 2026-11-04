import { describe, expect, it } from 'vitest'
import { normalizeGen6SmogonSets, selectSmogonSets } from '@/features/battle-tools/model/smogon'

const base = { moves: ['Flamethrower'], ability: 'Blaze', nature: 'Timid', evs: { spa: 252, spe: 252 } }
const raw = {
  Charizard: { ou: {
    Base: { ...base, item: 'Leftovers' },
    X: { ...base, item: 'Charizardite X' },
    Y: { ...base, item: 'Charizardite Y' },
    Mixed: { ...base, item: ['Life Orb', 'Charizardite X'] },
  } },
  'Charizard-Mega-X': { ou: {
    X: { ...base, item: 'Charizardite X' },
    Direct: { ...base, item: 'Charizardite X', moves: ['Dragon Claw'] },
  } },
  Rayquaza: { anythinggoes: { Base: { ...base, item: 'Life Orb', moves: ['Dragon Ascent'] } } },
  'Rayquaza-Mega': { anythinggoes: { Direct: { ...base, moves: ['Dragon Ascent'] } } },
}

describe('선택 폼에 맞는 세팅 추출 (TC-06)', () => {
  it('메가 스톤과 정확한 메가 이름 키를 합치고 중복 후보를 제거한다', () => {
    const data = normalizeGen6SmogonSets(raw)
    const result = selectSmogonSets(data, { speciesName: 'charizard', formKey: 'mega-x' })
    expect(result[0].sets.map((set) => set.name)).toEqual(['X', 'Mixed', 'Direct'])
    expect(result[0].sets.every((set) => set.items.every((item) => item === 'Charizardite X'))).toBe(true)
  })

  it('기본 폼은 메가 전용 후보를 제외하고 일반 아이템 선택지를 남긴다', () => {
    const result = selectSmogonSets(normalizeGen6SmogonSets(raw), { speciesName: 'charizard', formKey: 'default' })
    expect(result[0].sets.map((set) => [set.name, set.items])).toEqual([
      ['Base', ['Leftovers']], ['Mixed', ['Life Orb']],
    ])
  })

  it('메가Y에 X·기본 폼 세팅을 섞지 않으며 원본 후보를 변경하지 않는다', () => {
    const data = normalizeGen6SmogonSets(raw)
    const before = JSON.stringify(data)
    const result = selectSmogonSets(data, { speciesName: 'charizard', formKey: 'mega-y' })
    expect(result[0].sets.map((set) => set.name)).toEqual(['Y'])
    expect(result[0].sets[0].items).toEqual(['Charizardite Y'])
    expect(JSON.stringify(data)).toBe(before)
  })

  it('미지원 폼·데이터 부재·메가레쿠쟈를 다른 폼으로 대체하지 않는다', () => {
    const data = normalizeGen6SmogonSets(raw)
    expect(selectSmogonSets(data, { speciesName: 'charizard', formKey: 'mega' })).toEqual([])
    expect(selectSmogonSets(data, { speciesName: 'pikachu', formKey: 'mega' })).toEqual([])
    expect(selectSmogonSets(data, { speciesName: 'caterpie', formKey: 'default' })).toEqual([])
    expect(selectSmogonSets(data, { speciesName: 'rayquaza', formKey: 'mega' })).toEqual([])
    expect(selectSmogonSets(data, { speciesName: 'rayquaza', formKey: 'default' })).toHaveLength(1)
  })
})
