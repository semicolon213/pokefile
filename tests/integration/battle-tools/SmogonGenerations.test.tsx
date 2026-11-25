import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SmogonSetsSection } from '@/features/battle-tools'
import { battleToolsQueryKeys } from '@/features/battle-tools/api/queryKeys'
import { normalizeSmogonSets } from '@/features/battle-tools/model/smogon'

// 공통 설정 승인과 별개로 승인된 TASK-025의 다중 세대 동작을 fixture로 검증한다.
vi.mock('@/shared/config/scope', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/shared/config/scope')>()
  return { ...original, SCOPE: { ...original.SCOPE, smogon: { generation: 6, generations: [9, 8, 7, 6] } } }
})

afterEach(() => vi.unstubAllGlobals())

const raw = (name: string, species = 'Charizard') => ({ [species]: { ou: { [name]: { moves: ['Protect'] } } } })
const generations = [9, 8, 7, 6]

function setup(data: Record<number, unknown> = Object.fromEntries(generations.map((gen) => [gen, raw(`Gen ${gen}`)]))) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } })
  for (const [gen, value] of Object.entries(data)) {
    client.setQueryData(battleToolsQueryKeys.smogonSets(Number(gen)), normalizeSmogonSets(value))
  }
  const element = (speciesName = 'charizard', formKey = 'default', pokemonId = 6) => (
    <QueryClientProvider client={client}>
      <SmogonSetsSection pokemonId={pokemonId} identity={{ status: 'success', data: { speciesName, formKey } }} />
    </QueryClientProvider>
  )
  return { client, element }
}

