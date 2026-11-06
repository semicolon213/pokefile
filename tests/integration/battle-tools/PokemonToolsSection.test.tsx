import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PokemonMediaSection } from '@/features/battle-tools'
import snapshot from './task011-fixture.json'

const current = { pokemonId: 6, speciesName: 'charizard', formKey: 'default' as const }
const index = { version: 2, pokemon: [
  { id: 6, nameEn: 'charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', forms: [
    { key: 'mega-x', nameKo: '메가리자몽X', nameEn: 'Mega Charizard X', category: 'mega', types: ['fire', 'dragon'], battleOnly: true },
  ] },
  { id: 25, nameEn: 'pikachu', nameKo: '피카츄', types: ['electric'], generation: 'generation-i', forms: [] },
] }
let client: QueryClient
let failPokemon = false
let failIndex = false
const responseFor = (url: string) => {
  const path = new URL(url, 'https://example.test').pathname
  if (path.endsWith('pokedex-index.json')) return failIndex ? new Response(null, { status: 503 }) : Response.json(index)
  if (failPokemon) return new Response(null, { status: 503 })
  const resource = path.split('/').at(-1)
  return Response.json(snapshot.pokemon.find((entry) => entry.name === resource || String(entry.id) === resource))
}
const providers = (child: React.ReactNode) => <QueryClientProvider client={client}><MemoryRouter>{child}</MemoryRouter></QueryClientProvider>
const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: '울음소리 열기' }))
  return screen.findByLabelText('리자몽 · 기본 울음소리')
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

