import { describe, expect, it } from 'vitest'
import type { RawEncounter, RawEvolutionDetail, RawEvolutionNode } from '@/features/pokemon-detail/api/pokeapi'
import { formatLocationArea, resolveLocation, toVersionEncounters } from '@/features/pokemon-detail/model/encounters'
import {
  collectConditionRefs,
  isSingleStage,
  pickEvolutionConditions,
  toEvolutionTree,
} from '@/features/pokemon-detail/model/evolution'

const species = (name: string, id: number) => ({ name, url: `https://pokeapi.co/api/v2/pokemon-species/${id}/` })
const res = (name: string) => ({ name, url: '' })
const levelUp = (min_level: number | null) => ({ min_level, trigger: res('level-up') })
const useItem = { min_level: null, trigger: res('use-item'), item: res('water-stone') }
const detail = (fields: Omit<Partial<RawEvolutionDetail>, 'trigger'> & { trigger: string; version?: string }): RawEvolutionDetail => {
  const { trigger, version, ...rest } = fields
  return { min_level: null, ...rest, trigger: res(trigger), version_group: version ? res(version) : null }
}

describe('toEvolutionTree (FR-15, ADR-008)', () => {
  it('분기 진화를 유지하고 진화 조건을 담는다', () => {
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
    expect(tree.conditions).toEqual([])
    expect(tree.children[0].conditions).toEqual([[[{ kind: 'item', name: 'water-stone' }, ' 사용']]])
    expect(tree.children[1].conditions).toEqual([[['레벨업']]])
  })

  it('지원 범위(#1025) 밖 진화형은 가지째 제외한다', () => {
    const raw: RawEvolutionNode = {
      species: species('pawniard', 624),
      evolution_details: [],
      evolves_to: [
        {
          species: species('bisharp', 625),
          evolution_details: [levelUp(52)],
          evolves_to: [{ species: species('future-mon', 1026), evolution_details: [], evolves_to: [] }],
        },
      ],
    }
    const tree = toEvolutionTree(raw)!
    expect(tree.children[0]).toEqual({ id: 625, speciesName: 'bisharp', conditions: [[['Lv.52']]], children: [] })
  })

  it('진화하지 않는 종을 구분한다', () => {
    const tree = toEvolutionTree({ species: species('tauros', 128), evolution_details: [], evolves_to: [] })!
    expect(isSingleStage(tree)).toBe(true)
  })
})

