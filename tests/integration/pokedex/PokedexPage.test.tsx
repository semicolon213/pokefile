import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PokedexPage } from '@/features/pokedex/pages/PokedexPage'
import type { PokemonSummary } from '@/shared/models'

const POKEMON: PokemonSummary[] = [
  { id: 1, nameEn: 'Bulbasaur', nameKo: '이상해씨', types: ['grass', 'poison'], generation: 'generation-i', megaForms: [] },
  { id: 6, nameEn: 'Charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', megaForms: ['mega-x', 'mega-y'] },
  { id: 25, nameEn: 'Pikachu', nameKo: '피카츄', types: ['electric'], generation: 'generation-i', megaForms: [] },
]

function indexResponse() {
  return new Response(JSON.stringify({ version: 1, generatedAt: '2026-10-28', count: POKEMON.length, pokemon: POKEMON }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PokedexPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const cardNames = () => screen.getAllByRole('article').map((card) => within(card).getByRole('link').textContent)

describe('PokedexPage 검색 (TASK-003)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('인덱스를 불러오는 동안 로딩 안내를 보여준 뒤 전체 목록을 표시한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => indexResponse()))
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: '포켓몬 도감' })).toBeInTheDocument()
    expect(screen.getByText('포켓몬을 불러오는 중입니다.')).toBeInTheDocument()
    expect(await screen.findByText('전체 3마리')).toBeInTheDocument()
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
    await screen.findByText('전체 3마리')
    await user.type(screen.getByRole('searchbox', { name: '포켓몬 검색' }), query)
    await user.click(screen.getByRole('button', { name: '검색' }))
    expect(screen.getByText('검색 결과 1마리')).toBeInTheDocument()
    expect(cardNames()[0]).toContain(expected)
  })

  it('입력만 하고 제출하지 않으면 조회하지 않는다 (ADR-011)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => indexResponse()))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('전체 3마리')
    await user.type(screen.getByRole('searchbox', { name: '포켓몬 검색' }), '피카츄')
    expect(screen.getAllByRole('article')).toHaveLength(3)
  })

  it('결과가 없으면 안내하고 초기화로 전체 목록을 되돌린다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => indexResponse()))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('전체 3마리')
    await user.type(screen.getByRole('searchbox', { name: '포켓몬 검색' }), '없는포켓몬{Enter}')
    expect(screen.getByText('검색 결과가 없습니다. 검색어나 필터를 확인해 주세요.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '초기화' }))
    expect(screen.getByText('전체 3마리')).toBeInTheDocument()
  })

  it('인덱스 요청 실패 시 오류와 다시 시도를 제공한다', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('포켓몬 정보를 불러오지 못했습니다.')
    fetchMock.mockImplementation(async () => indexResponse())
    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByText('전체 3마리')).toBeInTheDocument()
  })
})
