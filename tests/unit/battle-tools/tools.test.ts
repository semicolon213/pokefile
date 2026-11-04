import { describe, expect, it } from 'vitest'
import { normalizePokemonTools, pokemonResource, statTotal } from '@/features/battle-tools/model/tools'
import type { PokemonSelection } from '@/features/battle-tools/model/tools'
import snapshot from '../../integration/battle-tools/task011-fixture.json'
import { MAX_POKEMON_ID } from '@/shared/models'

const charizard: PokemonSelection = { id: 6, speciesName: 'charizard', formKey: 'default' }
const raw = snapshot.pokemon.find((entry) => entry.name === 'charizard')!
const generation = (name: string) => ({ name })
const stat = (name: string, base_stat: number) => ({ stat: { name }, base_stat })

describe('선택 기능 데이터 (FR-23·25 / TC-11)', () => {
  it('실제 응답의 일반·이로치 GIF/PNG와 울음소리를 같은 폼에서 정규화한다', () => {
    const result = normalizePokemonTools(raw, charizard)
    expect(result.normalImages).toHaveLength(2)
    expect(result.shinyImages[0]).toContain('/showdown/shiny/6.gif')
    expect(result.shinyImages[1]).toContain('/shiny/6.png')
    expect(result.cries).toHaveLength(2)
    expect(result.types).toEqual(['fire', 'flying'])
    expect(statTotal(result.stats!)).toBe(534)
  })

  it('메가X는 전용 미디어·타입·종족값을 사용하고 없는 legacy 소리를 채우지 않는다', () => {
    const mega = snapshot.pokemon.find((entry) => entry.name === 'charizard-mega-x')!
    const result = normalizePokemonTools(mega, { ...charizard, formKey: 'mega-x' })
    expect(result.types).toEqual(['fire', 'dragon'])
    expect(result.shinyImages[0]).toContain('10034.gif')
    expect(result.cries).toHaveLength(1)
    expect(statTotal(result.stats!)).toBe(634)
  })

  it('실제 킬가르도 이력의 일부 항목을 현재 값에 덮어써 6세대 수치로 비교한다', () => {
    const shield = snapshot.pokemon.find((entry) => entry.name === 'aegislash-shield')!
    const result = normalizePokemonTools(shield, { id: 681, speciesName: 'aegislash', formKey: 'default' })
    expect(result.stats).toMatchObject({ defense: 150, 'special-defense': 150, hp: 60, speed: 60 })
    expect(statTotal(result.stats!)).toBe(520)
  })

  it('서로 다른 시기의 부분 이력을 항목별로 합치고 가장 가까운 세대를 우선한다', () => {
    const result = normalizePokemonTools({ ...raw, past_stats: [
      { generation: generation('generation-vii'), stats: [stat('attack', 80)] },
      { generation: generation('generation-viii'), stats: [stat('attack', 90), stat('defense', 70)] },
      { generation: generation('generation-v'), stats: [stat('speed', 20)] },
    ] }, charizard)
    expect(result.stats).toMatchObject({ attack: 80, defense: 70, speed: 100 })
  })

  it('6세대에 적용되는 과거 타입을 선택하고 5세대 이전 이력은 적용하지 않는다', () => {
    const result = normalizePokemonTools({ ...raw, past_types: [
      { generation: generation('generation-v'), types: [{ type: { name: 'normal' } }] },
      { generation: generation('generation-vii'), types: [{ type: { name: 'dragon' } }] },
    ] }, charizard)
    expect(result.types).toEqual(['dragon'])
  })

  it('미디어·종족값 일부 누락이 다른 영역을 중단시키지 않는다', () => {
    const result = normalizePokemonTools({ ...raw, stats: [], sprites: {}, cries: {} }, charizard)
    expect(result).toMatchObject({ types: ['fire', 'flying'], stats: null, shinyImages: [], normalImages: [], cries: [] })
  })

  it('잘못된 수치·과거 이력은 0이나 현재 값으로 추정하지 않는다', () => {
    expect(normalizePokemonTools({ ...raw, past_stats: [{ generation: generation('generation-vii'), stats: [stat('defense', -1)] }] }, charizard).stats).toBeNull()
    expect(normalizePokemonTools({ ...raw, past_types: [{ generation: generation('generation-vii') }] }, charizard).types).toBeNull()
  })

  it('실제 다른 종·폼의 응답을 거부한다', () => {
    expect(() => normalizePokemonTools(snapshot.pokemon[1], charizard)).toThrow(/일치하지/)
    expect(() => normalizePokemonTools(raw, { ...charizard, formKey: 'mega-x' })).toThrow(/일치하지/)
  })

  it('표시 이름을 API 이름으로 추정하지 않고 기본 폼은 번호로 조회한다', () => {
    const selection: PokemonSelection = { id: 122, speciesName: 'Mr. Mime', formKey: 'default' }
    expect(pokemonResource(selection)).toBe('122')
    expect(normalizePokemonTools({ ...raw, id: 122, name: 'mr-mime', species: {
      name: 'mr-mime', url: 'https://pokeapi.co/api/v2/pokemon-species/122/',
    } }, selection).speciesName).toBe('mr-mime')
  })

  it('공통 범위의 마지막 종과 일반화된 리전폼·거다이맥스 폼 키를 지원한다', () => {
    expect(pokemonResource({ id: MAX_POKEMON_ID, speciesName: 'pecharunt', formKey: 'default' })).toBe(String(MAX_POKEMON_ID))
    expect(pokemonResource({ id: 26, speciesName: 'raichu', formKey: 'alola' })).toBe('raichu-alola')
    expect(pokemonResource({ ...charizard, formKey: 'gmax' })).toBe('charizard-gmax')
  })

  it.each(['', '../alola', 'Mega-X'])('잘못된 폼 키 %s는 요청하지 않는다', (formKey) => {
    expect(() => pokemonResource({ ...charizard, formKey })).toThrow()
  })

  it.each([0, MAX_POKEMON_ID + 1, 6.5])('지원 밖 ID %s를 요청하지 않는다', (id) => {
    expect(() => pokemonResource({ ...charizard, id })).toThrow()
  })

  it('응답에 없는 이미지·소리 URL을 만들거나 비 HTTPS URL을 사용하지 않는다', () => {
    const result = normalizePokemonTools({ ...raw, sprites: { front_shiny: 'javascript:alert(1)' }, cries: { latest: 'http://example.com/cry.ogg' } }, charizard)
    expect(result.shinyImages).toEqual([])
    expect(result.cries).toEqual([])
  })
})
