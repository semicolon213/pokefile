import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pokemonDetailRoutes } from '@/features/pokemon-detail'
import type { PokemonSummary } from '@/shared/models'

// TC-04: 단위·통합 테스트는 외부 API 대신 fixture를 쓴다 (TEST_PLAN §2).
const API = 'https://pokeapi.co/api/v2'
const lang = (name: string) => ({ name, url: '' })
const res = (name: string) => ({ name, url: '' })

const INDEX: PokemonSummary[] = [
  { id: 4, nameEn: 'Charmander', nameKo: '파이리', types: ['fire'], generation: 'generation-i', megaForms: [] },
  { id: 5, nameEn: 'Charmeleon', nameKo: '리자드', types: ['fire'], generation: 'generation-i', megaForms: [] },
  { id: 6, nameEn: 'Charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', megaForms: ['mega-x', 'mega-y'] },
  { id: 128, nameEn: 'Tauros', nameKo: '켄타로스', types: ['normal'], generation: 'generation-i', megaForms: [] },
]

const stats = (values: number[]) =>
  ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((name, i) => ({
    base_stat: values[i],
    stat: res(name),
  }))

const pokemon = (id: number, name: string, types: string[], abilities: string[], statValues: number[]) => ({
  id,
  name,
  height: 17,
  weight: 905,
  types: types.map((type, i) => ({ slot: i + 1, type: res(type) })),
  abilities: abilities.map((ability, i) => ({ slot: i + 1, is_hidden: i === 1, ability: res(ability) })),
  stats: stats(statValues),
  sprites: { front_default: `${name}.png`, other: { showdown: { front_default: `${name}.gif` } } },
  forms: [res(name)],
})

const FIXTURES: Record<string, unknown> = {
  '/pokemon/6': pokemon(6, 'charizard', ['fire', 'flying'], ['blaze', 'solar-power'], [78, 84, 78, 109, 85, 100]),
  '/pokemon/charizard-mega-x': pokemon(10034, 'charizard-mega-x', ['fire', 'dragon'], ['tough-claws'], [78, 130, 111, 130, 85, 100]),
  '/pokemon-form/charizard-mega-x': { name: 'charizard-mega-x', is_mega: true, form_names: [{ name: '메가리자몽X', language: lang('ko') }] },
  '/pokemon-species/6': {
    id: 6,
    name: 'charizard',
    names: [
      { name: '리자몽', language: lang('ko') },
      { name: 'Charizard', language: lang('en') },
    ],
    genera: [{ genus: '화염포켓몬', language: lang('ko') }],
    flavor_text_entries: [{ flavor_text: '입에서 작렬하는 불꽃을\n토해낸다.', language: lang('ko'), version: res('x') }],
    evolution_chain: { url: `${API}/evolution-chain/2/` },
  },
  '/ability/blaze': { name: 'blaze', names: [{ name: '맹화', language: lang('ko') }] },
  '/ability/solar-power': { name: 'solar-power', names: [{ name: '선파워', language: lang('ko') }] },
  '/ability/tough-claws': { name: 'tough-claws', names: [{ name: '단단한발톱', language: lang('ko') }] },
}

type Override = Record<string, Response | (() => Response)>