describe('pickEvolutionConditions (TASK-016, FR-28)', () => {
  it('친밀도·시간대처럼 레벨 없는 레벨업 조건은 끝에 레벨업을 붙인다 (에브이)', () => {
    expect(pickEvolutionConditions([detail({ trigger: 'level-up', min_happiness: 160, time_of_day: 'day', version: 'gold-silver' })])).toEqual([
      [['친밀도 높음'], ['낮'], ['레벨업']],
    ])
  })

  it('통신교환, 도구를 지닌 통신교환, 특정 포켓몬과의 통신교환 (TC-13)', () => {
    expect(pickEvolutionConditions([detail({ trigger: 'trade', version: 'red-blue' })])).toEqual([[['통신교환']]])
    expect(pickEvolutionConditions([detail({ trigger: 'trade', held_item: res('metal-coat') })])).toEqual([
      [[{ kind: 'item', name: 'metal-coat' }, ' 지니고 통신교환']],
    ])
    const escavalier = detail({ trigger: 'trade', trade_species: { name: 'shelmet', url: 'https://pokeapi.co/api/v2/pokemon-species/616/' } })
    expect(pickEvolutionConditions([escavalier])).toEqual([[[{ kind: 'species', id: 616, name: 'shelmet' }, '와(과) 통신교환']]])
  })

  it('장소·기술·타입·파티 조건을 이름 참조로 담는다', () => {
    expect(
      pickEvolutionConditions([
        detail({ trigger: 'level-up', min_level: 32, party_type: res('dark') }),
        detail({ trigger: 'level-up', known_move: res('ancient-power') }),
      ]),
    ).toEqual([
      [['Lv.32'], ['파티에 ', { kind: 'type', type: 'dark' }, '타입']],
      [[{ kind: 'move', name: 'ancient-power' }, ' 배운 상태'], ['레벨업']],
    ])
    const runerigus = pickEvolutionConditions([detail({ trigger: 'take-damage', min_damage_taken: 49, location: res('dusty-bowl') })])
    expect(runerigus).toEqual([[['데미지 49 이상 받은 뒤 바위 아치 통과'], [{ kind: 'location', name: 'dusty-bowl' }, '에서']]])
  })

  it('게임마다 다르면 최신 게임 조건만 남긴다 (자포코일: 장소 → 천둥의돌)', () => {
    const magnezone = [
      detail({ trigger: 'level-up', location: res('mt-coronet'), version: 'diamond-pearl' }),
      detail({ trigger: 'use-item', item: res('thunder-stone'), version: 'sword-shield' }),
      detail({ trigger: 'level-up', location: res('new-mauville'), version: 'omega-ruby-alpha-sapphire' }),
    ]
    expect(pickEvolutionConditions(magnezone)).toEqual([[[{ kind: 'item', name: 'thunder-stone' }, ' 사용']]])
  })

  it('리전폼 진화 조건은 빼고 기본 폼 조건을 쓴다 (region 또는 폼 이름으로 판별)', () => {
    const ninetales = [
      detail({ trigger: 'use-item', item: res('fire-stone'), version: 'red-blue' }),
      detail({ trigger: 'use-item', item: res('ice-stone'), version: 'sun-moon', required_pokemon_form: res('vulpix-alola') }),
    ]
    expect(pickEvolutionConditions(ninetales)).toEqual([[[{ kind: 'item', name: 'fire-stone' }, ' 사용']]])
    const typhlosion = [
      detail({ trigger: 'level-up', min_level: 36, version: 'gold-silver' }),
      detail({ trigger: 'level-up', min_level: 36, version: 'legends-arceus', region: res('hisui') }),
    ]
    expect(pickEvolutionConditions(typhlosion)).toEqual([[['Lv.36']]])
    // 리전폼 조건뿐이면(가라르 나옹 → 나이킹) 그대로 쓴다
    const perrserker = [detail({ trigger: 'level-up', min_level: 28, required_pokemon_form: res('meowth-galar') })]
    expect(pickEvolutionConditions(perrserker)).toEqual([[['Lv.28']]])
  })

  it('서로 다른 조건은 또는으로 모두, 같은 조건은 하나로, 양쪽 성별이면 성별을 뺀다', () => {
    const lycanroc = ['day', 'night', 'dusk'].map((time_of_day) => detail({ trigger: 'level-up', min_level: 25, time_of_day }))
    expect(pickEvolutionConditions(lycanroc)).toEqual([[['Lv.25'], ['낮']], [['Lv.25'], ['밤']], [['Lv.25'], ['황혼']]])
    const meowstic = [1, 2].map((gender) => detail({ trigger: 'level-up', min_level: 25, gender }))
    expect(pickEvolutionConditions(meowstic)).toEqual([[['Lv.25']]])
    expect(pickEvolutionConditions([detail({ trigger: 'use-item', item: res('dawn-stone'), gender: 2 })])).toEqual([
      [[{ kind: 'item', name: 'dawn-stone' }, ' 사용'], ['수컷']],
    ])
  })

  it('마휘핑(회전)은 사탕공예·시간대와 관계없이 하나로 표시한다', () => {
    const alcremie = ['strawberry-sweet', 'love-sweet'].flatMap((sweet) =>
      ['day', 'night'].map((time_of_day) => detail({ trigger: 'spin', held_item: res(sweet), time_of_day })),
    )
    expect(pickEvolutionConditions(alcremie)).toEqual([[['사탕공예를 지니고 회전']]])
  })

  it('조건이 없으면 빈 배열, 도구·기술·장소 이름 참조를 중복 없이 모은다', () => {
    expect(pickEvolutionConditions([])).toEqual([])
    const tree = toEvolutionTree({
      species: species('eevee', 133),
      evolution_details: [],
      evolves_to: [
        { species: species('vaporeon', 134), evolution_details: [useItem], evolves_to: [] },
        { species: species('jolteon', 135), evolution_details: [{ ...useItem, item: res('thunder-stone') }], evolves_to: [] },
        { species: species('glaceon', 471), evolution_details: [{ ...useItem }], evolves_to: [] },
      ],
    })
    expect(collectConditionRefs(tree)).toEqual([
      { kind: 'item', name: 'water-stone' },
      { kind: 'item', name: 'thunder-stone' },
    ])
  })
})

