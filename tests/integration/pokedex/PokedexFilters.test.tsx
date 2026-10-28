import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PokedexPage } from '@/features/pokedex/pages/PokedexPage'
import type { PokemonSummary } from '@/shared/models'

const BASE: PokemonSummary[] = [
  { id: 4, nameEn: 'Charmander', nameKo: '파이리', types: ['fire'], generation: 'generation-i', megaForms: [] },
  { id: 6, nameEn: 'Charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', megaForms: ['mega-x', 'mega-y'] },
  { id: 25, nameEn: 'Pikachu', nameKo: '피카츄', types: ['electric'], generation: 'generation-i', megaForms: [] },
  { id: 155, nameEn: 'Cyndaquil', nameKo: '브케인', types: ['fire'], generation: 'generation-ii', megaForms: [] },
  { id: 700, nameEn: 'Sylveon', nameKo: '님피아', types: ['fairy'], generation: 'generation-vi', megaForms: [] },
]

function stubIndex(pokemon: PokemonSummary[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ version: 1, generatedAt: '2026-10-28', count: pokemon.length, pokemon }))),
  )
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.search}</output>
}

function renderAt(path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <PokedexPage />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const names = () => screen.getAllByRole('article').map((a) => within(a).getByRole('link').querySelector('.pokemon-card__name')?.textContent)
const search = () => decodeURIComponent(screen.getByTestId('location').textContent ?? '')

describe('PokedexPage 필터·정렬·URL 동기화 (TASK-004)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('URL 쿼리로 필터·정렬 상태를 복원한다', async () => {
    stubIndex(BASE)
    renderAt('/?type=fire&gen=1&sort=name')
    expect(await screen.findByText('검색 결과 2마리')).toBeInTheDocument()
    expect(names()).toEqual(['리자몽', '파이리'])
    expect(screen.getByRole('button', { name: '불꽃' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /1세대/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('combobox', { name: '정렬' })).toHaveValue('name')
  })

  it('세대 메뉴에 전체·세대별 수를 표시하고 선택하면 URL에 반영한다', async () => {
    stubIndex(BASE)
    const user = userEvent.setup()
    renderAt()
    await screen.findByText('전체 5마리')
    const nav = screen.getByRole('navigation', { name: '세대별 보기' })
    expect(within(nav).getByRole('button', { name: /전체\s*5/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(nav).getByRole('button', { name: /2세대.*성도지방.*1/ }))
    expect(search()).toBe('?gen=2')
    expect(names()).toEqual(['브케인'])
  })

  it('타입 칩을 다시 누르면 해제된다', async () => {
    stubIndex(BASE)
    const user = userEvent.setup()
    renderAt()
    await screen.findByText('전체 5마리')
    await user.click(screen.getByRole('button', { name: '비행' }))
    expect(search()).toBe('?type=flying')
    expect(names()).toEqual(['리자몽'])
    await user.click(screen.getByRole('button', { name: '비행' }))
    expect(search()).toBe('')
    expect(screen.getByText('전체 5마리')).toBeInTheDocument()
  })

  it('검색어는 제출할 때 URL에 반영되고 다른 필터와 AND로 조합된다', async () => {
    stubIndex(BASE)
    const user = userEvent.setup()
    renderAt('/?type=fire')
    await screen.findByText('검색 결과 3마리')
    await user.type(screen.getByRole('searchbox', { name: '포켓몬 검색' }), '리{Enter}')
    expect(search()).toBe('?q=리&type=fire')
    expect(names()).toEqual(['파이리', '리자몽'])
  })

  it('정렬을 이름순으로 바꾼다', async () => {
    stubIndex(BASE)
    const user = userEvent.setup()
    renderAt()
    await screen.findByText('전체 5마리')
    await user.selectOptions(screen.getByRole('combobox', { name: '정렬' }), 'name')
    expect(search()).toBe('?sort=name')
    expect(names()).toEqual(['님피아', '리자몽', '브케인', '파이리', '피카츄'])
  })

  it('결과가 없으면 검색어·필터를 한 번에 초기화한다', async () => {
    stubIndex(BASE)
    const user = userEvent.setup()
    renderAt('/?q=피카츄&type=fire')
    expect(await screen.findByText('검색 결과가 없습니다. 검색어나 필터를 확인해 주세요.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '검색어·필터 초기화' }))
    expect(search()).toBe('')
    expect(screen.getByText('전체 5마리')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: '포켓몬 검색' })).toHaveValue('')
  })
})

describe('무한 스크롤 (FR-08)', () => {
  let trigger: (() => void) | null = null

  afterEach(() => {
    vi.unstubAllGlobals()
    trigger = null
  })

  function stubIntersectionObserver() {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        private cb: IntersectionObserverCallback
        constructor(cb: IntersectionObserverCallback) {
          this.cb = cb
        }
        observe() {
          trigger = () => this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
        }
        disconnect() {}
      },
    )
  }

  const many = Array.from({ length: 50 }, (_, i): PokemonSummary => ({
    id: i + 1,
    nameEn: `Mon${i + 1}`,
    nameKo: `몬${i + 1}`,
    types: ['normal'],
    generation: 'generation-i',
    megaForms: [],
  }))

  it('처음 24마리를 보여주고 목록 끝에 닿을 때마다 24마리씩 추가한다', async () => {
    stubIndex(many)
    stubIntersectionObserver()
    renderAt()
    await screen.findByText('전체 50마리')
    expect(screen.getAllByRole('article')).toHaveLength(24)
    expect(screen.queryByRole('button', { name: /더 보기/ })).not.toBeInTheDocument()

    act(() => trigger?.())
    expect(screen.getAllByRole('article')).toHaveLength(48)
    act(() => trigger?.())
    expect(screen.getAllByRole('article')).toHaveLength(50)
    expect(screen.queryByText('포켓몬을 더 불러오는 중입니다.')).not.toBeInTheDocument()
  })

  it('필터가 바뀌면 처음 묶음부터 다시 보여준다', async () => {
    stubIndex(many)
    stubIntersectionObserver()
    const user = userEvent.setup()
    renderAt()
    await screen.findByText('전체 50마리')
    act(() => trigger?.())
    expect(screen.getAllByRole('article')).toHaveLength(48)
    await user.selectOptions(screen.getByRole('combobox', { name: '정렬' }), 'name')
    expect(screen.getAllByRole('article')).toHaveLength(24)
  })
})
