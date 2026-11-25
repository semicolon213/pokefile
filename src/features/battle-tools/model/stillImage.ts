export type StillImage = { status: 'ready'; url: string } | { status: 'missing' | 'unavailable' }

/** 애니메이션을 화면에 재생하지 않고 기본/첫 프레임을 PNG로 만든다 (TASK-028). */
export async function createStillImage(url: string, signal: AbortSignal): Promise<StillImage> {
  if (typeof createImageBitmap !== 'function') return { status: 'unavailable' }
  let bitmap: ImageBitmap | undefined
  try {
    const response = await fetch(url, { signal, mode: 'cors' })
    if (!response.ok) return { status: 'missing' }
    // HTML 표준: 애니메이션 Blob은 기본 이미지 또는 첫 프레임만 디코딩한다.
    bitmap = await createImageBitmap(await response.blob())
    if (signal.aborted) return { status: 'unavailable' }
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context) return { status: 'unavailable' }
    context.drawImage(bitmap, 0, 0)
    const png = canvas.toDataURL('image/png')
    return png.startsWith('data:image/png') ? { status: 'ready', url: png } : { status: 'unavailable' }
  } catch {
    // CORS·디코더 미지원 등은 다른 폼이나 재생 GIF로 숨기지 않는다.
    return { status: 'unavailable' }
  } finally {
    bitmap?.close()
  }
}