function mockFetch(overrides: Override = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.endsWith('/data/pokedex-index.json')) {
      return Response.json({ version: 1, generatedAt: '2026-10-28', count: INDEX.length, pokemon: INDEX })
    }
    const path = url.replace(API, '')
    const override = overrides[path]
    if (override) return typeof override === 'function' ? override() : override
    if (path in FIXTURES) return Response.json(FIXTURES[path])
    return new Response('', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(pokemonDetailRoutes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

const section = (name: string) => screen.getByRole('heading', { level: 2, name }).closest('section')!

describe('PokemonDetailPage (TASK-005)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('기본 정보·분류·타입·특성·도감 설명을 표시한다 (FR-11~13)', async () => {
    mockFetch()
    renderAt('/pokemon/6')
    expect(await screen.findByRole('heading', { level: 1, name: '리자몽' })).toBeInTheDocument()
    expect(screen.getByText('#0006')).toBeInTheDocument()
    expect(screen.getByText('Charizard')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: '리자몽' })).toHaveAttribute('src', 'charizard.gif')
    expect(screen.getByText('화염포켓몬')).toBeInTheDocument()
    expect(screen.getByText('불꽃')).toBeInTheDocument()
    expect(screen.getByText('비행')).toBeInTheDocument()
    expect(await screen.findByText('맹화')).toBeInTheDocument()
    expect(await screen.findByText('선파워')).toBeInTheDocument()
    expect(screen.getByText('(숨겨진 특성)')).toBeInTheDocument()
    expect(screen.getByText('1.7 m')).toBeInTheDocument()
    expect(screen.getByText('90.5 kg')).toBeInTheDocument()
    expect(screen.getByText('입에서 작렬하는 불꽃을 토해낸다.')).toBeInTheDocument()
  })

  it('종족값을 차트와 텍스트 수치로 함께 제공한다 (FR-14)', async () => {
    mockFetch()
    renderAt('/pokemon/6')
    const table = await screen.findByRole('table', { name: '종족값 수치' })
    expect(within(table).getByRole('row', { name: '특수공격 109' })).toBeInTheDocument()
    expect(within(table).getByRole('row', { name: '합계 534' })).toBeInTheDocument()
  })

  it('메가 폼 탭으로 이미지·타입·특성·종족값을 바꾸고 URL ?form=에 반영한다 (TC-04)', async () => {
    mockFetch()
    const user = userEvent.setup()
    const router = renderAt('/pokemon/6')
    const tabs = await screen.findByRole('group', { name: '폼 선택' })
    expect(within(tabs).getAllByRole('button').map((b) => b.textContent)).toEqual(['기본', '메가X', '메가Y'])

    await user.click(within(tabs).getByRole('button', { name: '메가X' }))
    expect(router.state.location.search).toBe('?form=mega-x')
    expect(within(tabs).getByRole('button', { name: '메가X' })).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByText('드래곤')).toBeInTheDocument()
    expect(screen.queryByText('비행')).not.toBeInTheDocument()
    expect(await screen.findByText('단단한발톱')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: '메가리자몽X' })).toHaveAttribute('src', 'charizard-mega-x.gif')
    expect(screen.getByRole('row', { name: '공격 130' })).toBeInTheDocument()
    // 종 단위 정보(이름·진화·설명)는 바뀌지 않는다
    expect(screen.getByRole('heading', { level: 1, name: '리자몽' })).toBeInTheDocument()
    expect(screen.getByText('입에서 작렬하는 불꽃을 토해낸다.')).toBeInTheDocument()

    await user.click(within(tabs).getByRole('button', { name: '기본' }))
    expect(router.state.location.search).toBe('')
    expect(await screen.findByText('비행')).toBeInTheDocument()
  })

  it('URL ?form=mega-x로 바로 진입하면 메가 폼을 보여준다', async () => {
    mockFetch()
    renderAt('/pokemon/6?form=mega-x')
    expect(await screen.findByText('드래곤')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '메가X' })).toHaveAttribute('aria-pressed', 'true')
  })

  it.each(['?form=abc', '?form=mega'])('잘못된 %s 값은 기본 폼을 보여준다 (ADR-011)', async (search) => {
    const fetchMock = mockFetch()
    renderAt(`/pokemon/6${search}`)
    expect(await screen.findByText('비행')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '기본' })).toHaveAttribute('aria-pressed', 'true')
    expect(fetchMock.mock.calls.map(([url]) => String(url))).not.toContainEqual(expect.stringContaining('-mega'))
  })

  it('메가가 없는 종은 폼 탭을 표시하지 않는다', async () => {
    mockFetch({
      '/pokemon/128': Response.json(pokemon(128, 'tauros', ['normal'], ['intimidate'], [75, 100, 95, 40, 70, 110])),
      '/pokemon-species/128': Response.json({
        id: 128,
        name: 'tauros',
        names: [{ name: '켄타로스', language: lang('ko') }],
        genera: [],
        flavor_text_entries: [],
        evolution_chain: { url: `${API}/evolution-chain/58/` },
      }),
    })
    renderAt('/pokemon/128')
    expect(await screen.findByText('노말')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: '폼 선택' })).not.toBeInTheDocument()
    // 분류·도감 설명이 없으면 '정보 없음' (DR-06)
    expect(screen.getByText('정보 없음')).toBeInTheDocument()
    expect(screen.getByText('등록된 정보가 없습니다.')).toBeInTheDocument()
  })

  it('특성 이름 요청이 실패해도 나머지 상세는 유지하고 API 식별자를 표시한다 (NFR-07)', async () => {
    mockFetch({ '/ability/blaze': () => new Response('', { status: 500 }) })
    renderAt('/pokemon/6')
    expect(await screen.findByText('선파워')).toBeInTheDocument()
    expect(screen.getByText('blaze')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: '종족값 수치' })).toBeInTheDocument()
  })

  it('기본 데이터가 모두 실패하면 상세 오류 화면과 재시도·목록 이동을 제공한다', async () => {
    mockFetch({
      '/pokemon/6': () => new Response('', { status: 500 }),
      '/pokemon-species/6': () => new Response('', { status: 500 }),
    })
    renderAt('/pokemon/6')
    expect(await screen.findByText('포켓몬 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '도감 목록으로' })).toHaveAttribute('href', '/')
  })

  it.each(['0', '722', 'abc'])('지원 범위 밖 번호(%s)는 오류를 안내한다', async (id) => {
    const fetchMock = mockFetch()
    renderAt(`/pokemon/${id}`)
    expect(await screen.findByRole('alert')).toHaveTextContent('올바르지 않은 포켓몬 번호입니다.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('이미지 로딩에 실패하면 PNG → 대체 아이콘 순서로 바꾼다 (ADR-013)', async () => {
    mockFetch()
    renderAt('/pokemon/6')
    await screen.findByRole('table', { name: '종족값 수치' })
    const basic = section('기본 정보')
    within(basic).getByRole('img', { name: '리자몽' }).dispatchEvent(new Event('error'))
    expect(await within(basic).findByRole('img', { name: '리자몽' })).toHaveAttribute('src', 'charizard.png')
    within(basic).getByRole('img', { name: '리자몽' }).dispatchEvent(new Event('error'))
    expect(await within(basic).findByRole('img', { name: '리자몽 이미지 없음' })).toBeInTheDocument()
  })
})