describe('울음소리 영역 (FR-23 / TC-08·09·11)', () => {
  it('열 때만 조회하고 캐시를 재사용하며 중복 이미지·이로치 버튼을 표시하지 않는다', async () => {
    render(providers(<PokemonMediaSection {...current} />))
    expect(fetch).not.toHaveBeenCalled()
    await open()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('/type/'))).toBe(false)
    const count = vi.mocked(fetch).mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: '울음소리 접기' }))
    await open()
    expect(fetch).toHaveBeenCalledTimes(count)
  })

  it('자동 재생 없이 음원 후보를 대체하고 소진 시 재시도한다', async () => {
    render(providers(<PokemonMediaSection {...current} />))
    const audio = await open()
    expect(audio).toHaveAttribute('preload', 'none')
    expect(audio).not.toHaveAttribute('autoplay')
    fireEvent.error(audio)
    expect(screen.getByLabelText('리자몽 · 기본 울음소리')).toHaveAttribute('src', expect.stringContaining('/legacy/6.ogg'))
    fireEvent.error(screen.getByLabelText('리자몽 · 기본 울음소리'))
    expect(screen.getByText('울음소리를 재생할 수 없습니다.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '울음소리 다시 시도' }))
    expect(screen.getByLabelText('리자몽 · 기본 울음소리')).toHaveAttribute('src', expect.stringContaining('/latest/6.ogg'))
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  })

  it('D-1: 음원 교체·후보 소진·재시도에서 키보드 포커스를 이어준다', async () => {
    render(providers(<PokemonMediaSection {...current} />))
    const audio = await open()
    audio.focus()
    fireEvent.error(audio)
    const fallback = screen.getByLabelText('리자몽 · 기본 울음소리')
    expect(fallback).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('다른 음원으로 전환했습니다.')
    fireEvent.error(fallback)
    const retry = screen.getByRole('button', { name: '울음소리 다시 시도' })
    expect(retry).toHaveFocus()
    fireEvent.click(retry)
    expect(screen.getByLabelText('리자몽 · 기본 울음소리')).toHaveFocus()
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  })

  it('다른 조작 중 발생한 음원 오류는 포커스를 가져오지 않는다', async () => {
    render(providers(<PokemonMediaSection {...current} />))
    await open()
    const collapse = screen.getByRole('button', { name: '울음소리 접기' })
    collapse.focus()
    fireEvent.error(screen.getByLabelText('리자몽 · 기본 울음소리'))
    fireEvent.error(screen.getByLabelText('리자몽 · 기본 울음소리'))
    expect(collapse).toHaveFocus()
  })

  it('음원이 없으면 안내하고 URL을 추정하지 않는다', async () => {
    const raw = snapshot.pokemon.find((entry) => entry.id === 6)!
    vi.mocked(fetch).mockImplementation(async (url) => String(url).endsWith('/pokemon/6')
      ? Response.json({ ...raw, cries: {} }) : responseFor(String(url)))
    render(providers(<PokemonMediaSection {...current} />))
    fireEvent.click(screen.getByRole('button', { name: '울음소리 열기' }))
    expect(await screen.findByText('울음소리 정보 없음')).toBeInTheDocument()
    expect(screen.queryByLabelText('리자몽 · 기본 울음소리')).not.toBeInTheDocument()
  })

  it('폼 변경 시 이전 음원을 제거·중지하고 새 응답만 표시한다', async () => {
    const view = render(providers(<PokemonMediaSection {...current} />))
    const previous = await open()
    const pause = vi.spyOn(previous as HTMLAudioElement, 'pause')
    let finish!: (value: Response) => void
    vi.mocked(fetch).mockImplementation(async (url) => String(url).endsWith('/charizard-mega-x')
      ? new Promise<Response>((resolve) => { finish = resolve }) : responseFor(String(url)))
    view.rerender(providers(<PokemonMediaSection {...current} formKey="mega-x" />))
    expect(screen.getByText('울음소리 정보를 불러오는 중입니다.')).toBeInTheDocument()
    expect(previous).not.toBeInTheDocument()
    expect(pause).toHaveBeenCalled()
    finish(Response.json(snapshot.pokemon.find((entry) => entry.name === 'charizard-mega-x')))
    expect(await screen.findByLabelText('리자몽 · 메가X 울음소리')).toHaveAttribute('src', expect.stringContaining('/latest/10034.ogg'))
  })

  it('조회 실패를 안내하고 재시도한다', async () => {
    failPokemon = true
    render(providers(<PokemonMediaSection {...current} />))
    fireEvent.click(screen.getByRole('button', { name: '울음소리 열기' }))
    expect(await screen.findByText('울음소리 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    failPokemon = false
    fireEvent.click(screen.getByRole('button', { name: '울음소리 정보 다시 시도' }))
    expect(await screen.findByLabelText('리자몽 · 기본 울음소리')).toBeInTheDocument()
  })

  it('이름 목록 조회가 실패해도 번호·영문 이름으로 음원을 유지한다', async () => {
    failIndex = true
    render(providers(<PokemonMediaSection {...current} />))
    fireEvent.click(screen.getByRole('button', { name: '울음소리 열기' }))
    expect(await screen.findByLabelText('#0006 charizard · 기본 울음소리')).toBeInTheDocument()
  })

  it('접기와 화면 이탈 시 재생을 중지한다', async () => {
    const view = render(providers(<PokemonMediaSection {...current} />))
    const first = await open()
    const pauseFirst = vi.spyOn(first as HTMLAudioElement, 'pause')
    fireEvent.click(screen.getByRole('button', { name: '울음소리 접기' }))
    expect(pauseFirst).toHaveBeenCalled()
    const second = await open()
    const pauseSecond = vi.spyOn(second as HTMLAudioElement, 'pause')
    view.unmount()
    expect(pauseSecond).toHaveBeenCalled()
  })

  it('이전 폼의 늦은 응답이 새 포켓몬의 음원을 덮어쓰지 않는다', async () => {
    const view = render(providers(<PokemonMediaSection {...current} />))
    await open()
    let finish!: (value: Response) => void
    vi.mocked(fetch).mockImplementation(async (url) => String(url).endsWith('/charizard-mega-x')
      ? new Promise<Response>((resolve) => { finish = resolve }) : responseFor(String(url)))
    view.rerender(providers(<PokemonMediaSection {...current} formKey="mega-x" />))
    view.rerender(providers(<PokemonMediaSection pokemonId={25} speciesName="pikachu" formKey="default" />))
    expect(await screen.findByLabelText('피카츄 · 기본 울음소리')).toBeInTheDocument()
    finish(Response.json(snapshot.pokemon.find((entry) => entry.name === 'charizard-mega-x')))
    await waitFor(() => expect(screen.getByLabelText('피카츄 · 기본 울음소리')).toHaveAttribute('src', expect.stringContaining('/25.ogg')))
    expect(screen.queryByLabelText('리자몽 · 메가X 울음소리')).not.toBeInTheDocument()
  })
})
