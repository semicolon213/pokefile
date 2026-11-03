import { describe, expect, it } from 'vitest'
import type { RawEncounter, RawEvolutionNode } from '@/features/pokemon-detail/api/pokeapi'
import { formatLocationArea, toVersionEncounters } from '@/features/pokemon-detail/model/encounters'
import { isSingleStage, toEvolutionTree } from '@/features/pokemon-detail/model/evolution'

const species = (name: string, id: number) => ({ name, url: `https://pokeapi.co/api/v2/pokemon-species/${id}/` })
const levelUp = (min_level: number | null) => ({ min_level, trigger: { name: 'level-up', url: '' } })
const useItem = { min_level: null, trigger: { name: 'use-item', url: '' } }

describe('toEvolutionTree (FR-15, ADR-008)', () => {
  it('분기 진화를 유지하고 레벨업 진화의 최소 레벨을 담는다', () => {
    const raw: RawEvolutionNode = {
      species: species('eevee', 133),
      evolution_details: [],
      evolves_to: [
        { species: species('vaporeon', 134), evolution_details: [useItem], evolves_to: [] },
        { species: species('sylveon', 700), evolution_details: [levelUp(null)], evolves_to: [] },
      ],
    }
    const tree = toEvolutionTree(raw)!
    expect(tree.id).toBe(133)
    expect(tree.children.map((c) => c.id)).toEqual([134, 700])
    expect(tree.children[0].minLevel).toBeUndefined()
  })

  it('#722 이후 진화형은 가지째 제외한다 (예: 킹갬브릿 #983)', () => {
    const raw: RawEvolutionNode = {
      species: species('pawniard', 624),
      evolution_details: [],
      evolves_to: [
        {
          species: species('bisharp', 625),
          evolution_details: [levelUp(52)],
          evolves_to: [{ species: species('kingambit', 983), evolution_details: [], evolves_to: [] }],
        },
      ],
    }
    const tree = toEvolutionTree(raw)!
    expect(tree.children[0]).toEqual({ id: 625, speciesName: 'bisharp', minLevel: 52, children: [] })
  })

  it('진화하지 않는 종을 구분한다', () => {
    const tree = toEvolutionTree({ species: species('tauros', 128), evolution_details: [], evolves_to: [] })!
    expect(isSingleStage(tree)).toBe(true)
  })
})

describe('toVersionEncounters (FR-16, ADR-008)', () => {
  const encounter = (area: string, versions: [string, number, number][]): RawEncounter => ({
    location_area: { name: area, url: '' },
    version_details: versions.map(([version, min, max]) => ({
      version: { name: version, url: '' },
      encounter_details: [
        { min_level: min, max_level: min, method: { name: 'walk', url: '' } },
        { min_level: max, max_level: max, method: { name: 'walk', url: '' } },
      ],
    })),
  })

  it('6세대 이하 버전만 남기고 ADR-008 버전 순서로 묶는다', () => {
    const result = toVersionEncounters([
      encounter('viridian-forest-area', [
        ['sword', 10, 12],
        ['yellow', 3, 5],
        ['red', 3, 5],
        ['lets-go-pikachu', 3, 5],
        ['red-japan', 3, 5],
      ]),
      encounter('power-plant-area', [['red', 21, 24]]),
    ])
    expect(result.map((v) => v.version)).toEqual(['red', 'yellow'])
    expect(result[0]).toMatchObject({ label: '레드', generation: 'generation-i' })
    expect(result[0].locations).toEqual([
      { area: 'viridian-forest-area', label: 'Viridian Forest', minLevel: 3, maxLevel: 5 },
      { area: 'power-plant-area', label: 'Power Plant', minLevel: 21, maxLevel: 24 },
    ])
  })

  it('지원 버전에 기록이 없으면 빈 배열 (DR-05 안내 대상)', () => {
    expect(toVersionEncounters([encounter('route-1', [['sun', 2, 4]])])).toEqual([])
    expect(toVersionEncounters([])).toEqual([])
  })

  it('장소 식별자를 임의 번역 없이 영문 표기로 바꾼다 (OQ-18 임시)', () => {
    expect(formatLocationArea('kanto-route-2-south-towards-viridian-city')).toBe('Kanto Route 2 South Towards Viridian City')
    expect(formatLocationArea('aquacorde-town-area')).toBe('Aquacorde Town')
  })
})
