import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { RootLayout } from '@/app/layout/RootLayout'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PokedexPage } from '@/features/pokedex/pages/PokedexPage'
import type { PokemonSummary } from '@/shared/models'

const POKEMON: PokemonSummary[] = [
  { id: 1, nameEn: 'Bulbasaur', nameKo: '이상해씨', types: ['grass', 'poison'], generation: 'generation-i', forms: [] },
  { id: 6, nameEn: 'Charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', forms: [{ key: 'mega-x', nameKo: '메가리자몽X', nameEn: 'Mega Charizard X', category: 'mega', types: ['fire', 'dragon'], battleOnly: true }, { key: 'mega-y', nameKo: '메가리자몽Y', nameEn: 'Mega Charizard Y', category: 'mega', types: ['fire', 'flying'], battleOnly: true }] },
  { id: 25, nameEn: 'Pikachu', nameKo: '피카츄', types: ['electric'], generation: 'generation-i', forms: [] },
]

function indexResponse() {
  return new Response(JSON.stringify({ version: 2, generatedAt: '2026-10-28', count: POKEMON.length, pokemon: POKEMON }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        {/* 검색창은 상단 바(RootLayout)에 있다 */}
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<PokedexPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const cardNames = () => screen.getAllByRole('article').map((card) => within(card).getByRole('link').textContent)

// 결과 수 문구는 숫자를 <b>로 강조해 여러 노드로 나뉜다. 결과 수 영역의 전체 문구로 비교한다.
const countMatcher = (text: string) => (_: string, el: Element | null) =>
  !!el?.classList.contains('pokedex-count') && el.textContent === text
const findCount = (text: string) => screen.findByText(countMatcher(text))
const getCount = (text: string) => screen.getByText(countMatcher(text))

describe('PokedexPage 검색 (TASK-003)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('인덱스를 불러오는 동안 로딩 안내를 보여준 뒤 전체 목록을 표시한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => indexResponse()))
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: '포켓몬 도감' })).toBeInTheDocument()
    expect(screen.getByText('포켓몬을 불러오는 중입니다.')).toBeInTheDocument()
    expect(await findCount('3마리의 포켓몬')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('카드에 번호·한국어 이름·한국어 타입을 표시하고 상세로 연결한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => indexResponse()))
    renderPage()
    const link = await screen.findByRole('link', { name: /리자몽/ })
    expect(link).toHaveAttribute('href', '/pokemon/6')
    expect(within(link).getByText('#0006')).toBeInTheDocument()
    expect(within(link).getByText('불꽃')).toBeInTheDocument()
    expect(within(link).getByText('비행')).toBeInTheDocument()
  })

  it.each([
    ['피카츄', '피카츄'],
    ['pikachu', '피카츄'],
    ['25', '피카츄'],
    ['#0006', '리자몽'],
  ])('"%s" 검색 → %s', async (query, expected) => {
    vi.stubGlobal('fetch', vi.fn(async () => indexResponse()))
    const user = userEvent.setup()
    renderPage()
    await findCount('3마리의 포켓몬')
    await user.type(screen.getByRole('searchbox', { name: '포켓몬 검색' }), query)
    await user.click(screen.getByRole('button', { name: '검색' }))
    expect(getCount('검색 결과 1마리')).toBeInTheDocument()
    expect(cardNames()[0]).toContain(expected)
  })

  it('한 글자 입력할 때마다 결과를 바로 갱신하고 입력창 포커스를 유지한다 (ADR-011 개정)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => indexResponse()))
    const user = userEvent.setup()
    renderPage()
    await findCount('3마리의 포켓몬')
    const input = screen.getByRole('searchbox', { name: '포켓몬 검색' })
    await user.type(input, '리')
    expect(getCount('검색 결과 1마리')).toBeInTheDocument()
    expect(cardNames()[0]).toContain('리자몽')
    await user.type(input, '자몽')
    expect(input).toHaveFocus()
    expect(input).toHaveValue('리자몽')
    await user.clear(input)
    expect(getCount('3마리의 포켓몬')).toBeInTheDocument()
  })

  it('결과가 없으면 안내하고 초기화로 전체 목록을 되돌린다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => indexResponse()))
    const user = userEvent.setup()
    renderPage()
    await findCount('3마리의 포켓몬')
    await user.type(screen.getByRole('searchbox', { name: '포켓몬 검색' }), '없는포켓몬{Enter}')
    expect(screen.getByText('검색 결과가 없습니다. 검색어나 필터를 확인해 주세요.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '초기화' }))
    expect(getCount('3마리의 포켓몬')).toBeInTheDocument()
  })

  it('목록 스프라이트는 키우지 않고, 상자보다 큰 GIF도 PNG로 바꾸지 않고 줄여서 움직임을 유지한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => indexResponse()))
    renderPage()
    await findCount('3마리의 포켓몬')
    const imageOf = (name: RegExp) => screen.getByRole('link', { name }).querySelector('img')!
    const load = (img: HTMLImageElement, size: number) => {
      Object.defineProperty(img, 'naturalWidth', { value: size, configurable: true })
      Object.defineProperty(img, 'naturalHeight', { value: size, configurable: true })
      fireEvent.load(img)
    }
    const charizard = imageOf(/리자몽/)
    load(charizard, 140)
    expect(charizard.getAttribute('src')).toMatch(/showdown\/6\.gif$/)
    expect(charizard).toHaveAttribute('data-downscaled', 'true')
    const pikachu = imageOf(/피카츄/)
    load(pikachu, 46)
    expect(pikachu.style.width).toBe('')
    expect(pikachu).toHaveAttribute('data-downscaled', 'false')
  })

  it('인덱스 요청 실패 시 오류와 다시 시도를 제공한다', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('포켓몬 정보를 불러오지 못했습니다.')
    fetchMock.mockImplementation(async () => indexResponse())
    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await findCount('3마리의 포켓몬')).toBeInTheDocument()
  })
})
