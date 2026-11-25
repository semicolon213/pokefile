import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pokemonDetailRoutes } from '@/features/pokemon-detail'

// CR-025는 변경하지 않고 세팅 연결만 fixture로 검증한다.
vi.mock('@/shared/config/scope', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/shared/config/scope')>()
  return { ...original, SCOPE: { ...original.SCOPE, smogon: { generation: 6, generations: [9] } } }
})

const API = 'https://pokeapi.co/api/v2'
const resource = (name: string) => ({ name, url: '' })
const pokemon = (name: string, id: number, weight: number) => ({
  id, name, height: 3, weight,
  types: [{ slot: 1, type: resource('normal') }], abilities: [],
  stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
    .map((name) => ({ base_stat: 75, stat: resource(name) })),
  sprites: { front_default: `${name}.png`, other: { showdown: { front_default: `${name}.gif` } } },
  forms: [resource(name)],
})
const fixtures: Record<string, unknown> = {
  '/pokemon/925': pokemon('maushold-family-of-four', 925, 28),
  '/pokemon/maushold-family-of-three': pokemon('maushold-family-of-three', 10257, 23),
  '/pokemon/925/encounters': [],
  '/pokemon-species/925': {
    id: 925, name: 'maushold',
    names: [{ name: '파밀리쥐', language: resource('ko') }, { name: 'Maushold', language: resource('en') }],
    genera: [], flavor_text_entries: [], evolution_chain: null,
  },
}
const summary = {
  id: 925, nameKo: '파밀리쥐', nameEn: 'Maushold', types: ['normal'], generation: 'generation-ix',
  forms: [{ key: 'family-of-three', nameKo: '세 식구', nameEn: 'Family of Three',
    category: 'other', types: ['normal'], battleOnly: false }],
}

function setup(path = '/pokemon/925') {
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.endsWith('/data/pokedex-index.json')) {
      return Response.json({ version: 2, generatedAt: '2026-11-25', count: 1, pokemon: [summary] })
    }
    if (url === 'https://data.pkmn.cc/sets/gen9.json') return Response.json({
      Maushold: { ou: { 'Three set': { moves: ['Population Bomb'] } } },
      'Maushold-Four': { ru: { 'Four set': { moves: ['Population Bomb'] } } },
    })
    const fixture = fixtures[url.replace(API, '')]
    return fixture === undefined ? new Response('', { status: 404 }) : Response.json(fixture)
  })
  vi.stubGlobal('fetch', fetch)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(pokemonDetailRoutes, { initialEntries: [path] })
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>)
  return { client, router, fetch }
}

afterEach(() => vi.unstubAllGlobals())

describe('파밀리쥐 상세·세팅 연결 (TASK-025 / D-04 / TC-04·06)', () => {
  it('세 식구부터 시작해 두 버튼의 URL·이미지·체중·실전 세팅을 정확히 전환한다', async () => {
    const { client, router, fetch } = setup()
    const user = userEvent.setup()
    const tabs = await screen.findByRole('group', { name: '폼 선택' })
    expect(within(tabs).getAllByRole('button').map((button) => button.textContent)).toEqual(['세 식구', '네 식구'])
    expect(within(tabs).getByRole('button', { name: '세 식구' })).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByRole('img', { name: '파밀리쥐 (세 식구)' })).toHaveAttribute('src', 'maushold-family-of-three.gif')
    expect(screen.getByText('2.3 kg')).toBeInTheDocument()
    expect(fetch.mock.calls.map(([url]) => String(url))).not.toContain(`${API}/pokemon/925`)
    await screen.findByRole('option', { name: 'OU' })
    await user.selectOptions(screen.getByRole('combobox', { name: '대전 포맷' }), 'ou')
    expect(screen.getByRole('article', { name: 'Three set' })).toBeInTheDocument()

    await user.click(within(tabs).getByRole('button', { name: '네 식구' }))
    expect(router.state.location.search).toBe('?form=default')
    expect(await screen.findByRole('img', { name: '파밀리쥐' })).toHaveAttribute('src', 'maushold-family-of-four.gif')
    expect(screen.getByText('2.8 kg')).toBeInTheDocument()
    await screen.findByRole('option', { name: 'RU' })
    await user.selectOptions(screen.getByRole('combobox', { name: '대전 포맷' }), 'ru')
    expect(screen.getByRole('article', { name: 'Four set' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Three set' })).not.toBeInTheDocument()

    await user.click(within(tabs).getByRole('button', { name: '세 식구' }))
    expect(router.state.location.search).toBe('')
    expect(await screen.findByRole('img', { name: '파밀리쥐 (세 식구)' })).toHaveAttribute('src', 'maushold-family-of-three.gif')
    expect(screen.getByRole('combobox', { name: '대전 포맷' })).toHaveValue('')
    client.clear()
  })

  it.each([
    ['default', '네 식구', 'maushold-family-of-four.gif'],
    ['family-of-three', '세 식구', 'maushold-family-of-three.gif'],
    ['unknown', '세 식구', 'maushold-family-of-three.gif'],
  ])('직접 진입·새로고침의 ?form=%s는 %s 폼을 표시한다', async (form, label, image) => {
    const { client } = setup(`/pokemon/925?form=${form}`)
    const button = await screen.findByRole('button', { name: label })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    const imageName = label === '세 식구' ? '파밀리쥐 (세 식구)' : '파밀리쥐'
    expect(await screen.findByRole('img', { name: imageName })).toHaveAttribute('src', image)
    client.clear()
  })
})
