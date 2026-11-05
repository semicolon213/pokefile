import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FavoritesPage } from '@/features/favorites/pages/FavoritesPage'
import { COLLECTION_STORAGE_KEY } from '@/features/favorites/collection/storage'
import { collectionStore, createCollectionStore } from '@/features/favorites/collection/store'
import { favoritesStore } from '@/features/favorites/model/store'
import type { PokemonSummary } from '@/shared/models'

const pokemon: PokemonSummary[] = [
  { id: 6, nameEn: 'charizard', nameKo: '리자몽', generation: 'generation-i', types: ['fire', 'flying'], forms: [] },
  { id: 25, nameEn: 'pikachu', nameKo: '피카츄', generation: 'generation-i', types: ['electric'], forms: [] },
  { id: 1025, nameEn: 'pecharunt', nameKo: '복숭악동', generation: 'generation-ix', types: ['poison', 'ghost'], forms: [] },
]
let client: QueryClient
const response = () => Response.json({ version: 2, count: pokemon.length, pokemon })
const saved = () => JSON.parse(localStorage.getItem(COLLECTION_STORAGE_KEY)!)
const renderPage = (path = '/favorites?view=collection') => render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><FavoritesPage /></MemoryRouter></QueryClientProvider>)
const coldCollectionStore = () => {
  const store = createCollectionStore(() => window.localStorage)
  vi.spyOn(collectionStore, 'getSnapshot').mockImplementation(store.getSnapshot)
  vi.spyOn(collectionStore, 'subscribe').mockImplementation(store.subscribe)
  vi.spyOn(collectionStore, 'refresh').mockImplementation(store.refresh)
  vi.spyOn(collectionStore, 'toggle').mockImplementation(store.toggle)
}

