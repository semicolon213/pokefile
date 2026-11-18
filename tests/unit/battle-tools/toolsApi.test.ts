import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPokemonTools } from '@/features/battle-tools/api/tools'
import { MAX_POKEMON_ID } from '@/shared/models'
import snapshot from '../../integration/battle-tools/task011-fixture.json'

afterEach(() => vi.unstubAllGlobals())

describe('이로치·울음소리 API 계약 (FR-23 / TC-09·11)', () => {
  it('유효한 폼 URL과 취소 신호를 전달한다', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(snapshot.pokemon.find((entry) => entry.name === 'charizard-mega-x')))
    vi.stubGlobal('fetch', fetch)
    const controller = new AbortController()
    await fetchPokemonTools({ id: 6, speciesName: 'Charizard', formKey: 'mega-x' }, controller.signal)
    expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/charizard-mega-x', { signal: controller.signal })
  })
  it.each([404, 503])('HTTP %s를 미디어 데이터 부재로 위장하지 않는다', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })))
    await expect(fetchPokemonTools({ id: 6, speciesName: 'charizard', formKey: 'default' })).rejects.toMatchObject({ status })
  })
  it('잘못된 ID는 네트워크 요청 전에 거부한다', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(fetchPokemonTools({ id: MAX_POKEMON_ID + 1, speciesName: 'unknown', formKey: 'default' })).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()
  })
})
