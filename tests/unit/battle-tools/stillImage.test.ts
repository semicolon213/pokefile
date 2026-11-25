import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStillImage } from '@/features/battle-tools/model/stillImage'

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

function imageApi() {
  const bitmap = { width: 2, height: 3, close: vi.fn() }
  const decode = vi.fn().mockResolvedValue(bitmap)
  vi.stubGlobal('createImageBitmap', decode)
  const request = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['gif']) })
  vi.stubGlobal('fetch', request)
  return { bitmap, decode, request }
}

describe('GIF 정지 프레임 (TASK-028 / TC-08·11)', () => {
  it('Blob을 한 프레임으로 디코딩해 PNG로 만들고 bitmap을 정리한다', async () => {
    const { bitmap, decode, request } = imageApi()
    const draw = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: draw } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,frame')
    const signal = new AbortController().signal
    expect(await createStillImage('form.gif', signal)).toEqual({ status: 'ready', url: 'data:image/png;base64,frame' })
    expect(request).toHaveBeenCalledWith('form.gif', { signal, mode: 'cors' })
    expect(decode).toHaveBeenCalledWith(expect.any(Blob))
    expect(draw).toHaveBeenCalledWith(bitmap, 0, 0)
    expect(bitmap.close).toHaveBeenCalledOnce()
  })

  it('404 이미지와 지원하지 않는 디코더를 구분한다', async () => {
    const { request } = imageApi()
    request.mockResolvedValue({ ok: false })
    expect(await createStillImage('missing.gif', new AbortController().signal)).toEqual({ status: 'missing' })
    vi.stubGlobal('createImageBitmap', undefined)
    expect(await createStillImage('form.gif', new AbortController().signal)).toEqual({ status: 'unavailable' })
  })

  it('CORS 또는 디코딩 실패에서는 재생 GIF 대신 안내할 결과를 반환한다', async () => {
    const { request, decode } = imageApi()
    request.mockRejectedValueOnce(new TypeError('CORS'))
    expect(await createStillImage('form.gif', new AbortController().signal)).toEqual({ status: 'unavailable' })
    decode.mockRejectedValueOnce(new Error('decode failed'))
    expect(await createStillImage('form.gif', new AbortController().signal)).toEqual({ status: 'unavailable' })
  })

  it('canvas를 제공하지 않거나 취소된 작업도 bitmap을 정리한다', async () => {
    const { bitmap } = imageApi()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    expect(await createStillImage('form.gif', new AbortController().signal)).toEqual({ status: 'unavailable' })
    const controller = new AbortController()
    controller.abort()
    expect(await createStillImage('form.gif', controller.signal)).toEqual({ status: 'unavailable' })
    expect(bitmap.close).toHaveBeenCalledTimes(2)
  })
})
