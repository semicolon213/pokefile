import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { RootLayout } from '@/app/layout/RootLayout'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PokedexPage } from '@/features/pokedex/pages/PokedexPage'
import type { PokemonSummary } from '@/shared/models'

const BASE: PokemonSummary[] = [
  { id: 4, nameEn: 'Charmander', nameKo: '파이리', types: ['fire'], generation: 'generation-i', forms: [] },
  { id: 6, nameEn: 'Charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', forms: [{ key: 'mega-x', nameKo: '메가리자몽X', nameEn: 'Mega Charizard X', category: 'mega', types: ['fire', 'dragon'], battleOnly: true }, { key: 'mega-y', nameKo: '메가리자몽Y', nameEn: 'Mega Charizard Y', category: 'mega', types: ['fire', 'flying'], battleOnly: true }] },
  { id: 25, nameEn: 'Pikachu', nameKo: '피카츄', types: ['electric'], generation: 'generation-i', forms: [] },
  { id: 155, nameEn: 'Cyndaquil', nameKo: '브케인', types: ['fire'], generation: 'generation-ii', forms: [] },
  { id: 700, nameEn: 'Sylveon', nameKo: '님피아', types: ['fairy'], generation: 'generation-vi', forms: [] },
]

function stubIndex(pokemon: PokemonSummary[], regionalDexes?: Record<string, { start: number; ids: number[] }>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ version: 2, generatedAt: '2026-10-28', count: pokemon.length, pokemon, regionalDexes }))),
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
        {/* 검색창은 상단 바(RootLayout)에 있다 */}
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<PokedexPage />} />
          </Route>
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const names = () => screen.getAllByRole('article').map((a) => within(a).getByRole('link').querySelector('.pokemon-card__name')?.textContent)
const search = () => decodeURIComponent(screen.getByTestId('location').textContent ?? '')

// 결과 수 문구는 숫자를 <b>로 강조해 여러 노드로 나뉜다. 결과 수 영역의 전체 문구로 비교한다.
const countMatcher = (text: string) => (_: string, el: Element | null) =>
  !!el?.classList.contains('pokedex-count') && el.textContent === text
const findCount = (text: string) => screen.findByText(countMatcher(text))
const getCount = (text: string) => screen.getByText(countMatcher(text))

