import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api'
import {
  findSpeciesSmogonSets,
  normalizeGen6SmogonSets,
} from '@/features/battle-tools/model/smogon'

// TC-06 / FR-17~18 / DR-04. API_SPEC §5 및 실제 gen6 응답의 구조를 사용한다.
const tankChomp = {
  moves: ['Stealth Rock', 'Earthquake', 'Dragon Tail', ['Fire Blast', 'Toxic']],
  ability: 'Rough Skin', item: 'Rocky Helmet', nature: 'Impish',
  evs: { hp: 240, def: 176, spe: 92 },
}

describe('gen6 세팅 정규화와 종 이름 매핑 (TC-06)', () => {
  it('기술 슬롯·후보와 선택 가능한 도구·성격을 보존한다', () => {
    const data = normalizeGen6SmogonSets({
      Garchomp: { ou: {
        'Tank Chomp': tankChomp,
        'Offensive Stealth Rock': {
          moves: ['Stealth Rock', 'Earthquake', ['Dragon Claw', 'Outrage'], ['Swords Dance', 'Fire Blast']],
          ability: 'Rough Skin', item: ['Lum Berry', 'Focus Sash'], nature: ['Jolly', 'Naive'],
          evs: { atk: 252, def: 4, spe: 252 },
        },
      } },
    })
    const [format] = findSpeciesSmogonSets(data, 'garchomp')
    expect(format.format).toBe('ou')
    expect(format.sets[0]).toEqual({
      name: 'Tank Chomp',
      moves: [['Stealth Rock'], ['Earthquake'], ['Dragon Tail'], ['Fire Blast', 'Toxic']],
      abilities: ['Rough Skin'], items: ['Rocky Helmet'], natures: ['Impish'],
      evs: [{ hp: 240, def: 176, spe: 92 }], ivs: [],
    })
    expect(format.sets[1]).toMatchObject({
      items: ['Lum Berry', 'Focus Sash'], natures: ['Jolly', 'Naive'],
      moves: [['Stealth Rock'], ['Earthquake'], ['Dragon Claw', 'Outrage'], ['Swords Dance', 'Fire Blast']],
    })
  })

  it('대안 노력치·개체값 분배를 서로 섞거나 누락 값으로 채우지 않는다', () => {
    const evs = [{ hp: 252, spe: 252 }, { atk: 252, spe: 252 }]
    const ivs = [{ atk: 0 }, { spe: 0 }]
    const data = normalizeGen6SmogonSets({ Ditto: { ou: { Candidate: { evs, ivs } } } })
    expect(findSpeciesSmogonSets(data, 'ditto')[0].sets[0]).toMatchObject({ evs, ivs })
    expect(findSpeciesSmogonSets(data, 'ditto')[0].sets[0].items).toEqual([])
  })

  it('mr-mime과 Mr. Mime을 같은 종으로 매핑한다', () => {
    const data = normalizeGen6SmogonSets({ 'Mr. Mime': { pu: { Candidate: tankChomp } } })
    expect(findSpeciesSmogonSets(data, 'mr-mime')[0].format).toBe('pu')
  })

  it('다른 종·폼으로 대체하지 않고 빈 결과를 반환한다', () => {
    const data = normalizeGen6SmogonSets({
      Deoxys: { ubers: { Candidate: tankChomp } },
      'Charizard-Mega-X': { ou: { Candidate: tankChomp } },
    })
    expect(findSpeciesSmogonSets(data, 'caterpie')).toEqual([])
    expect(findSpeciesSmogonSets(data, 'deoxys-normal')).toEqual([])
    expect(findSpeciesSmogonSets(data, 'charizard')).toEqual([])
    expect(findSpeciesSmogonSets(data, '')).toEqual([])
  })

  it('정해진 변칙 포맷만 제외하고 일반 포맷을 임의로 고르지 않는다', () => {
    const sets = { Candidate: tankChomp }
    const data = normalizeGen6SmogonSets({ Garchomp: {
      uu: sets, ou: sets, doublesou: sets, balancedhackmons: sets,
      purehackmons: sets, almostanyability: sets, stabmons: sets, cap: sets,
    } })
    expect(findSpeciesSmogonSets(data, 'garchomp').map((entry) => entry.format))
      .toEqual(['uu', 'ou', 'doublesou'])
  })

  it('데이터가 없거나 제외 포맷만 있으면 후보가 없다', () => {
    expect(normalizeGen6SmogonSets({})).toEqual([])
    const data = normalizeGen6SmogonSets({ Venusaur: { cap: { Candidate: tankChomp } } })
    expect(findSpeciesSmogonSets(data, 'venusaur')).toEqual([])
  })

  it.each([
    null, [], 'invalid',
    { Garchomp: [] },
    { Garchomp: { ou: { Candidate: { moves: 'Earthquake' } } } },
    { Garchomp: { ou: { Candidate: { item: 25 } } } },
    { Garchomp: { ou: { Candidate: { evs: { atk: '252' } } } } },
    { Garchomp: { ou: { Candidate: { ivs: [{ spe: -1 }] } } } },
  ])('잘못된 스키마를 데이터 없음으로 숨기지 않는다 (%j)', (value) => {
    expect(() => normalizeGen6SmogonSets(value)).toThrow(ApiError)
    try {
      normalizeGen6SmogonSets(value)
    } catch (error) {
      expect(error).toMatchObject({ kind: 'parse' })
    }
  })

  it('정규화 결과가 충돌하는 종을 임의로 선택하지 않는다', () => {
    expect(() => normalizeGen6SmogonSets({ 'Mr. Mime': {}, 'mr-mime': {} })).toThrow(ApiError)
  })
})
