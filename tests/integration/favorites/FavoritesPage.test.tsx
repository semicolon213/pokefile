import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FavoritesPage } from '@/features/favorites/pages/FavoritesPage'
import { FAVORITES_STORAGE_KEY } from '@/features/favorites/model/storage'
import { favoritesStore } from '@/features/favorites/model/store'
import type { PokemonSummary } from '@/shared/models'

const pokemon: PokemonSummary[] = [
  { id: 25, nameEn: 'pikachu', nameKo: '피카츄', types: ['electric'], generation: 'generation-i', forms: [] },
  { id: 6, nameEn: 'charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', forms: [{ key: 'mega-x', nameKo: '메가리자몽X', nameEn: 'Mega Charizard X', category: 'mega', types: ['fire', 'dragon'], battleOnly: true }, { key: 'mega-y', nameKo: '메가리자몽Y', nameEn: 'Mega Charizard Y', category: 'mega', types: ['fire', 'flying'], battleOnly: true }] },
]
const clients: QueryClient[] = []
const response = (entries = pokemon) => Response.json({ version: 2, generatedAt: '2026-11-04', count: entries.length, pokemon: entries })
const save = (ids: number[]) => localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ version: 1, ids }))
const saved = () => JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)!)

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  clients.push(client)
  return render(<QueryClientProvider client={client}><MemoryRouter><FavoritesPage /></MemoryRouter></QueryClientProvider>)
}

beforeEach(() => {
  localStorage.clear()
  favoritesStore.refresh()
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(response())))
})
afterEach(() => {
  for (const client of clients.splice(0)) client.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('즐겨찾기 목록 연결 (FR-19~22 / TC-07·08·09)', () => {
  it('저장 순서대로 같은 도감 카드를 표시하고 마지막 항목 해제 후 빈 목록으로 전환한다', async () => {
    save([6, 25])
    renderPage()
    const list = await screen.findByRole('list', { name: '저장한 포켓몬' })
    const cards = within(list).getAllByRole('listitem')
    expect(within(cards[0]).getByRole('link')).toHaveTextContent('리자몽')
    expect(within(cards[0]).getByRole('link')).toHaveAttribute('href', '/pokemon/6')
    expect(within(cards[0]).getByText('불꽃')).toBeInTheDocument()
    expect(within(cards[1]).getByRole('link')).toHaveTextContent('피카츄')
    expect(within(cards[1]).getByRole('link')).toHaveAccessibleName(/피카츄/)
    fireEvent.click(screen.getByRole('button', { name: '#0006 즐겨찾기 해제' }))
    expect(saved()).toEqual({ version: 1, ids: [25] })
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '#0025 즐겨찾기 해제' }))
    expect(screen.getByText('즐겨찾기한 포켓몬이 없습니다.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '도감으로 이동' })).toHaveAttribute('href', '/')
    expect(saved()).toEqual({ version: 1, ids: [] })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('저장한 항목의 정보를 기다리는 동안 로딩을 표시한다', async () => {
    save([25])
    let finish!: (value: Response) => void
    vi.mocked(fetch).mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve }))
    renderPage()
    expect(screen.getByText('즐겨찾기 포켓몬을 불러오는 중입니다.')).toBeInTheDocument()
    finish(response())
    expect(await screen.findByRole('link', { name: /피카츄/ })).toBeInTheDocument()
  })

  it('조회 실패 시 번호로 상세 확인·해제를 제공하고 재시도로 정상 카드를 복구한다', async () => {
    save([25])
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('포켓몬 정보를 불러오지 못했습니다.')
    expect(screen.getByRole('link', { name: '포켓몬 #0025 상세 보기' })).toHaveAttribute('href', '/pokemon/25')
    expect(screen.getByRole('button', { name: '#0025 즐겨찾기 해제' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByRole('link', { name: /피카츄/ })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(saved()).toEqual({ version: 1, ids: [25] })
  })

  it('인덱스에 없는 항목도 해제할 수 있으며 다른 저장 항목은 유지한다', async () => {
    save([6, 25])
    vi.mocked(fetch).mockResolvedValueOnce(response([pokemon[0]]))
    renderPage()
    expect(await screen.findByText(/일부 포켓몬 정보를 찾지 못했습니다/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '포켓몬 #0006 상세 보기' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /피카츄/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '#0006 즐겨찾기 해제' }))
    expect(saved()).toEqual({ version: 1, ids: [25] })
    expect(screen.queryByText(/일부 포켓몬 정보를 찾지 못했습니다/)).not.toBeInTheDocument()
  })

  it.each(['{broken', '{"version":2,"ids":[25]}'])('손상·다른 버전(%s)은 안내와 빈 목록을 표시하고 읽기만으로 덮어쓰지 않는다', (raw) => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, raw)
    renderPage()
    expect(screen.getByText('저장된 즐겨찾기를 읽을 수 없어 빈 목록으로 시작합니다.')).toBeInTheDocument()
    expect(screen.getByText('즐겨찾기한 포켓몬이 없습니다.')).toBeInTheDocument()
    expect(localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe(raw)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('잘못된 ID·중복을 제외한 안내와 유효한 저장 항목을 표시한다', async () => {
    save([25, 25, 0, 1026])
    renderPage()
    expect(screen.getByText('잘못되거나 중복된 즐겨찾기 정보를 제외했습니다.')).toBeInTheDocument()
    expect(await screen.findByRole('list', { name: '저장한 포켓몬' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('저장소 접근이 차단되면 탐색 링크를 유지하고 접근 복구 후 재읽기가 가능하다', () => {
    const blocked = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
    try {
      renderPage()
      expect(screen.getByRole('alert')).toHaveTextContent('브라우저 저장 공간을 사용할 수 없어')
      expect(screen.getByRole('link', { name: '도감으로 이동' })).toHaveAttribute('href', '/')
      expect(screen.queryByText('즐겨찾기한 포켓몬이 없습니다.')).not.toBeInTheDocument()
      expect(fetch).not.toHaveBeenCalled()
    } finally { blocked.mockRestore() }
    fireEvent.click(screen.getByRole('button', { name: '저장 정보 다시 읽기' }))
    expect(screen.getByText('즐겨찾기한 포켓몬이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('삭제 저장 실패 시 카드를 유지하고 저장소 재읽기 후 다시 삭제할 수 있다', async () => {
    save([25])
    renderPage()
    const remove = await screen.findByRole('button', { name: '#0025 즐겨찾기 해제' })
    const full = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
    fireEvent.click(remove)
    expect(screen.getByRole('alert')).toHaveTextContent('브라우저 저장 공간을 사용할 수 없어')
    expect(remove).toBeDisabled()
    expect(remove).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: /피카츄/ })).toBeInTheDocument()
    expect(saved()).toEqual({ version: 1, ids: [25] })
    full.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: '저장 정보 다시 읽기' }))
    await waitFor(() => expect(remove).toBeEnabled())
    fireEvent.click(remove)
    expect(screen.getByText('즐겨찾기한 포켓몬이 없습니다.')).toBeInTheDocument()
    expect(saved()).toEqual({ version: 1, ids: [] })
  })
})
