import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pokemonDetailRoutes } from '@/features/pokemon-detail'
import { additionalFixtureForUrl } from '../shared/additional-form-fixtures'

vi.mock('@/shared/config/scope', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/shared/config/scope')>()
  return { ...original, SCOPE: { ...original.SCOPE, smogon: { generation: 6, generations: [9, 7] } } }
})

afterEach(() => vi.unstubAllGlobals())

function setup(path: string, fails = false) {
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (fails && url.endsWith('/pokemon-form/arceus-fire')) return new Response('', { status: 503 })
    const fixture = additionalFixtureForUrl(url)
    return fixture === undefined ? new Response('', { status: 404 }) : Response.json(fixture)
  })
  vi.stubGlobal('fetch', fetch)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(pokemonDetailRoutes, { initialEntries: [path] })
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>)
  return { fetch, client, router }
}

const basic = () => within(screen.getByRole('heading', { level: 2, name: '기본 정보' }).closest('section')!)

describe('C-01 상세 추가 폼 (TASK-025 / TC-04·06·09·11)', () => {
  it.each([
    [493, 'fire', '불꽃', 'arceus-fire.gif', '720'],
    [773, 'fairy', '페어리', 'silvally-fairy.gif', '570'],
    [1013, 'masterpiece', '풀', 'sinistcha-masterpiece.png', '508'],
  ] as const)('#%i %s 폼의 타입·이미지·기본 종족값·세팅을 표시한다', async (id, form, type, image, total) => {
    const { client, fetch } = setup(`/pokemon/${id}?form=${form}`)
    expect(await screen.findByRole('img')).toHaveAttribute('src', image)
    expect(basic().getByText(type)).toBeInTheDocument()
    expect(await screen.findByRole('table', { name: '종족값 수치' })).toHaveTextContent(total)
    await screen.findByRole('option', { name: 'OU' })
    await userEvent.selectOptions(screen.getByRole('combobox', { name: '대전 포맷' }), 'ou')
    const resource = image.replace(/\.(gif|png)$/, '')
    expect(screen.getByRole('article', { name: `${resource} set` })).toBeInTheDocument()
    expect(fetch.mock.calls.some(([url]) => String(url).includes(`/pokemon/${resource}`))).toBe(false)
    client.clear()
  })

  it('다른 타입으로 바꿔도 기본 pokemon 요청을 공유하고 기본 폼 캐시를 덮어쓰지 않는다', async () => {
    const { client, router, fetch } = setup('/pokemon/493?form=fire')
    const user = userEvent.setup()
    await screen.findByRole('img')
    await user.selectOptions(screen.getByRole('combobox', { name: '폼 선택' }), 'water')
    expect(router.state.location.search).toBe('?form=water')
    expect(await basic().findByRole('img')).toHaveAttribute('src', 'arceus-water.gif')
    expect(basic().getByText('물')).toBeInTheDocument()
    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/pokemon/493'))).toHaveLength(1)
    await user.selectOptions(screen.getByRole('combobox', { name: '폼 선택' }), 'default')
    expect(await basic().findByRole('img')).toHaveAttribute('src', 'arceus.gif')
    expect(basic().getByText('노말')).toBeInTheDocument()
    client.clear()
  })

  it('추가 폼 요청 실패 시 기본 이미지·타입으로 바꿔 표시하지 않는다', async () => {
    const { client } = setup('/pokemon/493?form=fire', true)
    expect(await screen.findByText('기본 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '아르세우스' })).toBeInTheDocument()
    client.clear()
  })
})
