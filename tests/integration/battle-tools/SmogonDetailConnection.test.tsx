import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pokemonDetailRoutes } from '@/features/pokemon-detail'
import { fixtureForUrl } from './fixtures'

afterEach(() => vi.unstubAllGlobals())

describe('상세 화면과 실전 세팅 연결 (TC-06)', () => {
  it('실제 상세 폼 탭으로 메가X/Y 세팅을 전환하고 gen6 캐시를 공유한다', async () => {
    const fetch = vi.fn(async (url: RequestInfo | URL) => {
      const fixture = fixtureForUrl(String(url))
      return fixture === undefined ? new Response('', { status: 404 }) : Response.json(fixture)
    })
    vi.stubGlobal('fetch', fetch)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } })
    const router = createMemoryRouter(pokemonDetailRoutes, { initialEntries: ['/pokemon/6'] })
    render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>)
    const section = await screen.findByRole('region', { name: '실전 추천 세팅' })
    fireEvent.change(await within(section).findByRole('combobox'), { target: { value: 'ou' } })
    expect(within(section).getByText('Base attacker')).toBeInTheDocument()
    const tabs = await screen.findByRole('group', { name: '폼 선택' })
    fireEvent.click(within(tabs).getByRole('button', { name: '메가X' }))
    expect(router.state.location.search).toBe('?form=mega-x')
    expect(within(section).queryByText('Base attacker')).not.toBeInTheDocument()
    fireEvent.change(await within(section).findByRole('combobox'), { target: { value: 'ou' } })
    expect(within(section).getByText('Mega X attacker')).toBeInTheDocument()
    fireEvent.click(within(tabs).getByRole('button', { name: '메가Y' }))
    fireEvent.change(await within(section).findByRole('combobox'), { target: { value: 'ou' } })
    expect(within(section).getByText('Mega Y attacker')).toBeInTheDocument()
    expect(within(section).queryByText('Mega X attacker')).not.toBeInTheDocument()
    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/sets/gen6.json'))).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: '리자몽' })).toBeInTheDocument()
    client.clear()
  })
})
