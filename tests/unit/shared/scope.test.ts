import { describe, expect, it } from 'vitest'
import indexJson from '../../../public/data/pokedex-index.json?raw'
import { SCOPE, SMOGON_FORMAT_GEN } from '@/shared/config/scope'
import { GENERATIONS, MAX_POKEMON_ID, type PokemonSummary } from '@/shared/models'
import { GENERATION_LABELS } from '@/shared/ui'

// 지원 범위 설정(scope.json)과 검색 인덱스·파생 값이 서로 맞는지 확인한다.
// 세대를 늘릴 때 scope.json만 고치고 인덱스를 다시 만들지 않으면 여기서 실패한다 (TASK-013).
const index = JSON.parse(indexJson) as {
  count: number
  pokemon: PokemonSummary[]
  regionalDexes: Record<string, { start: number; ids: number[] }>
}

describe('지원 범위 설정 (scope.json)', () => {
  it('세대 id가 겹치지 않고, 게임 버전은 지원 세대에만 속한다', () => {
    const ids = SCOPE.generations.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const v of SCOPE.gameVersions) expect(ids).toContain(v.generation)
    expect(new Set(SCOPE.gameVersions.map((v) => v.version)).size).toBe(SCOPE.gameVersions.length)
  })

  it('파생 값이 설정을 따른다', () => {
    expect(MAX_POKEMON_ID).toBe(SCOPE.maxPokemonId)
    expect(GENERATIONS).toEqual(SCOPE.generations.map((g) => g.id))
    expect(Object.keys(GENERATION_LABELS)).toEqual(GENERATIONS)
    expect(SMOGON_FORMAT_GEN).toBe(`gen${SCOPE.smogon.generation}`)
  })

  it('검색 인덱스가 설정 범위와 일치한다 (불일치 시 npm run build:index)', () => {
    expect(index.count).toBe(SCOPE.maxPokemonId)
    expect(index.pokemon.map((p) => p.id)).toEqual(Array.from({ length: SCOPE.maxPokemonId }, (_, i) => i + 1))
    const gens = new Set(index.pokemon.map((p) => p.generation))
    expect([...gens].sort()).toEqual([...GENERATIONS].sort())
  })

  it('지방 도감 설정이 서로 맞고, 검색 인덱스에 모든 도감이 있다 (TASK-019, ADR-017)', () => {
    const names = SCOPE.pokedexes.map((d) => d.name)
    expect(new Set(names).size).toBe(names.length)
    for (const g of SCOPE.generations) for (const d of g.defaultDexes) expect(names).toContain(d)
    for (const v of SCOPE.gameVersions) {
      expect(v.dexes.length).toBeGreaterThan(0)
      for (const d of v.dexes) expect(names).toContain(d)
    }
    expect(Object.keys(index.regionalDexes).sort()).toEqual([...names].sort())
    for (const { start, ids } of Object.values(index.regionalDexes)) {
      expect([0, 1]).toContain(start)
      expect(ids.every((id) => id >= 1 && id <= SCOPE.maxPokemonId)).toBe(true)
    }
  })
})
