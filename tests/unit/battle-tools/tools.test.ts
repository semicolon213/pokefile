import { describe, expect, it } from 'vitest'
import { normalizePokemonTools, pokemonResource } from '@/features/battle-tools/model/tools'
import type { PokemonSelection } from '@/features/battle-tools/model/tools'
import snapshot from '../../integration/battle-tools/task011-fixture.json'
import { MAX_POKEMON_ID } from '@/shared/models'

const charizard: PokemonSelection = { id: 6, speciesName: 'charizard', formKey: 'default' }
const raw = snapshot.pokemon.find((entry) => entry.name === 'charizard')!

describe('이로치·울음소리 데이터 (FR-23 / TC-11)', () => {
  it('실제 응답의 일반·이로치 GIF/PNG와 울음소리를 같은 폼에서 정규화한다', () => {
    const result = normalizePokemonTools(raw, charizard)
    expect(result.normalImages).toHaveLength(2)
    expect(result.shinyImages[0]).toContain('/showdown/shiny/6.gif')
    expect(result.shinyImages[1]).toContain('/shiny/6.png')
    expect(result.cries).toHaveLength(2)
  })

  it('메가X는 전용 미디어를 사용하고 없는 legacy 소리를 채우지 않는다', () => {
    const mega = snapshot.pokemon.find((entry) => entry.name === 'charizard-mega-x')!
    const result = normalizePokemonTools(mega, { ...charizard, formKey: 'mega-x' })
    expect(result.shinyImages[0]).toContain('10034.gif')
    expect(result.cries).toHaveLength(1)
  })

  it('누락된 이미지·울음소리는 빈 후보로 안내할 수 있다', () => {
    const result = normalizePokemonTools({ ...raw, stats: [], sprites: {}, cries: {} }, charizard)
    expect(result).toEqual({ speciesName: 'charizard', shinyImages: [], normalImages: [], cries: [] })
  })

  it('미디어와 무관한 타입·종족값 필드가 잘못돼도 미디어는 유지한다', () => {
    expect(normalizePokemonTools({ ...raw, types: null, stats: null, past_types: 'invalid', past_stats: 'invalid' }, charizard))
      .toEqual(normalizePokemonTools(raw, charizard))
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