describe('toVersionEncounters (FR-16, ADR-016)', () => {
  const encounter = (area: string, versions: [string, number, number][], method = 'walk'): RawEncounter => ({
    location_area: { name: area, url: '' },
    version_details: versions.map(([version, min, max]) => ({
      version: { name: version, url: '' },
      encounter_details: [
        { min_level: min, max_level: min, method: { name: method, url: '' } },
        { min_level: max, max_level: max, method: { name: method, url: '' } },
      ],
    })),
  })

  it('지원 게임 버전만 남기고 scope.json 버전 순서로 묶는다', () => {
    const result = toVersionEncounters([
      encounter('viridian-forest-area', [
        ['sword', 10, 12],
        ['yellow', 3, 5],
        ['red', 3, 5],
        ['lets-go-pikachu', 3, 5],
        ['red-japan', 3, 5],
      ]),
      encounter('unknown-place-area', [['red', 21, 24]]),
    ])
    expect(result.map((v) => v.version)).toEqual(['red', 'yellow', 'lets-go-pikachu', 'sword'])
    expect(result[0]).toMatchObject({ label: '레드', generation: 'generation-i' })
    expect(result[0].locations).toEqual([
      { location: 'viridian-forest', label: '상록숲', minLevel: 3, maxLevel: 5, methods: ['풀숲·동굴'] },
      // 이름표에 없는 장소는 영문 표기
      { location: 'unknown-place', label: 'Unknown Place', minLevel: 21, maxLevel: 24, methods: ['풀숲·동굴'] },
    ])
  })

  it('같은 장소의 구역은 한 줄로 합치고 레벨 범위·만나는 방법을 모은다 (TASK-006 재구현)', () => {
    const result = toVersionEncounters([
      encounter('mt-moon-1f', [['red', 7, 9]]),
      encounter('mt-moon-b2f', [['red', 10, 12]]),
      encounter('mt-moon-b1f', [['red', 8, 10]], 'rock-smash'),
    ])
    expect(result[0].locations).toEqual([
      { location: 'mt-moon', label: '달맞이산', minLevel: 7, maxLevel: 12, methods: ['풀숲·동굴', '바위깨기'] },
    ])
  })

  it('비슷한 방법은 하나로, 모르는 방법은 기타로 표시한다', () => {
    const result = toVersionEncounters([
      encounter('kanto-route-2-south-towards-viridian-city', [['red', 3, 5]], 'headbutt-low'),
      encounter('kanto-route-2-north-towards-pewter-city', [['red', 4, 6]], 'headbutt-high'),
      encounter('kanto-sea-route-20-area', [['red', 30, 30]], 'new-method'),
    ])
    expect(result[0].locations).toEqual([
      { location: 'kanto-route-2', label: '2번도로', minLevel: 3, maxLevel: 6, methods: ['박치기(나무)'] },
      { location: 'kanto-sea-route-20', label: '20번수로', minLevel: 30, maxLevel: 30, methods: ['기타'] },
    ])
  })

  it('지원 버전에 기록이 없으면 빈 배열 (DR-05 안내 대상)', () => {
    expect(toVersionEncounters([encounter('route-1', [['red-japan', 2, 4]])])).toEqual([])
    expect(toVersionEncounters([])).toEqual([])
  })

  it('구역 이름에서 가장 긴 장소 이름으로 장소를 찾는다', () => {
    expect(resolveLocation('kanto-route-2-south-towards-viridian-city')).toEqual({ location: 'kanto-route-2', label: '2번도로' })
    // 'motostoke'(엔진시티)가 'motostoke-riverbank'(엔진 리버사이드)를 삼키지 않는다
    expect(resolveLocation('motostoke-riverbank-area')).toEqual({ location: 'motostoke-riverbank', label: '엔진 리버사이드' })
    expect(resolveLocation('motostoke-area')).toEqual({ location: 'motostoke', label: '엔진시티' })
    expect(resolveLocation('roaming-kanto-area')).toEqual({ location: 'roaming-kanto', label: '관동 각지 (배회)' })
  })

  it('이름표에 없는 장소 식별자는 영문 표기로 바꾼다', () => {
    expect(formatLocationArea('kanto-route-2-south-towards-viridian-city')).toBe('Kanto Route 2 South Towards Viridian City')
    expect(formatLocationArea('aquacorde-town-area')).toBe('Aquacorde Town')
  })
})
