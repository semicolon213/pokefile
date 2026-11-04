import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPokemonTools, fetchTypeDefense } from '@/features/battle-tools/api/tools'
import snapshot from '../../integration/battle-tools/task011-fixture.json'

afterEach(() => vi.unstubAllGlobals())

describe('선택 기능 API 계약 (TC-09·11)', () => {
  it('유효한 폼 URL과 취소 신호를 전달한다', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(snapshot.pokemon.find((entry) => entry.name === 'charizard-mega-x')))
    vi.stubGlobal('fetch', fetch)
    const controller = new AbortController()
    await fetchPokemonTools({ id: 6, speciesName: 'Charizard', formKey: 'mega-x' }, controller.signal)
    expect(fetch).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon/charizard-mega-x', { signal: controller.signal })
  })
  it.each([404, 503])('HTTP %s를 데이터 부재·0배로 위장하지 않는다', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })))
    await expect(fetchTypeDefense('fire')).rejects.toMatchObject({ status })
  })
  it('잘못된 ID는 네트워크 요청 전에 거부한다', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(fetchPokemonTools({ id: 722, speciesName: 'rowlet', formKey: 'default' })).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()
  })
})
