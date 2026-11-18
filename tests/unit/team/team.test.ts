import { describe, expect, it } from 'vitest'
import {
  defenseRows,
  formatMember,
  parseMember,
  parseTeam,
  readStoredTeam,
  resolveTeam,
  stabCoverage,
  storeTeam,
  suggestTypes,
  TEAM_STORAGE_KEY,
  writeTeam,
} from '@/features/team/model/team'
import type { PokemonSummary } from '@/shared/models'

const INDEX: PokemonSummary[] = [
  {
    id: 6,
    nameEn: 'Charizard',
    nameKo: '리자몽',
    types: ['fire', 'flying'],
    generation: 'generation-i',
    forms: [{ key: 'mega-x', nameKo: '메가리자몽X', nameEn: 'Mega Charizard X', category: 'mega', types: ['fire', 'dragon'], battleOnly: true }],
  },
  { id: 9, nameEn: 'Blastoise', nameKo: '거북왕', types: ['water'], generation: 'generation-i', forms: [] },
]

describe('파티 주소·저장 (FR-33)', () => {
  it('id 또는 id:폼을 읽고, 형식이 틀리면 버리고, 6자리까지만 쓴다', () => {
    expect(parseMember('6')).toEqual({ id: 6, form: 'default' })
    expect(parseMember('6:mega-x')).toEqual({ id: 6, form: 'mega-x' })
    expect(parseMember('6:Mega X')).toEqual({ id: 6, form: 'default' })
    expect(parseMember('abc')).toBeNull()
    expect(parseMember('0')).toBeNull()
    expect(parseMember('99999')).toBeNull()
    expect(parseMember('6:a:b')).toBeNull()
    expect(parseTeam(['1', 'x', '2', '3', '4', '5', '6', '7'])).toHaveLength(6)
    expect(formatMember({ id: 6, form: 'mega-x' })).toBe('6:mega-x')
    expect(formatMember({ id: 9, form: 'default' })).toBe('9')
  })

  it('다른 쿼리는 유지하고 p만 바꾼다', () => {
    const next = writeTeam(new URLSearchParams('game=red&p=1'), [{ id: 6, form: 'mega-x' }, { id: 9, form: 'default' }])
    expect(next.toString()).toBe('game=red&p=6%3Amega-x&p=9')
    expect(writeTeam(next, []).toString()).toBe('game=red')
  })

  it('인덱스에 없는 번호는 버리고, 없는 폼은 기본 폼으로 본다', () => {
    const entries = resolveTeam(
      [
        { id: 6, form: 'mega-x' },
        { id: 9, form: 'mega' },
        { id: 25, form: 'default' },
      ],
      INDEX,
    )
    expect(entries.map((e) => [e.member, e.types])).toEqual([
      [{ id: 6, form: 'mega-x' }, ['fire', 'dragon']],
      [{ id: 9, form: 'default' }, ['water']],
    ])
  })

  it('파티를 저장하고 읽는다. 비면 지운다', () => {
    storeTeam([{ id: 6, form: 'mega-x' }, { id: 9, form: 'default' }])
    expect(localStorage.getItem(TEAM_STORAGE_KEY)).toBe('6:mega-x,9')
    expect(readStoredTeam()).toEqual([{ id: 6, form: 'mega-x' }, { id: 9, form: 'default' }])
    storeTeam([])
    expect(localStorage.getItem(TEAM_STORAGE_KEY)).toBeNull()
    expect(readStoredTeam()).toEqual([])
  })
})

describe('받는 피해·주의 타입·보완 추천 (FR-33)', () => {
  const row = (rows: ReturnType<typeof defenseRows>, attack: string) => rows.find((r) => r.attack === attack)!

  it('타입별 배율과 약점·반감 수를 센다 (4배·무효 포함)', () => {
    // 한카리아스(드래곤·땅), 리자몽(불꽃·비행), 거북왕(물)
    const rows = defenseRows([['dragon', 'ground'], ['fire', 'flying'], ['water']])
    expect(row(rows, 'ice').multipliers).toEqual([4, 1, 0.5])
    expect(row(rows, 'electric').multipliers).toEqual([0, 2, 2])
    expect(row(rows, 'electric')).toMatchObject({ weak: 2, resist: 1, caution: false })
    expect(row(rows, 'rock')).toMatchObject({ weak: 1, resist: 1 })
  })

  it('약점 3마리 이상, 또는 약점 2마리 이상이면서 반감·무효 0마리면 주의', () => {
    expect(row(defenseRows([['grass'], ['grass'], ['grass']]), 'fire').caution).toBe(true)
    expect(row(defenseRows([['grass'], ['grass'], ['water']]), 'fire').caution).toBe(false)
    expect(row(defenseRows([['grass'], ['grass'], ['normal']]), 'fire').caution).toBe(true)
  })

  it('보완 추천: 주의 타입을 많이 막는 순, 같으면 약점이 적은 순, 최대 3개', () => {
    const suggestions = suggestTypes(['ground', 'ice'])
    expect(suggestions).toHaveLength(3)
    // 강철은 땅에 약점이라 땅을 막지 못하고 얼음만 막는다. 땅·얼음을 모두 막는 단일 타입은 없다
    expect(suggestions.every((s) => s.covers.length === 1)).toBe(true)
    expect(suggestions[0].weaknesses).toBeLessThanOrEqual(suggestions[1].weaknesses)
    expect(suggestTypes([])).toEqual([])
    // 불꽃·전기를 함께 막는 타입(땅은 전기 무효·불꽃은 약점 → 아님, 드래곤은 둘 다 반감)
    expect(suggestTypes(['fire', 'electric'])[0]).toMatchObject({ type: 'dragon', covers: ['fire', 'electric'] })
  })

  it('자속 공격 범위: 파티 타입으로 2배 이상 들어가는 단일 타입', () => {
    const { covered, uncovered } = stabCoverage([['water'], ['electric']])
    // 물 → 불꽃·땅·바위, 전기 → 물·비행
    expect(covered).toEqual(['fire', 'water', 'ground', 'flying', 'rock'])
    expect(uncovered).toHaveLength(18 - covered.length)
    expect(stabCoverage([]).covered).toEqual([])
  })
})
