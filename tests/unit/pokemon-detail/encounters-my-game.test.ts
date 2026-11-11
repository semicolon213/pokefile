import { describe, expect, it } from 'vitest'
import { filterEncountersByGame, type VersionEncounters } from '@/features/pokemon-detail/model/encounters'

const entry = (version: string): VersionEncounters => ({
  version,
  label: version,
  generation: 'generation-i',
  locations: [{ location: 'a', label: 'A', minLevel: 3, maxLevel: 5, methods: [] }],
})

describe('filterEncountersByGame (FR-26)', () => {
  const all = [entry('red'), entry('blue'), entry('x')]

  it('내 게임이 없으면 전부', () => {
    expect(filterEncountersByGame(all, null).map((e) => e.version)).toEqual(['red', 'blue', 'x'])
  })

  it('내 게임이 있으면 그 게임만, 기록이 없으면 빈 목록', () => {
    expect(filterEncountersByGame(all, 'blue').map((e) => e.version)).toEqual(['blue'])
    expect(filterEncountersByGame(all, 'black-2')).toEqual([])
  })
})