describe('PokedexPage 필터·정렬·URL 동기화 (TASK-004)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('URL 쿼리로 필터·정렬 상태를 복원한다', async () => {
    stubIndex(BASE)
    renderAt('/?type=fire&gen=1&sort=name')
    expect(await findCount('검색 결과 2마리')).toBeInTheDocument()
    expect(names()).toEqual(['리자몽', '파이리'])
    expect(screen.getByRole('button', { name: '불꽃' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /1세대/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('combobox', { name: '정렬' })).toHaveValue('name')
  })

  it('세대 메뉴에 전체·세대별 수를 표시하고 선택하면 URL에 반영한다', async () => {
    stubIndex(BASE)
    const user = userEvent.setup()
    renderAt()
    await findCount('5마리의 포켓몬')
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
    await findCount('5마리의 포켓몬')
    await user.click(screen.getByRole('button', { name: '비행' }))
    expect(search()).toBe('?type=flying')
    expect(names()).toEqual(['리자몽'])
    await user.click(screen.getByRole('button', { name: '비행' }))
    expect(search()).toBe('')
    expect(getCount('5마리의 포켓몬')).toBeInTheDocument()
  })

  it('타입을 2개 고르면 그 조합을 모두 가진 포켓몬만 보이고, 나머지 칩은 비활성화된다', async () => {
    stubIndex(BASE)
    const user = userEvent.setup()
    renderAt()
    await findCount('5마리의 포켓몬')
    await user.click(screen.getByRole('button', { name: '비행' }))
    await user.click(screen.getByRole('button', { name: '불꽃' }))
    expect(search()).toBe('?type=fire&type=flying')
    expect(names()).toEqual(['리자몽'])
    expect(screen.getByRole('button', { name: '불꽃' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '비행' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '물' })).toBeDisabled()
    expect(screen.getByText(/최대 2개/)).toBeInTheDocument()

    // 하나를 해제하면 다시 고를 수 있다
    await user.click(screen.getByRole('button', { name: '비행' }))
    expect(search()).toBe('?type=fire')
    expect(screen.getByRole('button', { name: '물' })).toBeEnabled()
  })

  it('전체 타입을 누르면 고른 타입을 모두 해제한다', async () => {
    stubIndex(BASE)
    const user = userEvent.setup()
    renderAt('/?type=fire&type=flying')
    await findCount('검색 결과 1마리')
    await user.click(screen.getByRole('button', { name: '전체 타입' }))
    expect(search()).toBe('')
    expect(getCount('5마리의 포켓몬')).toBeInTheDocument()
  })

  it('검색어는 제출할 때 URL에 반영되고 다른 필터와 AND로 조합된다', async () => {
    stubIndex(BASE)
    const user = userEvent.setup()
    renderAt('/?type=fire')
    await findCount('검색 결과 3마리')
    await user.type(screen.getByRole('searchbox', { name: '포켓몬 검색' }), '리{Enter}')
    expect(search()).toBe('?q=리&type=fire')
    expect(names()).toEqual(['파이리', '리자몽'])
  })

  it('정렬을 이름순으로 바꾼다', async () => {
    stubIndex(BASE)
    const user = userEvent.setup()
    renderAt()
    await findCount('5마리의 포켓몬')
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
    expect(getCount('5마리의 포켓몬')).toBeInTheDocument()
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
    forms: [],
  }))

  it('처음 24마리를 보여주고 목록 끝에 닿을 때마다 24마리씩 추가한다', async () => {
    stubIndex(many)
    stubIntersectionObserver()
    renderAt()
    await findCount('50마리의 포켓몬')
    expect(screen.getAllByRole('article')).toHaveLength(24)
    expect(screen.queryByRole('button', { name: /더 보기/ })).not.toBeInTheDocument()

    act(() => trigger?.())
    expect(screen.getAllByRole('article')).toHaveLength(48)
    act(() => trigger?.())
    expect(screen.getAllByRole('article')).toHaveLength(50)
    expect(screen.queryByText('포켓몬을 더 불러오는 중입니다.')).not.toBeInTheDocument()
  })

  it('상세에 갔다 돌아오면 펼쳐 두었던 카드 수만큼 다시 그린다 (스크롤 위치 복원용)', async () => {
    stubIndex(many)
    stubIntersectionObserver()
    const first = renderAt('/?sort=name')
    await findCount('검색 결과 50마리')
    act(() => trigger?.())
    expect(screen.getAllByRole('article')).toHaveLength(48)
    first.unmount()
    // 같은 목록 주소로 다시 들어오면 48장, 다른 주소면 처음 24장
    const again = renderAt('/?sort=name')
    await findCount('검색 결과 50마리')
    expect(screen.getAllByRole('article')).toHaveLength(48)
    again.unmount()
    renderAt('/')
    await findCount('50마리의 포켓몬')
    expect(screen.getAllByRole('article')).toHaveLength(24)
  })

  it('필터가 바뀌면 처음 묶음부터 다시 보여준다', async () => {
    stubIndex(many)
    stubIntersectionObserver()
    const user = userEvent.setup()
    renderAt()
    await findCount('50마리의 포켓몬')
    act(() => trigger?.())
    expect(screen.getAllByRole('article')).toHaveLength(48)
    await user.selectOptions(screen.getByRole('combobox', { name: '정렬' }), 'name')
    expect(screen.getAllByRole('article')).toHaveLength(24)
  })
})

describe('지방 도감 (FR-31, TASK-019)', () => {
  afterEach(() => vi.unstubAllGlobals())
  // 성도 도감은 다른 세대 포켓몬(리자몽·파이리)도 포함한다
  const DEXES = {
    'updated-johto': { start: 1, ids: [155, 6, 4] },
    'original-johto': { start: 1, ids: [155, 25] },
  }

  it('지방을 고르면 그 지방 도감 전체를 지방 번호 순으로 보여 주고 카드에 지방 번호를 표시한다', async () => {
    stubIndex(BASE, DEXES)
    const user = userEvent.setup()
    renderAt()
    await findCount('5마리의 포켓몬')
    const nav = screen.getByRole('navigation', { name: '세대별 보기' })
    await user.click(within(nav).getByRole('button', { name: /2세대.*성도지방.*3/ }))
    expect(names()).toEqual(['브케인', '리자몽', '파이리'])
    expect(screen.getAllByRole('article')[1]).toHaveTextContent('성도 #002#0006')
    expect(screen.getByText(/성도지방 도감 전체 · 하트골드·소울실버 기준/)).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: '정렬' }), 'national')
    expect(search()).toBe('?gen=2&sort=national')
    expect(names()).toEqual(['파이리', '리자몽', '브케인'])
  })

  it('내 게임이 그 지방 게임이면 그 게임의 도감으로 바뀐다', async () => {
    localStorage.setItem('pokefile:my-game', 'gold')
    stubIndex(BASE, DEXES)
    renderAt('/?gen=2')
    expect(await screen.findByText(/성도지방 도감 전체 · 골드·실버·크리스탈 기준/)).toBeInTheDocument()
    expect(names()).toEqual(['브케인', '피카츄'])
  })
})
