import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pokemonDetailRoutes } from '@/features/pokemon-detail'
import type { PokemonSummary } from '@/shared/models'

// TC-04·05: 단위·통합 테스트는 외부 API 대신 fixture를 쓴다 (TEST_PLAN §2).
const API = 'https://pokeapi.co/api/v2'
const lang = (name: string) => ({ name, url: '' })
const res = (name: string) => ({ name, url: '' })

const INDEX: PokemonSummary[] = [
  { id: 4, nameEn: 'Charmander', nameKo: '파이리', types: ['fire'], generation: 'generation-i', forms: [] },
  { id: 5, nameEn: 'Charmeleon', nameKo: '리자드', types: ['fire'], generation: 'generation-i', forms: [] },
  { id: 6, nameEn: 'Charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', forms: [{ key: 'mega-x', nameKo: '메가리자몽X', nameEn: 'Mega Charizard X', category: 'mega', types: ['fire', 'dragon'], battleOnly: true }, { key: 'mega-y', nameKo: '메가리자몽Y', nameEn: 'Mega Charizard Y', category: 'mega', types: ['fire', 'flying'], battleOnly: true }] },
  { id: 128, nameEn: 'Tauros', nameKo: '켄타로스', types: ['normal'], generation: 'generation-i', forms: [] },
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
  '/evolution-chain/2': {
    id: 2,
    chain: {
      species: { name: 'charmander', url: `${API}/pokemon-species/4/` },
      evolution_details: [],
      evolves_to: [
        {
          species: { name: 'charmeleon', url: `${API}/pokemon-species/5/` },
          evolution_details: [{ min_level: 16, trigger: res('level-up') }],
          evolves_to: [
            {
              species: { name: 'charizard', url: `${API}/pokemon-species/6/` },
              evolution_details: [{ min_level: 36, trigger: res('level-up') }],
              evolves_to: [],
            },
          ],
        },
      ],
    },
  },
  '/pokemon/6/encounters': [],
}

type Override = Record<string, Response | (() => Response)>

function mockFetch(overrides: Override = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.endsWith('/data/pokedex-index.json')) {
      return Response.json({ version: 2, generatedAt: '2026-10-28', count: INDEX.length, pokemon: INDEX })
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

describe('PokemonDetailPage (TASK-005·006)', () => {
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
      '/evolution-chain/58': Response.json({
        id: 58,
        chain: { species: { name: 'tauros', url: `${API}/pokemon-species/128/` }, evolution_details: [], evolves_to: [] },
      }),
      '/pokemon/128/encounters': Response.json([]),
    })
    renderAt('/pokemon/128')
    expect(await screen.findByText('노말')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: '폼 선택' })).not.toBeInTheDocument()
    // 분류·도감 설명이 없으면 '정보 없음' (DR-06)
    expect(screen.getByText('정보 없음')).toBeInTheDocument()
    expect(screen.getByText('등록된 정보가 없습니다.')).toBeInTheDocument()
    expect(await within(section('진화')).findByText('진화하지 않는 포켓몬입니다.')).toBeInTheDocument()
  })

  it('진화 단계를 한국어 이름·레벨 조건과 함께 표시하고 현재 포켓몬을 표시한다 (FR-15)', async () => {
    mockFetch()
    renderAt('/pokemon/6')
    const evolution = section('진화')
    const link = await within(evolution).findByRole('link', { name: /파이리/ })
    expect(link).toHaveAttribute('href', '/pokemon/4')
    expect(within(evolution).getByRole('link', { name: /리자드/ })).toHaveAttribute('href', '/pokemon/5')
    expect(within(evolution).getByRole('link', { name: /리자몽/ })).toHaveAttribute('aria-current', 'page')
    expect(within(evolution).getByText('Lv.16')).toBeInTheDocument()
    expect(within(evolution).getByText('Lv.36')).toBeInTheDocument()
  })

  it('출현 장소를 게임별로 표시한다 (FR-16)', async () => {
    mockFetch({
      '/pokemon/6/encounters': Response.json([
        {
          location_area: { name: 'kalos-route-1-area', url: '' },
          version_details: [
            { version: res('x'), encounter_details: [{ min_level: 10, max_level: 12, method: res('walk') }] },
            { version: res('red-japan'), encounter_details: [{ min_level: 10, max_level: 12, method: res('walk') }] },
          ],
        },
      ]),
    })
    renderAt('/pokemon/6')
    const encounters = section('출현 정보')
    const x = await within(encounters).findByRole('region', { name: 'X 출현 장소' })
    expect(within(x).getByText('6세대')).toBeInTheDocument()
    expect(within(x).getByText('Kalos Route 1')).toBeInTheDocument()
    expect(within(x).getByText('Lv.10~12')).toBeInTheDocument()
    expect(within(encounters).queryAllByRole('region', { name: /출현 장소/ })).toHaveLength(1)
    expect(within(encounters).queryByRole('region', { name: /japan/i })).not.toBeInTheDocument()
  })

  it('출현 데이터 없음과 요청 실패를 구분해 안내한다 (FR-18)', async () => {
    mockFetch()
    renderAt('/pokemon/6')
    expect(await within(section('출현 정보')).findByText('6세대 이하 게임에서 야생 출현 정보가 없습니다.')).toBeInTheDocument()
  })

  it('특성 이름 요청이 실패해도 나머지 상세는 유지하고 API 식별자를 표시한다 (NFR-07)', async () => {
    mockFetch({ '/ability/blaze': () => new Response('', { status: 500 }) })
    renderAt('/pokemon/6')
    expect(await screen.findByText('선파워')).toBeInTheDocument()
    expect(screen.getByText('blaze')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: '종족값 수치' })).toBeInTheDocument()
  })

  it('부가 정보 요청이 실패해도 나머지 상세는 유지하고 해당 섹션만 재시도한다 (NFR-07)', async () => {
    let encounterFails = true
    mockFetch({
      '/pokemon/6/encounters': () => (encounterFails ? new Response('', { status: 500 }) : Response.json([])),
      '/evolution-chain/2': () => new Response('', { status: 503 }),
    })
    const user = userEvent.setup()
    renderAt('/pokemon/6')
    const encounters = section('출현 정보')
    expect(await within(encounters).findByRole('alert')).toHaveTextContent('출현 정보를 불러오지 못했습니다.')
    expect(await within(section('진화')).findByRole('alert')).toHaveTextContent('진화 정보를 불러오지 못했습니다.')
    expect(screen.getByRole('heading', { level: 1, name: '리자몽' })).toBeInTheDocument()
    expect(await screen.findByRole('table', { name: '종족값 수치' })).toBeInTheDocument()

    encounterFails = false
    await user.click(within(encounters).getByRole('button', { name: '다시 시도' }))
    expect(await within(encounters).findByText('6세대 이하 게임에서 야생 출현 정보가 없습니다.')).toBeInTheDocument()
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

  it.each(['0', '1026', 'abc'])('지원 범위 밖 번호(%s)는 오류를 안내한다', async (id) => {
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
