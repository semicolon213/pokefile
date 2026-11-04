import { describe, expect, it } from 'vitest'
import { fitSprite } from '@/shared/ui'

const sprite = (w: number, h: number) => {
  const img = document.createElement('img')
  Object.defineProperty(img, 'naturalWidth', { value: w })
  Object.defineProperty(img, 'naturalHeight', { value: h })
  return img
}

describe('fitSprite', () => {
  it('상자보다 큰 스프라이트는 비율을 지켜 줄이고 표시한다 (GIF를 PNG로 바꾸지 않음)', () => {
    const img = sprite(146, 81)
    fitSprite(img, 96)
    expect([img.style.width, img.style.height]).toEqual(['96px', '53px'])
    expect(img.dataset.downscaled).toBe('true')
  })

  it('작은 스프라이트는 upscale일 때 정수배로만 키운다', () => {
    const img = sprite(60, 60)
    fitSprite(img, 192)
    expect([img.style.width, img.style.height]).toEqual(['180px', '180px'])
    expect(img.dataset.downscaled).toBe('false')
  })

  it('upscale=false면 원본 크기를 지킨다 (목록·진화 트리)', () => {
    const img = sprite(46, 45)
    fitSprite(img, 96, { upscale: false })
    expect([img.style.width, img.style.height]).toEqual(['46px', '45px'])
  })

  it('크기를 알 수 없으면 건드리지 않는다', () => {
    const img = sprite(0, 0)
    fitSprite(img, 96)
    expect(img.style.width).toBe('')
    expect(img.dataset.downscaled).toBeUndefined()
  })
})
