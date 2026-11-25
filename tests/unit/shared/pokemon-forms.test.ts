import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPokemonFormOverride } from '@/shared/api'
import { additionalFixtureForUrl } from '../../integration/shared/additional-form-fixtures'

afterEach(() => vi.unstubAllGlobals())

describe('C-01 pokemon-form 조회 계약 (TC-04·06·09)', () => {
  it('일반 pokemon 404 경로를 만들지 않고 선택 폼의 타입·이미지를 읽는다', async () => {
    const fetch = vi.fn(async (url: string) => Response.json(additionalFixtureForUrl(url)))
    vi.stubGlobal('fetch', fetch)
    const form = await fetchPokemonFormOverride('arceus-fire', 'arceus')
    expect(form.types.map((entry) => entry.type.name)).toEqual(['fire'])
    expect(form.sprites.front_default).toBe('arceus-fire.png')
    expect(fetch.mock.calls[0][0]).toBe('https://pokeapi.co/api/v2/pokemon-form/arceus-fire')
  })

  it.each([null, {}, { name: 'arceus-fire', pokemon: { name: 'silvally' } }])('잘못된 응답을 기본 폼으로 대체하지 않는다: %j', async (value) => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(value)))
    await expect(fetchPokemonFormOverride('arceus-fire', 'arceus')).rejects.toMatchObject({ kind: 'parse' })
  })

  it('폼 요청 실패는 부재와 구분하고 경로 형식도 검사한다', async () => {
    const fetch = vi.fn(async () => new Response('', { status: 503 }))
    vi.stubGlobal('fetch', fetch)
    await expect(fetchPokemonFormOverride('arceus-fire', 'arceus')).rejects.toMatchObject({ kind: 'http', status: 503 })
    await expect(fetchPokemonFormOverride('../arceus', 'arceus')).rejects.toMatchObject({ kind: 'parse' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
