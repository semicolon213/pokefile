import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pokemonDetailRoutes } from '@/features/pokemon-detail'
import { MovesSection } from '@/features/pokemon-detail/components/MovesSection'
import { pokemonDetailQueryKeys } from '@/features/pokemon-detail/api/queryKeys'
import { ADDITIONAL_INDEX, additionalFixtureForUrl } from '../shared/additional-form-fixtures'

afterEach(() => vi.unstubAllGlobals())

function setup(id: number, form: string, movesOnly = false) {
  let failForm = false
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (failForm && url.includes('/pokemon-form/')) return new Response('', { status: 503 })
    const fixture = additionalFixtureForUrl(url)
    return fixture === undefined ? new Response('', { status: 404 }) : Response.json(fixture)
  })
  vi.stubGlobal('fetch', fetch)
  // 앱의 기본 5분 캐시를 사용하되, 아래 무효화 검사는 강제로 재조회한다.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 5 * 60 * 1000 } } })
  const router = createMemoryRouter(pokemonDetailRoutes, { initialEntries: [`/pokemon/${id}?form=${form}`] })
  const summary = ADDITIONAL_INDEX.find(p => p.id === id)!
  render(<QueryClientProvider client={client}>{movesOnly
    ? <MemoryRouter><MovesSection pokemonId={id} formKey={form} speciesName={summary.nameEn.toLowerCase()}
      formResource={summary.forms.find(f => f.key === form)?.resource} /></MemoryRouter>
    : <RouterProvider router={router} />}</QueryClientProvider>)
  return { client, fetch, router, fail: (value: boolean) => { failForm = value } }
}

const moves = () => within(screen.getByRole('region', { name: /^기술$/ }))
const showProtect = async () => {
  const button = await moves().findByRole('button', { name: /기술머신/ })
  await userEvent.click(button)
  return moves().findByRole('rowheader', { name: '방어' })
}

describe('PR #48 + C-01 추가 폼 조회 계약 (TC-04·09·12)', () => {
  it.each([[493, 'fire', '불꽃'], [773, 'fairy', '페어리'], [1013, 'masterpiece', '풀']] as const)(
    '#%i/%s 기본 정보와 기술 표가 재조회 뒤에도 같은 폼을 유지한다', async (id, form, type) => {
      const { client, fetch } = setup(id, form)
      await showProtect()
      await act(async () => { await client.invalidateQueries({ queryKey: pokemonDetailQueryKeys.pokemon(id, form) }) })
      const basic = within(screen.getByRole('region', { name: '기본 정보' }))
      expect(basic.getByText(type)).toBeInTheDocument()
      expect(await moves().findByRole('rowheader', { name: '방어' })).toBeInTheDocument()
      expect(fetch.mock.calls.some(([url]) => String(url).includes(`/pokemon/${id === 493 ? 'arceus' : id === 773 ? 'silvally' : 'sinistcha'}-${form}`))).toBe(false)
      expect(fetch.mock.calls.filter(([url]) => String(url).endsWith(`/pokemon/${id}`))).toHaveLength(1)
      client.clear()
    })

  it('기술 표가 단독으로 먼저 조회해도 pokemon-form 리소스를 해석한다', async () => {
    const { client, fetch } = setup(493, 'fire', true)
    await showProtect()
    expect(fetch.mock.calls.some(([url]) => String(url).includes('/pokemon/arceus-fire'))).toBe(false)
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith('/pokemon-form/arceus-fire'))).toBe(true)
    client.clear()
  })

  it('재조회 실패·재시도와 기본 폼 복귀에서도 타입·기술·기본 캐시를 보존한다', async () => {
    const { client, fetch, fail, router } = setup(493, 'fire')
    await showProtect()
    fail(true)
    await act(async () => { await client.invalidateQueries({ queryKey: pokemonDetailQueryKeys.pokemon(493, 'fire') }) })
    await screen.findByText('기본 정보를 불러오지 못했습니다.')
    await screen.findByText('기술 정보를 불러오지 못했습니다.')
    fail(false)
    await act(async () => { await client.refetchQueries({ queryKey: pokemonDetailQueryKeys.pokemon(493, 'fire') }) })
    await waitFor(() => expect(screen.queryByText('기술 정보를 불러오지 못했습니다.')).not.toBeInTheDocument())
    expect(within(screen.getByRole('region', { name: '기본 정보' })).getByText('불꽃')).toBeInTheDocument()
    await act(async () => { await router.navigate('/pokemon/493') })
    expect(await within(screen.getByRole('region', { name: '기본 정보' })).findByText('노말')).toBeInTheDocument()
    await showProtect()
    expect(fetch.mock.calls.some(([url]) => String(url).includes('/pokemon/arceus-fire'))).toBe(false)
    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/pokemon/493'))).toHaveLength(1)
    client.clear()
  })
})
