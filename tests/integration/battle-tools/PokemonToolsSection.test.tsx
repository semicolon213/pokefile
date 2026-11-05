import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PokemonMediaSection as PokemonToolsSection } from '@/features/battle-tools'
import snapshot from './task011-fixture.json'

const current = { pokemonId: 6, speciesName: 'charizard', formKey: 'default' as const }
const index = { version: 2, pokemon: [
  { id: 6, nameEn: 'charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', forms: [
    { key: 'mega-x', nameKo: '메가리자몽X', nameEn: 'Mega Charizard X', category: 'mega', types: ['fire', 'dragon'], battleOnly: true },
    { key: 'mega-y', nameKo: '메가리자몽Y', nameEn: 'Mega Charizard Y', category: 'mega', types: ['fire', 'flying'], battleOnly: true },
  ] },
  { id: 25, nameEn: 'pikachu', nameKo: '피카츄', types: ['electric'], generation: 'generation-i', forms: [] },
  { id: 681, nameEn: 'Aegislash', nameKo: '킬가르도', types: ['steel', 'ghost'], generation: 'generation-vi', forms: [] },
] }
let client: QueryClient
let failPokemon = false
let failIndex = false
const responseFor = (url: string) => {
  const path = new URL(url, 'https://example.test').pathname
  if (path.endsWith('pokedex-index.json')) return failIndex ? new Response(null, { status: 503 }) : Response.json(index)
  const resource = path.split('/').at(-1)
  if (failPokemon) return new Response(null, { status: 503 })
  return Response.json(snapshot.pokemon.find((entry) => entry.name === resource || String(entry.id) === resource))
}
const providers = (child: React.ReactNode) => <QueryClientProvider client={client}><MemoryRouter>{child}</MemoryRouter></QueryClientProvider>
const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: '미디어 열기' }))
  await screen.findByRole('button', { name: '이로치' })
  return screen.getByRole('region', { name: '이로치와 울음소리' })
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } })
  failPokemon = false
  failIndex = false
  vi.stubGlobal('fetch', vi.fn(async (url: string) => responseFor(url)))
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
})
afterEach(() => { cleanup(); client.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('이로치·울음소리 UI (FR-23 / TC-08·09·11)', () => {
  it('열 때만 미디어를 조회하고 캐시를 재사용하며 상성·비교는 연결하지 않는다', async () => {
    render(providers(<PokemonToolsSection {...current} />))
    expect(fetch).not.toHaveBeenCalled()
    await open()
    expect(screen.queryByRole('list', { name: '공격 타입별 받는 배율' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('/type/'))).toBe(false)
    const count = vi.mocked(fetch).mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: '미디어 접기' }))
    await open()
    expect(fetch).toHaveBeenCalledTimes(count)
  })

  it('이로치 GIF → 이로치 PNG → 없음으로 대체하고 일반 이미지와 섞지 않는다', async () => {
    render(providers(<PokemonToolsSection {...current} />))
    await open()
    fireEvent.click(screen.getByRole('button', { name: '이로치' }))
    const image = screen.getByRole('img', { name: '리자몽 · 기본 이로치' })
    expect(image).toHaveAttribute('src', expect.stringContaining('/showdown/shiny/6.gif'))
    fireEvent.error(image)
    expect(image).toHaveAttribute('src', expect.stringContaining('/shiny/6.png'))
    fireEvent.error(image)
    expect(screen.getByRole('img', { name: '리자몽 · 기본 이로치 이미지 없음' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '일반' }))
    expect(screen.getByRole('img', { name: '리자몽 · 기본 일반' })).toBeInTheDocument()
  })

  it('울음소리는 자동 재생하지 않고 마지막 후보 실패 시 안내한다', async () => {
    render(providers(<PokemonToolsSection {...current} />))
    await open()
    let audio = screen.getByLabelText('리자몽 · 기본 울음소리')
    expect(audio).toHaveAttribute('preload', 'none')
    expect(audio).not.toHaveAttribute('autoplay')
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    fireEvent.error(audio)
    audio = screen.getByLabelText('리자몽 · 기본 울음소리')
    expect(audio).toHaveAttribute('src', expect.stringContaining('/legacy/6.ogg'))
    fireEvent.error(audio)
    expect(screen.getByText('울음소리를 재생할 수 없습니다.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '울음소리 다시 시도' }))
    expect(screen.getByLabelText('리자몽 · 기본 울음소리')).toHaveAttribute('src', expect.stringContaining('/latest/6.ogg'))
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  })

  it('D-1: 음원 교체·후보 소진·재시도에서 키보드 포커스를 이어준다', async () => {
    render(providers(<PokemonToolsSection {...current} />))
    await open()
    const first = screen.getByLabelText('리자몽 · 기본 울음소리')
    first.focus()
    expect(first).toHaveFocus()
    fireEvent.error(first)
    const fallback = screen.getByLabelText('리자몽 · 기본 울음소리')
    expect(fallback).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('다른 음원으로 전환했습니다.')
    fireEvent.error(fallback)
    const retry = screen.getByRole('button', { name: '울음소리 다시 시도' })
    expect(retry).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('울음소리를 재생할 수 없습니다.')
    fireEvent.click(retry)
    expect(screen.getByLabelText('리자몽 · 기본 울음소리')).toHaveFocus()
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  })

  it('D-1: 다른 조작 중 발생한 음원 오류는 포커스를 가져오지 않는다', async () => {
    render(providers(<PokemonToolsSection {...current} />))
    await open()
    const mode = screen.getByRole('button', { name: '이로치' })
    mode.focus()
    fireEvent.error(screen.getByLabelText('리자몽 · 기본 울음소리'))
    expect(mode).toHaveFocus()
    fireEvent.error(screen.getByLabelText('리자몽 · 기본 울음소리'))
    expect(mode).toHaveFocus()
  })

  it.each([[161, 107], [201, 166]])('D-2: %i×%i GIF를 원본 1배로 표시한다', async (width, height) => {
    render(providers(<PokemonToolsSection {...current} formKey="mega-x" />))
    await open()
    const image = screen.getByRole('img', { name: '리자몽 · 메가X 일반' })
    Object.defineProperties(image, { naturalWidth: { value: width }, naturalHeight: { value: height } })
    fireEvent.load(image)
    expect(image).toHaveAttribute('src', expect.stringContaining('/showdown/10034.gif'))
    expect(image).toHaveStyle({ width: `${width}px`, height: `${height}px` })
  })

  it('D-2: 실제 가용 너비를 넘는 GIF는 같은 모드의 PNG로 대체한다', async () => {
    render(providers(<PokemonToolsSection {...current} formKey="mega-x" />))
    await open()
    fireEvent.click(screen.getByRole('button', { name: '이로치' }))
    const image = screen.getByRole('img', { name: '리자몽 · 메가X 이로치' })
    Object.defineProperty(image.parentElement, 'clientWidth', { value: 180 })
    Object.defineProperties(image, { naturalWidth: { value: 201 }, naturalHeight: { value: 166 } })
    fireEvent.load(image)
    expect(screen.getByRole('img', { name: '리자몽 · 메가X 이로치' })).toHaveAttribute('src', expect.stringContaining('/shiny/10034.png'))
  })

  it('미디어가 누락되면 없음으로 안내하고 다른 모드의 이미지나 음원을 추정하지 않는다', async () => {
    const raw = snapshot.pokemon.find((entry) => entry.id === 6)!
    vi.mocked(fetch).mockImplementation(async (url) => String(url).endsWith('/pokemon/6')
      ? Response.json({ ...raw, sprites: {}, cries: {} }) : responseFor(String(url)))
    render(providers(<PokemonToolsSection {...current} />))
    await open()
    expect(screen.getByRole('img', { name: '리자몽 · 기본 일반 이미지 없음' })).toBeInTheDocument()
    expect(screen.getByText('울음소리 정보 없음')).toBeInTheDocument()
    expect(screen.queryByLabelText('리자몽 · 기본 울음소리')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '이로치' }))
    expect(screen.getByRole('img', { name: '리자몽 · 기본 이로치 이미지 없음' })).toBeInTheDocument()
  })

  it('현재 폼을 바꾸면 이전 이미지·음원을 제거하고 새 폼의 미디어를 표시한다', async () => {
    const view = render(providers(<PokemonToolsSection {...current} />))
    await open()
    fireEvent.click(screen.getByRole('button', { name: '이로치' }))
    const previousAudio = screen.getByLabelText('리자몽 · 기본 울음소리')
    const pause = vi.spyOn(previousAudio as HTMLAudioElement, 'pause')
    let finish!: (value: Response) => void
    vi.mocked(fetch).mockImplementation(async (url) => String(url).endsWith('/charizard-mega-x')
      ? new Promise<Response>((resolve) => { finish = resolve }) : responseFor(String(url)))
    view.rerender(providers(<PokemonToolsSection {...current} formKey="mega-x" />))
    expect(screen.getByText('이로치·울음소리 정보를 불러오는 중입니다.')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: '리자몽 · 기본 이로치' })).not.toBeInTheDocument()
    expect(previousAudio).not.toBeInTheDocument()
    expect(pause).toHaveBeenCalled()
    finish(Response.json(snapshot.pokemon.find((entry) => entry.name === 'charizard-mega-x')))
    expect(await screen.findByRole('img', { name: '리자몽 · 메가X 일반' })).toHaveAttribute('src', expect.stringContaining('10034.gif'))
    expect(screen.getByLabelText('리자몽 · 메가X 울음소리')).toHaveAttribute('src', expect.stringContaining('/latest/10034.ogg'))
    expect(screen.getByRole('button', { name: '일반' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('미디어 조회 실패를 안내하고 재시도한다', async () => {
    failPokemon = true
    render(providers(<PokemonToolsSection {...current} />))
    fireEvent.click(screen.getByRole('button', { name: '미디어 열기' }))
    expect(await screen.findByText('이로치·울음소리 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    failPokemon = false
    fireEvent.click(screen.getByRole('button', { name: '미디어 다시 시도' }))
    expect(await screen.findByRole('img', { name: '리자몽 · 기본 일반' })).toBeInTheDocument()
  })

  it('표시 이름 목록 조회가 실패해도 번호·영문 이름으로 미디어를 유지한다', async () => {
    failIndex = true
    render(providers(<PokemonToolsSection {...current} />))
    await open()
    expect(screen.getByRole('img', { name: '#0006 charizard · 기본 일반' })).toBeInTheDocument()
    expect(screen.getByLabelText('#0006 charizard · 기본 울음소리')).toBeInTheDocument()
  })

  it('접기와 화면 이탈 시 울음소리를 중지한다', async () => {
    const view = render(providers(<PokemonToolsSection {...current} />))
    await open()
    const first = screen.getByLabelText('리자몽 · 기본 울음소리') as HTMLAudioElement
    const pauseFirst = vi.spyOn(first, 'pause')
    fireEvent.click(screen.getByRole('button', { name: '미디어 접기' }))
    expect(pauseFirst).toHaveBeenCalled()
    await open()
    const second = screen.getByLabelText('리자몽 · 기본 울음소리') as HTMLAudioElement
    const pauseSecond = vi.spyOn(second, 'pause')
    view.unmount()
    expect(pauseSecond).toHaveBeenCalled()
  })

  it('이전 폼의 늦은 응답이 새 포켓몬의 미디어를 덮어쓰지 않는다', async () => {
    const view = render(providers(<PokemonToolsSection {...current} />))
    await open()
    let finish!: (value: Response) => void
    vi.mocked(fetch).mockImplementation(async (url) => String(url).endsWith('/charizard-mega-x')
      ? new Promise<Response>((resolve) => { finish = resolve }) : responseFor(String(url)))
    view.rerender(providers(<PokemonToolsSection {...current} formKey="mega-x" />))
    view.rerender(providers(<PokemonToolsSection pokemonId={25} speciesName="pikachu" formKey="default" />))
    expect(await screen.findByRole('img', { name: '피카츄 · 기본 일반' })).toBeInTheDocument()
    finish(Response.json(snapshot.pokemon.find((entry) => entry.name === 'charizard-mega-x')))
    await waitFor(() => expect(screen.getByRole('img', { name: '피카츄 · 기본 일반' })).toHaveAttribute('src', expect.stringContaining('/25.gif')))
    expect(screen.queryByLabelText('리자몽 · 메가X 울음소리')).not.toBeInTheDocument()
  })

  it('움직임 줄이기 설정에서는 이로치 PNG를 사용한다', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    render(providers(<PokemonToolsSection {...current} />))
    await open()
    fireEvent.click(screen.getByRole('button', { name: '이로치' }))
    expect(screen.getByRole('img', { name: '리자몽 · 기본 이로치' })).toHaveAttribute('src', expect.stringContaining('/shiny/6.png'))
  })
})
