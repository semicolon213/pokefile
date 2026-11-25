import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MovesSection } from '@/features/pokemon-detail/components/MovesSection'
import type { FormKey } from '@/shared/models'

// TASK-015 / FR-27·26 / TC-12: 기술 표. 기술 목록은 fixture, 한국어 이름·번호는 실제 정적 데이터(data/moves.json)를 쓴다.
const res = (name: string) => ({ name, url: '' })
const learn = (move: string, details: [string, string, number][]) => ({
  move: res(move),
  version_group_details: details.map(([group, method, level]) => ({ version_group: res(group), move_learn_method: res(method), level_learned_at: level })),
})
const pokemon = (name: string, moves: ReturnType<typeof learn>[]) => ({
  id: 6, name, height: 17, weight: 905, types: [], abilities: [], stats: [], sprites: { front_default: null }, forms: [], moves,
})

const FIXTURES: Record<string, unknown> = {
  '/pokemon/6': pokemon('charizard', [
    learn('scratch', [['scarlet-violet', 'level-up', 1], ['red-blue', 'level-up', 1]]),
    learn('air-slash', [['scarlet-violet', 'level-up', 0]]),
    learn('flamethrower', [['scarlet-violet', 'machine', 0], ['red-blue', 'level-up', 46]]),
    learn('cut', [['red-blue', 'machine', 0]]),
    learn('blast-burn', [['sword-shield', 'tutor', 0]]),
  ]),
  '/pokemon/charizard-mega-x': pokemon('charizard-mega-x', [learn('dragon-claw', [['x-y', 'machine', 0]])]),
}

function mockFetch(overrides: Record<string, unknown> = {}, fail = false) {
  const fixtures = { ...FIXTURES, ...overrides }
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const path = new URL(String(input)).pathname.replace('/api/v2', '').replace(/\/$/, '')
    if (fail) return new Response('', { status: 500 })
    return path in fixtures ? Response.json(fixtures[path]) : new Response('', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderMoves(formKey: FormKey = 'default') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MovesSection pokemonId={6} formKey={formKey} speciesName="charizard" />
    </QueryClientProvider>,
  )
}

const section = () => screen.getByRole('region', { name: '기술' })
const rowTexts = (table: HTMLElement) =>
  within(table).getAllByRole('row').slice(1).map((row) => [...row.querySelectorAll('th, td')].map((c) => c.textContent))

describe('MovesSection (FR-27)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('가장 최신 게임의 레벨업 기술을 레벨 순으로 한국어 이름·타입·위력과 함께 보여 준다', async () => {
    mockFetch()
    renderMoves()
    const table = await screen.findByRole('table', { name: '스칼렛·바이올렛 레벨업 기술' })
    expect(within(section()).getByRole('combobox', { name: '게임' })).toHaveValue('scarlet-violet')
    expect(rowTexts(table)).toEqual([
      ['진화', '에어슬래시', '비행', '특수', '75', '95', '15'],
      ['Lv.1', '할퀴기', '노말', '물리', '40', '100', '35'],
    ])
  })

  it('배우는 방법과 게임을 바꾸면 그 표를 보여 준다 (기술머신 번호 포함)', async () => {
    mockFetch()
    const user = userEvent.setup()
    renderMoves()
    await screen.findByRole('table', { name: '스칼렛·바이올렛 레벨업 기술' })
    const methods = within(section()).getByRole('group', { name: '배우는 방법' })
    await user.click(within(methods).getByRole('button', { name: /기술머신/ }))
    expect(within(methods).getByRole('button', { name: /기술머신/ })).toHaveAttribute('aria-pressed', 'true')
    const machines = screen.getByRole('table', { name: '스칼렛·바이올렛 기술머신 기술' })
    expect(rowTexts(machines)[0]).toEqual(['기술머신 125', '화염방사', '불꽃', '특수', '90', '100', '15'])

    await user.selectOptions(within(section()).getByRole('combobox', { name: '게임' }), 'red-blue')
    expect(rowTexts(screen.getByRole('table', { name: '레드·블루 기술머신 기술' }))[0].slice(0, 2)).toEqual(['비전머신 01', '풀베기'])
    // 기술 가르침이 없는 게임은 빈 상태 안내
    await user.click(within(methods).getByRole('button', { name: /기술 가르침/ }))
    expect(within(section()).getByText('레드·블루에서 기술 가르침으로 배우는 기술이 없습니다.')).toBeInTheDocument()
  })

  it('내 게임이 있으면 그 게임으로 시작한다 (FR-26)', async () => {
    localStorage.setItem('pokefile:my-game', 'shield')
    mockFetch()
    const user = userEvent.setup()
    renderMoves()
    expect(await within(await screen.findByRole('region', { name: '기술' })).findByText('내 게임 실드 기준입니다.')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '게임' })).toHaveValue('sword-shield')
    await user.click(screen.getByRole('button', { name: /기술 가르침/ }))
    expect(rowTexts(screen.getByRole('table', { name: '소드·실드 기술 가르침 기술' }))).toEqual([
      ['블라스트번', '불꽃', '특수', '150', '90', '5'],
    ])
  })

  it('내 게임에 이 폼의 기록이 없으면 알리고 최신 게임을 보여 준다', async () => {
    localStorage.setItem('pokefile:my-game', 'x')
    mockFetch()
    renderMoves()
    expect(await screen.findByText('내 게임 X에는 이 모습의 기술 데이터가 없습니다. 다른 게임을 고를 수 있습니다.')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '게임' })).toHaveValue('scarlet-violet')
  })

  it('폼마다 그 폼의 기술 기록을 쓴다 (메가리자몽X)', async () => {
    mockFetch()
    renderMoves('mega-x')
    expect(await screen.findByRole('combobox', { name: '게임' })).toHaveValue('x-y')
    expect(within(screen.getByRole('combobox', { name: '게임' })).getAllByRole('option')).toHaveLength(1)
  })

  it('기술 기록이 없으면 빈 상태로 안내한다', async () => {
    mockFetch({ '/pokemon/6': pokemon('charizard', []) })
    renderMoves()
    expect(await screen.findByText('등록된 기술 정보가 없습니다.')).toBeInTheDocument()
  })

  it('요청이 실패하면 오류와 다시 시도를 보여 준다', async () => {
    mockFetch({}, true)
    renderMoves()
    expect(await screen.findByText('기술 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    expect(within(section()).getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})