describe('실전 세팅 세대 탭 (TASK-025 / TC-06·08·09)', () => {
  it.each([
    [800, 'necrozma', 'dusk', 'Necrozma-Dusk-Mane', 7],
    [800, 'necrozma', 'dawn', 'Necrozma-Dawn-Wings', 7],
    [1017, 'ogerpon', 'wellspring-mask', 'Ogerpon-Wellspring', 9],
    [1017, 'ogerpon', 'hearthflame-mask', 'Ogerpon-Hearthflame', 9],
    [1017, 'ogerpon', 'cornerstone-mask', 'Ogerpon-Cornerstone', 9],
  ] as const)('D-01: #%i %s/%s의 %s 세팅을 %i세대에 표시한다', (id, species, form, externalName, generation) => {
    const { client, element } = setup({
      9: {}, 8: {}, 7: {}, 6: {},
      [generation]: { ...raw('Exact form', externalName), ...raw('Base', species) },
    })
    render(element(species, form, id))
    expect(screen.getByRole('tab', { name: `${generation}세대` })).toHaveAttribute('aria-selected', 'true')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ou' } })
    expect(screen.getByRole('article', { name: 'Exact form' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Base' })).not.toBeInTheDocument()
    expect(screen.queryByText('등록된 실전 세팅이 없습니다.')).not.toBeInTheDocument()
    client.clear()
  })

  it('실제 세팅이 있는 세대만 최신순으로 표시하고 최신 세대를 연다', () => {
    const { client, element } = setup({ 9: {}, 8: raw('Gen 8'), 7: {}, 6: raw('Gen 6') })
    render(element())
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['8세대', '6세대'])
    expect(screen.getByRole('tab', { name: '8세대' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ou' } })
    expect(screen.getByRole('article', { name: 'Gen 8' })).toBeInTheDocument()
    client.clear()
  })

  it('D-03: 기본 레쿠쟈는 8세대 National Dex AG를 숨기고 일반 AG 세팅을 제공한다', () => {
    const { client, element } = setup({
      9: {}, 7: {}, 6: {},
      8: { Rayquaza: {
        dlc1nationaldexag: { 'National Dex mega': { moves: ['Dragon Ascent'] } },
        anythinggoes: { 'Dynamax Sweeper': { moves: ['Dragon Ascent'] } },
      } },
    })
    render(element('rayquaza', 'default', 384))
    expect(screen.getByRole('tab', { name: '8세대' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('option').map((option) => (option as HTMLOptionElement).value))
      .toEqual(['', 'anythinggoes'])
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'anythinggoes' } })
    expect(screen.getByRole('article', { name: 'Dynamax Sweeper' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'National Dex mega' })).not.toBeInTheDocument()
    client.clear()
  })

  it('D-03: 제외 대상 세팅만 있으면 빈 세대 탭 대신 부재를 안내한다', () => {
    const { client, element } = setup({
      9: {}, 7: {}, 6: {},
      8: { Rayquaza: { dlc1nationaldexag: { 'National Dex mega': { moves: ['Dragon Ascent'] } } } },
    })
    render(element('rayquaza', 'default', 384))
    expect(screen.getByText('등록된 실전 세팅이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    client.clear()
  })

  it.each([
    { label: '세팅 있음', response: raw('Gen 9'), expectedGeneration: 9 },
    { label: '세팅 없음', response: {}, expectedGeneration: 8 },
  ])('D-02: 최신 세대 응답($label)을 기다린 뒤 $expectedGeneration 세대를 기본으로 연다', async ({ response, expectedGeneration }) => {
    let resolve!: (response: Response) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((done) => { resolve = done })))
    const { client, element } = setup({ 8: raw('Gen 8'), 7: {}, 6: raw('Gen 6') })
    render(element())
    expect(screen.getByRole('status')).toHaveTextContent('실전 세팅을 불러오는 중입니다.')
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByText('등록된 실전 세팅이 없습니다.')).not.toBeInTheDocument()

    await act(async () => resolve(Response.json(response)))
    expect(await screen.findByRole('tab', { name: `${expectedGeneration}세대` })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    client.clear()
  })

  it('D-02: 최신 세대가 비어 있어도 다음 세대가 대기 중이면 로딩을 유지한다', async () => {
    const responses = new Map<number, (response: Response) => void>()
    vi.stubGlobal('fetch', vi.fn((url: RequestInfo | URL) => new Promise<Response>((resolve) => {
      responses.set(Number(/gen(\d+)\.json/.exec(String(url))?.[1]), resolve)
    })))
    const { client, element } = setup({ 7: {}, 6: raw('Gen 6') })
    render(element())
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    await act(async () => responses.get(9)!(Response.json({})))
    await waitFor(() => expect(client.getQueryState(battleToolsQueryKeys.smogonSets(9))?.status).toBe('success'))
    expect(screen.getByRole('status')).toHaveTextContent('실전 세팅을 불러오는 중입니다.')
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

    await act(async () => responses.get(8)!(Response.json(raw('Gen 8'))))
    expect(await screen.findByRole('tab', { name: '8세대' })).toHaveAttribute('aria-selected', 'true')
    client.clear()
  })

  it('D-02: 최신 세대가 확정되면 이전 세대 로딩을 기다리지 않고 포맷을 선택할 수 있다', async () => {
    const responses = new Map<number, (response: Response) => void>()
    vi.stubGlobal('fetch', vi.fn((url: RequestInfo | URL) => new Promise<Response>((resolve) => {
      responses.set(Number(/gen(\d+)\.json/.exec(String(url))?.[1]), resolve)
    })))
    const { client, element } = setup({ 9: raw('Gen 9'), 8: raw('Gen 8') })
    render(element())
    expect(screen.getByRole('tab', { name: '9세대' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ou' } })
    expect(screen.getByRole('article', { name: 'Gen 9' })).toBeInTheDocument()
    await act(async () => {
      responses.get(7)!(Response.json(raw('Gen 7')))
      responses.get(6)!(Response.json(raw('Gen 6')))
    })
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4))
    expect(screen.getByRole('tab', { name: '9세대' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('combobox')).toHaveValue('ou')
    expect(screen.getByRole('article', { name: 'Gen 9' })).toBeInTheDocument()
    client.clear()
  })

  it('세대를 바꾸면 포맷을 초기화하고 방향키·Home·End로 탭을 이동한다', () => {
    const { client, element } = setup()
    render(element())
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ou' } })
    expect(screen.getByText('Gen 9')).toBeInTheDocument()
    const newest = screen.getByRole('tab', { name: '9세대' })
    newest.focus()
    fireEvent.keyDown(newest, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: '8세대' })).toHaveFocus()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('')
    fireEvent.keyDown(document.activeElement!, { key: 'End' })
    expect(screen.getByRole('tab', { name: '6세대' })).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })
    expect(newest).toHaveFocus()
    fireEvent.keyDown(newest, { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: '6세대' })).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect(newest).toHaveFocus()
    client.clear()
  })

  it('종·폼 변경 시 이전 세팅과 세대 선택을 초기화한다', () => {
    const { client, element } = setup(Object.fromEntries(generations.map((gen) => [gen, {
      ...raw(`Gen ${gen}`), ...raw(`Alola ${gen}`, 'Raichu-Alola'),
    }])))
    const view = render(element())
    fireEvent.click(screen.getByRole('tab', { name: '6세대' }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ou' } })
    view.rerender(element('raichu', 'alola'))
    expect(screen.queryByText('Gen 6')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '9세대' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('combobox')).toHaveValue('')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ou' } })
    expect(screen.getByText('Alola 9')).toBeInTheDocument()
    client.clear()
  })

  it('같은 세대의 조회를 공유하고 메가에서는 6·7세대만 요청한다', async () => {
    const fetch = vi.fn(async (url: RequestInfo | URL) => {
      const gen = Number(/gen(\d+)\.json/.exec(String(url))?.[1])
      return Response.json({ ...raw(`Gen ${gen}`), ...raw(`Mega ${gen}`, 'Charizard-Mega-X') })
    })
    vi.stubGlobal('fetch', fetch)
    const { client, element } = setup({})
    const view = render(element('charizard', 'mega-x'))
    await screen.findByRole('tab', { name: '7세대' })
    expect(fetch).toHaveBeenCalledTimes(2)
    view.rerender(element())
    await screen.findByRole('tab', { name: '9세대' })
    expect(fetch).toHaveBeenCalledTimes(4)
    view.rerender(element('charizard', 'mega-x'))
    await screen.findByRole('tab', { name: '7세대' })
    expect(fetch).toHaveBeenCalledTimes(4)
    view.unmount()
    client.clear()
  })

  it('D-02: 최신 세대가 실패하면 다음 세대를 제공하고 재시도 성공 후에도 고른 포맷을 유지한다', async () => {
    let resolveRetry!: (response: Response) => void
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveRetry = resolve }))
    vi.stubGlobal('fetch', fetch)
    const { client, element } = setup({ 8: raw('Gen 8'), 7: {}, 6: {} })
    render(element())
    expect(await screen.findByRole('alert')).toHaveTextContent('9세대 실전 세팅을 불러오지 못했습니다.')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ou' } })
    expect(screen.getByRole('article', { name: 'Gen 8' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '9세대 다시 시도' }))
    expect(screen.getByRole('article', { name: 'Gen 8' })).toBeInTheDocument()
    await act(async () => resolveRetry(Response.json(raw('Gen 9'))))
    expect(await screen.findByRole('tab', { name: '9세대' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tab', { name: '8세대' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('combobox')).toHaveValue('ou')
    expect(screen.getByRole('article', { name: 'Gen 8' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Gen 9' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(2)
    client.clear()
  })

  it('뒤늦게 최신 세대가 도착해도 사용자가 고른 세대를 바꾸지 않는다', async () => {
    let resolve!: (response: Response) => void
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done })))
    const { client, element } = setup({ 8: raw('Gen 8'), 7: {}, 6: raw('Gen 6') })
    render(element())
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('tab', { name: '6세대' }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ou' } })
    fireEvent.click(screen.getByRole('button', { name: '9세대 다시 시도' }))
    await act(async () => resolve(Response.json(raw('Gen 9'))))
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(3))
    expect(screen.getByRole('tab', { name: '6세대' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('article', { name: 'Gen 6' })).toBeInTheDocument()
    client.clear()
  })

  it('D-02: 아직 선택하지 않았다면 재시도 성공 후 최신 세대를 기본으로 연다', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(Response.json(raw('Gen 9'))))
    const { client, element } = setup({ 8: raw('Gen 8'), 7: {}, 6: {} })
    render(element())
    await screen.findByRole('alert')
    expect(screen.getByRole('tab', { name: '8세대' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('button', { name: '9세대 다시 시도' }))
    expect(await screen.findByRole('tab', { name: '9세대' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('combobox')).toHaveValue('')
    client.clear()
  })

  it('모든 세대가 정상적으로 비어 있으면 오류 없이 부재 안내만 표시한다', () => {
    const { client, element } = setup({ 9: {}, 8: {}, 7: {}, 6: {} })
    render(element())
    expect(screen.getByText('등록된 실전 세팅이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    client.clear()
  })

  it('모든 세대 실패는 데이터 없음으로 숨기지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })))
    const { client, element } = setup({})
    render(element())
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(4))
    expect(screen.queryByText('등록된 실전 세팅이 없습니다.')).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: '실전 추천 세팅' })).getAllByRole('button')).toHaveLength(4)
    client.clear()
  })
})
