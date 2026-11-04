import { describe, expect, it } from 'vitest'
import chart from '@/features/type-chart/data/type-chart.json'
import { damageTaken, defenseGroups, formatMultiplier, typeEffectiveness } from '@/features/type-chart/model/matchup'
import { parseDefenseTypes } from '@/features/type-chart/model/params'
import { POKEMON_TYPES } from '@/shared/models'

describe('타입 상성 데이터 (PokéAPI damage_relations, 6세대 이후)', () => {
  it('18개 공격 타입이 모두 있고 1배가 아닌 칸은 120개다', () => {
    expect(Object.keys(chart.attack).sort()).toEqual([...POKEMON_TYPES].sort())
    const cells = Object.values(chart.attack).flatMap((row) => Object.values(row))
    expect(cells).toHaveLength(120)
    expect(cells.every((m) => m === 0 || m === 0.5 || m === 2)).toBe(true)
  })

  it.each([
    ['normal', 'ghost', 0],
    ['dragon', 'fairy', 0],
    ['ground', 'flying', 0],
    ['fire', 'grass', 2],
    ['water', 'fire', 2],
    ['steel', 'fairy', 2],
    ['fire', 'water', 0.5],
    ['ghost', 'dark', 0.5],
    ['normal', 'fire', 1],
  ] as const)('%s → %s = ×%s', (atk, def, m) => {
    expect(typeEffectiveness(atk, def)).toBe(m)
  })
})

describe('받는 피해 (두 타입은 곱한다)', () => {
  it('리자몽(불꽃·비행): 바위 ×4, 땅 무효, 풀·벌레 ×¼', () => {
    expect(damageTaken('rock', ['fire', 'flying'])).toBe(4)
    expect(damageTaken('ground', ['fire', 'flying'])).toBe(0)
    const groups = Object.fromEntries(defenseGroups(['fire', 'flying']).map((g) => [g.multiplier, g.types]))
    expect(groups[4]).toEqual(['rock'])
    expect(groups[2]).toEqual(['water', 'electric'])
    expect(groups[0.25]).toEqual(['grass', 'bug'])
    expect(groups[0]).toEqual(['ground'])
  })

  it('1배인 묶음과 빈 묶음은 빠진다', () => {
    expect(defenseGroups(['normal']).map((g) => g.multiplier)).toEqual([2, 0])
  })

  it('배율 표기와 URL 파싱', () => {
    expect([0.5, 0.25, 4, 0].map(formatMultiplier)).toEqual(['½', '¼', '4', '0'])
    expect(parseDefenseTypes(new URLSearchParams('type=flying&type=fire&type=water&type=x'))).toEqual(['fire', 'water'])
  })
})
