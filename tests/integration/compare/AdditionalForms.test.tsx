import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ComparePage } from '@/features/compare/pages/ComparePage'
import { additionalFixtureForUrl } from '../shared/additional-form-fixtures'

afterEach(() => vi.unstubAllGlobals())

function Location() { return <output data-testid="location">{useLocation().search}</output> }

function setup(path: string) {
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const fixture = additionalFixtureForUrl(String(input))
    return fixture === undefined ? new Response('', { status: 404 }) : Response.json(fixture)
  })
  vi.stubGlobal('fetch', fetch)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><ComparePage /><Location /></MemoryRouter></QueryClientProvider>)
  return { client, fetch }
}

describe('C-01 추가 폼 비교 (TASK-025 / TC-11)', () => {
  it('아르세우스·실버디 추가 폼의 타입·이미지와 공유 종족값을 비교하고 URL로 전환한다', async () => {
    const { client, fetch } = setup('/compare?a=493&af=fire&b=773&bf=fairy')
    const user = userEvent.setup()
    await screen.findByRole('table')
    const a = within(screen.getByRole('region', { name: '포켓몬 A' }))
    const b = within(screen.getByRole('region', { name: '포켓몬 B' }))
    expect(a.getByRole('presentation')).toHaveAttribute('src', 'arceus-fire.gif')
    expect(b.getByRole('presentation')).toHaveAttribute('src', 'silvally-fairy.gif')
    expect(a.getByText('불꽃')).toBeInTheDocument()
    expect(b.getByText('페어리')).toBeInTheDocument()
    expect(screen.getByRole('table')).toHaveTextContent('720')
    expect(screen.getByRole('table')).toHaveTextContent('570')
    await user.selectOptions(a.getByRole('combobox', { name: /폼/ }), 'water')
    expect(screen.getByTestId('location')).toHaveTextContent('af=water')
    expect(await a.findByRole('presentation')).toHaveAttribute('src', 'arceus-water.gif')
    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/pokemon/493'))).toHaveLength(1)
    expect(fetch.mock.calls.some(([url]) => String(url).includes('/pokemon/arceus-fire'))).toBe(false)
    client.clear()
  })

  it('걸작 폼 이미지가 PNG여도 기본 종족값으로 비교한다', async () => {
    const { client } = setup('/compare?a=1013&af=masterpiece&b=493')
    await screen.findByRole('table')
    const a = within(screen.getByRole('region', { name: '포켓몬 A' }))
    expect(a.getByRole('presentation')).toHaveAttribute('src', 'sinistcha-masterpiece.png')
    expect(screen.getByRole('table')).toHaveTextContent('508')
    expect(a.getByRole('combobox', { name: /폼/ })).toHaveValue('masterpiece')
    client.clear()
  })
})
