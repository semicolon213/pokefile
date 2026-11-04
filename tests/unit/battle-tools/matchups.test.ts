import { describe, expect, it } from 'vitest'
import { POKEMON_TYPES } from '@/shared/models'
import { defensiveMatchups, normalizeTypeDefense } from '@/features/battle-tools/model/matchups'
import snapshot from '../../integration/battle-tools/task011-fixture.json'

const relations = POKEMON_TYPES.map((type) => normalizeTypeDefense(snapshot.types.find((entry) => entry.name === type), type))
const multiplier = (types: Parameters<typeof defensiveMatchups>[0], attack: string) => defensiveMatchups(types, relations).find((entry) => entry.type === attack)?.multiplier

describe('6세대 방어 상성 (FR-24 / TC-11)', () => {
  it('검증한 18개 타입을 모두 정규화하고 타입당 공격 배율 18개를 반환한다', () => {
    expect(relations).toHaveLength(18)
    for (const type of POKEMON_TYPES) expect(defensiveMatchups([type], relations)).toHaveLength(18)
  })
  it('불꽃·비행: 바위 4배, 풀 0.25배, 땅 무효를 계산한다', () => {
    expect(multiplier(['fire', 'flying'], 'rock')).toBe(4)
    expect(multiplier(['fire', 'flying'], 'grass')).toBe(0.25)
    expect(multiplier(['fire', 'flying'], 'ground')).toBe(0)
  })
  it('메가X 불꽃·드래곤: 바위 2배, 물·페어리 1배로 바뀐다', () => {
    expect(multiplier(['fire', 'dragon'], 'rock')).toBe(2)
    expect(multiplier(['fire', 'dragon'], 'water')).toBe(1)
    expect(multiplier(['fire', 'dragon'], 'fairy')).toBe(1)
  })
  it('무효는 다른 타입의 약점보다 우선한다', () => {
    expect(multiplier(['normal', 'ghost'], 'fighting')).toBe(0)
    expect(multiplier(['ground', 'water'], 'electric')).toBe(0)
  })
  it('6세대 강철의 악·고스트는 반감하지 않고 페어리는 반감한다', () => {
    expect(multiplier(['steel'], 'dark')).toBe(1)
    expect(multiplier(['steel'], 'ghost')).toBe(1)
    expect(multiplier(['steel'], 'fairy')).toBe(0.5)
  })
  it('이후 세대 변경 이력이 있으면 VI를 포함하는 가장 가까운 이력을 사용한다', () => {
    const base = snapshot.types.find((entry) => entry.name === 'fire')!
    const changed = normalizeTypeDefense({ ...base, past_damage_relations: [
      { generation: { name: 'generation-vii' }, damage_relations: { no_damage_from: [], half_damage_from: [], double_damage_from: [{ name: 'ice' }] } },
    ] }, 'fire')
    expect(defensiveMatchups(['fire'], [changed]).find((entry) => entry.type === 'ice')?.multiplier).toBe(2)
  })
  it('누락·충돌·다른 타입 응답을 임의의 1배로 채우지 않는다', () => {
    expect(() => defensiveMatchups(['water'], [])).toThrow(/누락/)
    expect(() => normalizeTypeDefense(snapshot.types[0], 'water')).toThrow(/일치/)
    expect(() => normalizeTypeDefense({ name: 'fire', generation: { name: 'generation-i' }, damage_relations: {
      no_damage_from: [{ name: 'ice' }], half_damage_from: [], double_damage_from: [{ name: 'ice' }],
    } }, 'fire')).toThrow(/충돌/)
  })
})
