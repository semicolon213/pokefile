import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TEAM_STORAGE_KEY } from '@/features/team/model/team'
import { TeamPage } from '@/features/team/pages/TeamPage'
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
  { id: 3, nameEn: 'Venusaur', nameKo: '이상해꽃', types: ['grass', 'poison'], generation: 'generation-i', forms: [] },
  { id: 9, nameEn: 'Blastoise', nameKo: '거북왕', types: ['water'], generation: 'generation-i', forms: [] },
]

let location = ''
function LocationProbe() {
  const current = useLocation()
  location = current.search
  return null
}

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/team"
            element={
              <>
                <TeamPage />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('파티 분석 화면 (FR-33, TASK-026)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ version: 2, generatedAt: '', count: INDEX.length, pokemon: INDEX })),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('비어 있으면 안내하고, 검색으로 추가하면 주소·저장소에 반영하고 분석을 보여 준다', async () => {
    const user = userEvent.setup()
    renderAt('/team')
    expect(await screen.findByText('포켓몬을 추가하면 파티의 약점과 공격 범위를 보여 줍니다.')).toBeInTheDocument()
    expect(screen.getAllByText('빈 자리')).toHaveLength(6)

    await user.type(screen.getByRole('combobox', { name: '파티에 추가할 포켓몬 검색' }), '이상해')
    await user.click(screen.getByRole('option', { name: /이상해꽃/ }))
    expect(location).toBe('?p=3')
    expect(localStorage.getItem(TEAM_STORAGE_KEY)).toBe('3')
    expect(screen.getByRole('combobox', { name: '파티에 추가할 포켓몬 검색' })).toHaveValue('')

    const table = screen.getByRole('table')
    const fire = within(table).getByRole('rowheader', { name: '불꽃' }).closest('tr')!
    expect(within(fire).getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '자속 공격 범위' })).toBeInTheDocument()
  })

  it('주소의 파티·폼을 읽고, 공통 약점을 주의 타입으로 보여 주며 보완 타입을 추천한다', async () => {
    renderAt('/team?p=6:mega-x&p=3')
    // 메가리자몽X(불꽃·드래곤)·이상해꽃(풀·독): 둘 다 약점이고 반감이 없는 타입 없음 → 에스퍼·땅·비행 등은 1마리
    expect(await screen.findByText('메가리자몽X', { selector: '.team-slot__name' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '리자몽 폼' })).toHaveValue('mega-x')
    expect(screen.getByRole('columnheader', { name: '메가리자몽X' })).toBeInTheDocument()
    expect(screen.getByText('눈에 띄는 공통 약점이 없습니다.')).toBeInTheDocument()
  })

  it('주의 타입이 있으면 배지와 보완 추천을 보여 준다', async () => {
    renderAt('/team?p=3&p=3')
    // 이상해꽃 2마리: 불꽃·얼음·비행·에스퍼가 2마리 약점이고 반감 없음 → 주의
    const summary = await screen.findByText('주의할 타입')
    const row = summary.closest('div')!
    for (const name of ['불꽃', '얼음', '비행', '에스퍼']) expect(within(row).getByText(name)).toBeInTheDocument()
    expect(screen.getByText('보완 추천')).toBeInTheDocument()
    expect(screen.getAllByText('주의').length).toBe(4)
  })

  it('6마리가 차면 검색을 막고, 빼기·모두 비우기가 동작한다', async () => {
    const user = userEvent.setup()
    renderAt('/team?p=9&p=9&p=9&p=9&p=9&p=6')
    const search = await screen.findByRole('combobox', { name: '파티에 추가할 포켓몬 검색' })
    expect(search).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '리자몽 빼기' }))
    expect(location).toBe('?p=9&p=9&p=9&p=9&p=9')
    expect(search).toBeEnabled()
    await user.click(screen.getByRole('button', { name: '모두 비우기' }))
    expect(location).toBe('')
    expect(localStorage.getItem(TEAM_STORAGE_KEY)).toBeNull()
  })

  it('주소에 파티가 없으면 저장된 파티를 채운다', async () => {
    localStorage.setItem(TEAM_STORAGE_KEY, '9,6:mega-x')
    renderAt('/team')
    expect(await screen.findByText('거북왕', { selector: '.team-slot__name' })).toBeInTheDocument()
    expect(location).toBe('?p=9&p=6%3Amega-x')
  })
})