beforeEach(() => {
  localStorage.clear()
  collectionStore.refresh()
  favoritesStore.refresh()
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
  vi.stubGlobal('fetch', vi.fn(async () => response()))
})
afterEach(() => { cleanup(); client.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('도감 체크리스트 화면 (FR-29 / TC-14·08·09)', () => {
  it('즐겨찾기 화면에서 진입해 체크·해제와 전체·세대별 비율을 표시한다', async () => {
    renderPage('/favorites')
    expect(fetch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('link', { name: '도감 체크리스트' }))
    const checkbox = await screen.findByRole('checkbox', { name: '#0025 피카츄 포획 완료' })
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(saved()).toEqual({ version: 1, ids: [25] })
    expect(screen.getByText('1 / 3마리 · 33.3%')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: '1세대 도감 완성률' })).toHaveAttribute('value', '1')
    expect(localStorage.getItem('pokefile:favorites')).toBeNull()
    fireEvent.click(checkbox)
    expect(saved().ids).toEqual([])
    fireEvent.click(screen.getByRole('link', { name: '즐겨찾기 목록' }))
    expect(screen.getByRole('heading', { level: 1, name: '즐겨찾기' })).toBeInTheDocument()
  })
  it('저장 기록을 복원하고 검색·세대·포획 필터가 완성률 분모를 바꾸지 않는다', async () => {
    localStorage.setItem(COLLECTION_STORAGE_KEY, '{"version":1,"ids":[25,1025]}')
    renderPage()
    expect(await screen.findByRole('checkbox', { name: '#1025 복숭악동 포획 완료' })).toBeChecked()
    fireEvent.change(screen.getByLabelText('체크리스트 검색'), { target: { value: 'Pikachu' } })
    const list = screen.getByRole('list', { name: '도감 체크리스트 목록' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('2 / 3마리 · 66.7%')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('세대'), { target: { value: 'generation-ix' } })
    expect(screen.getByText('조건에 맞는 포켓몬이 없습니다.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('체크리스트 검색'), { target: { value: '#1025' } })
    expect(screen.getByRole('checkbox', { name: '#1025 복숭악동 포획 완료' })).toBeChecked()
    fireEvent.change(screen.getByLabelText('포획 상태'), { target: { value: 'missing' } })
    expect(screen.getByText('조건에 맞는 포켓몬이 없습니다.')).toBeInTheDocument()
    expect(screen.getByText('2 / 3마리 · 66.7%')).toBeInTheDocument()
  })
  it('로딩·조회 실패·재시도를 처리하고 저장 기록을 보존한다', async () => {
    localStorage.setItem(COLLECTION_STORAGE_KEY, '{"version":1,"ids":[25]}')
    let finish!: (response: Response) => void
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve }))
    renderPage()
    expect(screen.getByText('도감 체크리스트를 불러오는 중입니다.')).toBeInTheDocument()
    finish(new Response(null, { status: 503 }))
    expect(await screen.findByRole('alert')).toHaveTextContent('저장된 포획 기록은 유지됩니다.')
    expect(saved().ids).toEqual([25])
    fireEvent.click(screen.getByRole('button', { name: '목록 다시 시도' }))
    expect(await screen.findByRole('checkbox', { name: '#0025 피카츄 포획 완료' })).toBeChecked()
  })
  it('손상 기록을 안내하고 읽기만으로 덮어쓰지 않는다', async () => {
    localStorage.setItem(COLLECTION_STORAGE_KEY, 'broken')
    renderPage()
    await screen.findByRole('checkbox', { name: '#0025 피카츄 포획 여부 확인 불가' })
    expect(screen.getByText(/저장된 도감 기록 전체를/)).toBeInTheDocument()
    expect(localStorage.getItem(COLLECTION_STORAGE_KEY)).toBe('broken')
  })
  it('쓰기 실패 시 체크를 유지하고 재읽기 후 다시 저장한다', async () => {
    localStorage.setItem(COLLECTION_STORAGE_KEY, '{"version":1,"ids":[25]}')
    renderPage()
    const checkbox = await screen.findByRole('checkbox', { name: '#0025 피카츄 포획 완료' })
    const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(checkbox).toBeDisabled()
    expect(saved().ids).toEqual([25])
    blocked.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: '포획 기록 다시 읽기' }))
    await waitFor(() => expect(checkbox).toBeEnabled())
    fireEvent.click(checkbox)
    expect(saved().ids).toEqual([])
  })
  it('다른 탭의 변경과 clear 이벤트를 반영한다', async () => {
    renderPage()
    const checkbox = await screen.findByRole('checkbox', { name: '#0025 피카츄 포획 완료' })
    localStorage.setItem(COLLECTION_STORAGE_KEY, '{"version":1,"ids":[25]}')
    fireEvent(window, new StorageEvent('storage', { key: COLLECTION_STORAGE_KEY, storageArea: localStorage }))
    expect(checkbox).toBeChecked()
    localStorage.removeItem(COLLECTION_STORAGE_KEY)
    fireEvent(window, new StorageEvent('storage', { key: null, storageArea: localStorage }))
    expect(checkbox).not.toBeChecked()
  })

  it('읽기 차단 시 완성률을 추정하지 않고 탐색과 복구를 제공한다', async () => {
    coldCollectionStore()
    const blocked = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('blocked') })
    renderPage()
    const checkbox = await screen.findByRole('checkbox', { name: '#0025 피카츄 포획 여부 확인 불가' })
    expect(checkbox).toBeDisabled()
    expect(screen.getByText('저장된 기록을 확인할 수 없어 완성률을 표시하지 않습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /피카츄/ })).toBeInTheDocument()
    blocked.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: '포획 기록 다시 읽기' }))
    await waitFor(() => expect(checkbox).toBeEnabled())
    expect(screen.getByRole('progressbar', { name: '전체 도감 완성률' })).toBeInTheDocument()
  })

  it('처음 화면 이후의 포켓몬을 추가 표시하고 검색으로 찾을 수 있다', async () => {
    const entries = Array.from({ length: 49 }, (_, position) => ({ ...pokemon[0], id: position + 1, nameKo: `포켓몬${position + 1}` }))
    vi.mocked(fetch).mockImplementation(async () => Response.json({ version: 2, pokemon: entries }))
    renderPage()
    await screen.findByRole('checkbox', { name: '#0001 포켓몬1 포획 완료' })
    expect(screen.getAllByRole('checkbox')).toHaveLength(48)
    fireEvent.click(screen.getByRole('button', { name: '포켓몬 더 보기' }))
    expect(screen.getByRole('checkbox', { name: '#0049 포켓몬49 포획 완료' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('체크리스트 검색'), { target: { value: '49' } })
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
  })

  it('D-A: 최초 읽기 차단 시 포획 상태를 미포획이나 0건으로 확정하지 않는다', async () => {
    localStorage.setItem(COLLECTION_STORAGE_KEY, '{"version":1,"ids":[25,6]}')
    coldCollectionStore()
    const blocked = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('blocked') })
    renderPage()
    const checkbox = await screen.findByRole('checkbox', { name: '#0025 피카츄 포획 여부 확인 불가' })
    expect(checkbox).toBePartiallyChecked()
    expect(checkbox).toBeDisabled()
    const filter = screen.getByLabelText('포획 상태')
    expect(filter).toBeDisabled()
    expect(filter).toHaveValue('all')
    expect(screen.getByText('검색 결과 3마리 · 포획 상태 확인 불가')).toBeInTheDocument()
    expect(screen.queryByText('조건에 맞는 포켓몬이 없습니다.')).not.toBeInTheDocument()
    blocked.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: '포획 기록 다시 읽기' }))
    await waitFor(() => expect(filter).toBeEnabled())
    expect(checkbox).toBeChecked()
    expect(screen.getByText('2 / 3마리 · 66.7%')).toBeInTheDocument()
  })

  it.each(['broken', '{"version":2,"ids":[25,6]}'])('D-B: 전체 기록 %s의 완성률을 보류하고 초기화 확인·취소·저장을 제공한다', async (raw) => {
    localStorage.setItem(COLLECTION_STORAGE_KEY, raw)
    localStorage.setItem('pokefile:favorites', '{"version":1,"ids":[25]}')
    renderPage()
    const checkbox = await screen.findByRole('checkbox', { name: '#0025 피카츄 포획 여부 확인 불가' })
    expect(checkbox).toBeDisabled()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    fireEvent.click(checkbox)
    expect(localStorage.getItem(COLLECTION_STORAGE_KEY)).toBe(raw)
    fireEvent.click(screen.getByRole('button', { name: '기록 초기화' }))
    expect(localStorage.getItem(COLLECTION_STORAGE_KEY)).toBe(raw)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(localStorage.getItem(COLLECTION_STORAGE_KEY)).toBe(raw)
    fireEvent.click(screen.getByRole('button', { name: '기록 초기화' }))
    fireEvent.click(screen.getByRole('button', { name: '초기화하고 시작' }))
    expect(localStorage.getItem(COLLECTION_STORAGE_KEY)).toBe('{"version":1,"ids":[]}')
    expect(localStorage.getItem('pokefile:favorites')).toBe('{"version":1,"ids":[25]}')
    expect(screen.getByText('0 / 3마리 · 0%')).toBeInTheDocument()
    expect(checkbox).toBeEnabled()
    fireEvent.click(checkbox)
    expect(saved().ids).toEqual([25])
  })

  it('D-B: 일부 항목을 제외한 기록은 안내하고 유효한 포획 상태를 유지한다', async () => {
    localStorage.setItem(COLLECTION_STORAGE_KEY, '{"version":1,"ids":[25,25,0]}')
    renderPage()
    expect(await screen.findByRole('checkbox', { name: '#0025 피카츄 포획 완료' })).toBeChecked()
    expect(screen.getByText(/잘못되거나 중복된/)).toBeInTheDocument()
    expect(screen.getByText('1 / 3마리 · 33.3%')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '기록 초기화' })).not.toBeInTheDocument()
  })

  it('T-1: 실패 후 재시도 응답을 기다리는 동안 로딩 상태를 표시한다', async () => {
    let finish!: (value: Response) => void
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve }))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: '목록 다시 시도' }))
    expect(await screen.findByText('도감 체크리스트를 불러오는 중입니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '목록 다시 시도' })).toBeDisabled()
    expect(fetch).toHaveBeenCalledTimes(2)
    finish(response())
    expect(await screen.findByRole('checkbox', { name: '#0025 피카츄 포획 완료' })).toBeEnabled()
  })
})
