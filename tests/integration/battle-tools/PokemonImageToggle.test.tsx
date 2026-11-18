import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PokemonImageToggle } from '@/features/battle-tools'

const current = { name: '리자몽', normalUrls: ['https://example.com/normal.gif', 'https://example.com/normal.png'],
  shinyUrls: ['https://example.com/shiny.gif', 'https://example.com/shiny.png'] }
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('대표 이미지 이로치 토글 (FR-23 / TC-08·11)', () => {
  it('이미지 아래에는 재생 컨트롤만 제공하고 이로치 전환 시 같은 음원을 유지한다', () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const view = render(<PokemonImageToggle {...current} cryUrls={['https://example.com/cry.ogg']} />)
    const audio = screen.getByLabelText('리자몽 울음소리')
    expect(audio).toHaveAttribute('controls', '')
    expect(audio).toHaveAttribute('preload', 'none')
    expect(audio).not.toHaveAttribute('autoplay')
    expect(screen.queryByRole('heading', { name: '울음소리' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '울음소리 열기' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByLabelText('리자몽 울음소리')).toBe(audio)
    expect(play).not.toHaveBeenCalled()
    expect(pause).not.toHaveBeenCalled()
    view.unmount()
    expect(pause).toHaveBeenCalled()
  })

  it('대표 이미지 한 곳에서 토글 상태·이미지·대체 텍스트를 전환한다', () => {
    render(<PokemonImageToggle {...current} />)
    const toggle = screen.getByRole('switch', { name: '이로치' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.getByRole('img', { name: '리자몽' })).toHaveAttribute('src', current.normalUrls[0])
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.getByRole('img', { name: '리자몽 이로치' })).toHaveAttribute('src', current.shinyUrls[0])
    fireEvent.click(toggle)
    expect(screen.getByRole('img', { name: '리자몽' })).toHaveAttribute('src', current.normalUrls[0])
  })

  it('이로치 GIF→PNG→없음으로 대체하며 일반 후보와 섞지 않는다', () => {
    render(<PokemonImageToggle {...current} />)
    fireEvent.click(screen.getByRole('switch'))
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByRole('img')).toHaveAttribute('src', current.shinyUrls[1])
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByRole('img', { name: '리자몽 이로치 이미지 없음' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('img')).toHaveAttribute('src', current.normalUrls[0])
  })

  it.each([[161, 107], [201, 166]])('D-2: %i×%i GIF를 대표 이미지 안에서 원본 1배로 표시한다', (width, height) => {
    render(<PokemonImageToggle {...current} />)
    const image = screen.getByRole('img')
    Object.defineProperties(image, { naturalWidth: { value: width }, naturalHeight: { value: height } })
    fireEvent.load(image)
    expect(image).toHaveAttribute('src', current.normalUrls[0])
    expect(image).toHaveStyle({ width: `${width}px`, height: `${height}px` })
  })

  it('실제 가용 너비보다 큰 이로치 GIF는 PNG로 바꾸지 않고 줄여서 표시한다', () => {
    render(<PokemonImageToggle {...current} />)
    fireEvent.click(screen.getByRole('switch'))
    const image = screen.getByRole('img')
    Object.defineProperty(image.parentElement, 'clientWidth', { value: 180 })
    Object.defineProperties(image, { naturalWidth: { value: 201 }, naturalHeight: { value: 166 } })
    fireEvent.load(image)
    expect(screen.getByRole('img')).toHaveAttribute('src', current.shinyUrls[0])
    expect(image).toHaveStyle({ width: '180px', height: '149px' })
  })

  it('움직임 줄이기에서 PNG가 실패하면 GIF로 대체한다', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<PokemonImageToggle {...current} />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByRole('img')).toHaveAttribute('src', current.normalUrls[0])
  })

  it('움직임 줄이기에서는 일반·이로치 모두 PNG를 사용한다', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<PokemonImageToggle {...current} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', current.normalUrls[1])
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('img')).toHaveAttribute('src', current.shinyUrls[1])
  })

  it('이로치 데이터가 없어도 일반 모드로 돌아올 수 있다', () => {
    render(<PokemonImageToggle {...current} shinyUrls={[]} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('img', { name: '리자몽 이로치 이미지 없음' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('img')).toHaveAttribute('src', current.normalUrls[0])
  })
})
