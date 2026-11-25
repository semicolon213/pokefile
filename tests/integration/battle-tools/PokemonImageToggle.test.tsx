import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PokemonImageToggle } from '@/features/battle-tools'
import { createStillImage } from '@/features/battle-tools/model/stillImage'

vi.mock('@/features/battle-tools/model/stillImage', () => ({ createStillImage: vi.fn() }))
const stillPng = 'data:image/png;base64,c3RpbGw='
beforeEach(() => { vi.mocked(createStillImage).mockResolvedValue({ status: 'ready', url: stillPng }) })

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

  it('움직임 줄이기에서 PNG가 실패하면 같은 GIF의 정지 이미지로 대체한다', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<PokemonImageToggle {...current} />)
    fireEvent.error(screen.getByRole('img'))
    expect(await screen.findByRole('img')).toHaveAttribute('src', stillPng)
  })

  it('움직임 줄이기에서는 일반·이로치 모두 PNG를 사용한다', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<PokemonImageToggle {...current} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', current.normalUrls[1])
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('img')).toHaveAttribute('src', current.shinyUrls[1])
  })

  it('이로치 데이터가 없어도 일반 모드로 돌아올 수 있다', () => {
    render(<PokemonImageToggle {...current} shinyUrls={[]} isBaseImage />)
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('img', { name: '리자몽 이로치 이미지 없음' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('img')).toHaveAttribute('src', current.normalUrls[0])
  })

  it('GIF 전용 선택 폼은 같은 GIF의 정지 이미지로 표시한다 (#49)', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<PokemonImageToggle {...current} normalUrls={[current.normalUrls[0]]} />)
    expect(await screen.findByRole('img')).toHaveAttribute('src', stillPng)
    expect(createStillImage).toHaveBeenCalledWith(current.normalUrls[0], expect.any(AbortSignal))
    expect(screen.queryByText('기본 모습으로 표시 중')).not.toBeInTheDocument()
  })

  it('선택 폼의 PNG·HOME을 모두 시도한 뒤 같은 GIF를 정지 이미지로 사용한다', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<PokemonImageToggle {...current} normalUrls={['form.gif', 'form.png', 'home.png']} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'form.png')
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByRole('img')).toHaveAttribute('src', 'home.png')
    fireEvent.error(screen.getByRole('img'))
    expect(await screen.findByRole('img')).toHaveAttribute('src', stillPng)
  })

  it('선택 폼 URL이 있지만 모두 실패하면 기본 모습으로 바꾸지 않는다 (PR #50 유지)', () => {
    render(<PokemonImageToggle {...current} />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByRole('img')).toHaveAttribute('src', current.normalUrls[1])
    fireEvent.error(screen.getByRole('img'))
    expect(screen.queryByText('기본 모습으로 표시 중')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: '리자몽 이미지 없음' })).toBeInTheDocument()
  })

  it('선택 폼이 처음부터 없으면 기본 모습의 정적 이미지를 사용한다', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(<PokemonImageToggle {...current} normalUrls={['base.gif', 'base.png']} isBaseImage />)
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', 'base.png')
    fireEvent.load(image)
    expect(screen.getByText('기본 모습으로 표시 중')).toBeInTheDocument()
  })

  it('정지 이미지를 만들 수 없으면 안내하며 기본 폼이나 재생 GIF로 바꾸지 않는다', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    vi.mocked(createStillImage).mockResolvedValue({ status: 'unavailable' })
    render(<PokemonImageToggle {...current} normalUrls={['form.gif']} />)
    const empty = await screen.findByRole('img', { name: '리자몽 정적 이미지 없음' })
    expect(empty).toHaveTextContent('움직임 줄이기 설정에서 표시할 정적 이미지가 없습니다.')
    expect(empty).not.toHaveAttribute('src')
    expect(screen.queryByText('기본 모습으로 표시 중')).not.toBeInTheDocument()
  })

  it('GIF 요청도 404이면 이미지 없음으로 안내한다', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    vi.mocked(createStillImage).mockResolvedValue({ status: 'missing' })
    render(<PokemonImageToggle {...current} normalUrls={['missing.gif']} />)
    expect(await screen.findByRole('img', { name: '리자몽 이미지 없음' })).not.toHaveAttribute('src')
  })

  it('열린 페이지에서 움직임 설정을 바꾸면 바로 반영하고 구독을 정리한다', () => {
    let matches = false
    const listeners = new Set<() => void>()
    vi.stubGlobal('matchMedia', () => ({ get matches() { return matches },
      addEventListener: (_event: string, callback: () => void) => listeners.add(callback),
      removeEventListener: (_event: string, callback: () => void) => listeners.delete(callback),
    }))
    const view = render(<PokemonImageToggle {...current} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', current.normalUrls[0])
    act(() => { matches = true; listeners.forEach((listener) => listener()) })
    expect(screen.getByRole('img')).toHaveAttribute('src', current.normalUrls[1])
    act(() => { matches = false; listeners.forEach((listener) => listener()) })
    expect(screen.getByRole('img')).toHaveAttribute('src', current.normalUrls[0])
    view.unmount()
    expect(listeners.size).toBe(0)
  })

  it('변환 중 이로치로 바꾸면 이전 일반 이미지의 비동기 결과를 무시한다', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    let finish!: (value: Awaited<ReturnType<typeof createStillImage>>) => void
    vi.mocked(createStillImage).mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    render(<PokemonImageToggle {...current} normalUrls={['form.gif']} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('img')).toHaveAttribute('src', current.shinyUrls[1])
    await act(async () => finish({ status: 'ready', url: stillPng }))
    expect(screen.getByRole('img')).toHaveAttribute('src', current.shinyUrls[1])
  })
})
