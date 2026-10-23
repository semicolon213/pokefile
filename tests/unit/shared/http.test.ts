import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchJson } from '@/shared/api'

describe('fetchJson', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('404를 not_found로 구분한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })))
    await expect(fetchJson('/x')).rejects.toMatchObject({ kind: 'not_found', status: 404 })
  })

  it('네트워크 실패를 network로 구분한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    await expect(fetchJson('/x')).rejects.toBeInstanceOf(ApiError)
    await expect(fetchJson('/x')).rejects.toMatchObject({ kind: 'network' })
  })

  it('JSON 파싱 실패를 parse로 구분한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 200 })))
    await expect(fetchJson('/x')).rejects.toMatchObject({ kind: 'parse' })
  })
})
