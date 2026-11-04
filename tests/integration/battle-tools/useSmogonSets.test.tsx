import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { battleToolsQueryKeys } from '@/features/battle-tools/api/queryKeys'
import { fetchGen6SmogonSets } from '@/features/battle-tools/api/smogon'
import { useSmogonSets } from '@/features/battle-tools/hooks/useSmogonSets'
import { findSpeciesSmogonSets } from '@/features/battle-tools/model/smogon'

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return { client, wrapper: Wrapper }
}

afterEach(() => vi.unstubAllGlobals())

describe('gen6 세팅 조회와 캐시 (TC-06, TC-09)', () => {
  it('여러 소비자가 같은 gen6 파일과 캐시를 공유한다', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      Garchomp: { ou: { Candidate: { moves: ['Earthquake'] } } },
      Pikachu: { nu: { Candidate: { moves: ['Thunderbolt'] } } },
    })))
    vi.stubGlobal('fetch', fetch)
    const { client, wrapper } = createWrapper()
    const first = renderHook(() => useSmogonSets(), { wrapper })
    const second = renderHook(() => useSmogonSets(), { wrapper })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('https://data.pkmn.cc/sets/gen6.json', {
      signal: expect.any(AbortSignal),
    })
    expect(findSpeciesSmogonSets(first.result.current.data!, 'garchomp')[0].format).toBe('ou')
    expect(findSpeciesSmogonSets(second.result.current.data!, 'pikachu')[0].format).toBe('nu')
    expect(client.getQueryData(battleToolsQueryKeys.smogonSets())).toBe(first.result.current.data)
    first.unmount()
    second.unmount()
    const restored = renderHook(() => useSmogonSets(), { wrapper })
    expect(restored.result.current.isSuccess).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
    restored.unmount()
    client.clear()
  })

  it('정상적인 빈 데이터는 조회 성공으로 처리한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
    await expect(fetchGen6SmogonSets()).resolves.toEqual([])
  })

  it.each([
    [404, '{}', 'not_found', 404],
    [503, '{}', 'http', 503],
    [200, 'invalid json', 'parse', 200],
    [200, '[]', 'parse', undefined],
  ] as const)('HTTP %i 응답의 실패·스키마 불일치를 구분한다 (%s)', async (status, body, kind, expectedStatus) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status })))
    await expect(fetchGen6SmogonSets()).rejects.toMatchObject({ kind, status: expectedStatus })
  })

  it('네트워크 실패가 조회 오류로 전달되고 재시도 후 복구된다', async () => {
    const fetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(new Response('{}'))
    vi.stubGlobal('fetch', fetch)
    const { client, wrapper } = createWrapper()
    const hook = renderHook(() => useSmogonSets(), { wrapper })
    await waitFor(() => expect(hook.result.current.isError).toBe(true))
    expect(hook.result.current.error).toMatchObject({ kind: 'network' })
    await hook.result.current.refetch()
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
    expect(hook.result.current.data).toEqual([])
    hook.unmount()
    client.clear()
  })

  it('요청 취소 신호를 공통 HTTP 함수에 전달한다', async () => {
    const fetch = vi.fn(async () => new Response('{}'))
    vi.stubGlobal('fetch', fetch)
    const controller = new AbortController()
    await fetchGen6SmogonSets(controller.signal)
    expect(fetch).toHaveBeenCalledWith(expect.any(String), { signal: controller.signal })
  })
})
