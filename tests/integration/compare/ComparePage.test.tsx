import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ComparePage } from '@/features/compare/pages/ComparePage'
import type { PokemonSummary } from '@/shared/models'

const INDEX: PokemonSummary[] = [
  {
    id: 6,
    nameEn: 'Charizard',
    nameKo: '리자몽',
    types: ['fire', 'flying'],
    generation: 'generation-i',
    forms: [{ key: 'mega-x', nameKo: '메가리자몽X', nameEn: 'Mega Charizard X', category: 'mega', types: ['fire', 'dragon'], battleOnly: true }],
  },
  { id: 9, nameEn: 'Blastoise', nameKo: '거북왕', types: ['water'], generation: 'generation-i', forms: [] },
]

const STAT_NAMES = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const pokemon = (species: string, stats: number[], types: string[]) => ({
  species: { name: species },
  types: types.map((name, i) => ({ slot: i + 1, type: { name } })),
  stats: STAT_NAMES.map((name, i) => ({ base_stat: stats[i], stat: { name } })),
  sprites: { front_default: `${species}.png`, other: { showdown: { front_default: null } } },
})

const RESPONSES: Record<string, unknown> = {
  '/data/pokedex-index.json': { version: 2, generatedAt: '', count: 2, pokemon: INDEX },
  '/pokemon/6': pokemon('charizard', [78, 84, 78, 109, 85, 100], ['fire', 'flying']),
  '/pokemon/charizard-mega-x': pokemon('charizard', [78, 130, 111, 130, 85, 100], ['fire', 'dragon']),
  '/pokemon/9': pokemon('blastoise', [79, 83, 100, 85, 105, 78], ['water']),
}

function mockFetch() {
  const fn = vi.fn(async (url: string) => {
    const key = Object.keys(RESPONSES).find((k) => url.endsWith(k))
    return key ? Response.json(RESPONSES[key]) : new Response('', { status: 404 })
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

function LocationProbe() {
  return <output data-testid="location">{useLocation().search}</output>
}

const renderAt = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )

const statRow = (label: string) => screen.getByRole('rowheader', { name: label }).closest('tr')!

describe('포켓몬 비교 화면 (FR-25, TASK-022)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('검색으로 두 포켓몬을 고르면 종족값을 나란히 비교하고 URL에 남긴다', async () => {
    mockFetch()
    const user = userEvent.setup()
    renderAt('/compare')
    const pickerA = await screen.findByRole('region', { name: '포켓몬 A' })
    await user.type(within(pickerA).getByRole('combobox'), '리자')
    await user.click(within(pickerA).getByRole('option', { name: /리자몽/ }))
    const pickerB = screen.getByRole('region', { name: '포켓몬 B' })
    await user.type(within(pickerB).getByRole('combobox'), '9{Enter}')
    expect(screen.getByTestId('location')).toHaveTextContent('?a=6&b=9')

    await screen.findByRole('table')
    const atk = statRow('공격')
    expect(atk).toHaveTextContent('84')
    expect(atk).toHaveTextContent('83')
    expect(within(atk).getByText('리자몽 +1')).toBeInTheDocument()
    expect(within(statRow('합계')).getByText('534')).toBeInTheDocument()
    expect(within(statRow('합계')).getByText('530')).toBeInTheDocument()
    expect(within(statRow('합계')).getByText('리자몽 +4')).toBeInTheDocument()
  })

  it('폼을 고르면 그 폼의 종족값으로 비교하고, A·B를 바꿀 수 있다', async () => {
    mockFetch()
    const user = userEvent.setup()
    renderAt('/compare?a=6&b=9')
    const pickerA = await screen.findByRole('region', { name: '포켓몬 A' })
    await user.selectOptions(within(pickerA).getByRole('combobox', { name: '리자몽 폼' }), 'mega-x')
    expect(screen.getByTestId('location')).toHaveTextContent('?a=6&af=mega-x&b=9')
    expect(await within(statRow('공격')).findByText('메가리자몽X +47')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'A와 B 바꾸기' }))
    expect(screen.getByTestId('location')).toHaveTextContent('?a=9&b=6&bf=mega-x')
  })

  it('잘못된 폼 값은 기본 폼으로 보고 조회하지 않으며, 한 마리만 고르면 안내한다', async () => {
    const fetchMock = mockFetch()
    renderAt('/compare?a=6&af=nope')
    expect(await screen.findByText('비교할 포켓몬 두 마리를 고르세요.')).toBeInTheDocument()
    const pickerA = await screen.findByRole('region', { name: '포켓몬 A' })
    expect(within(pickerA).getByRole('combobox', { name: '리자몽 폼' })).toHaveValue('default')
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('nope'))).toBe(false)
  })
})
