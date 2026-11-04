import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SmogonSetsSection } from '@/features/battle-tools'
import { battleToolsQueryKeys } from '@/features/battle-tools/api/queryKeys'
import { normalizeGen6SmogonSets } from '@/features/battle-tools/model/smogon'
import type { FormKey } from '@/shared/models'
import { SMOGON_FIXTURE } from './fixtures'

afterEach(() => vi.unstubAllGlobals())

function setup(data: unknown = SMOGON_FIXTURE) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } })
  if (data !== null) client.setQueryData(battleToolsQueryKeys.smogonSets(), normalizeGen6SmogonSets(data))
  const element = (formKey: FormKey = 'default', speciesName = 'charizard') => (
    <QueryClientProvider client={client}>
      <SmogonSetsSection pokemonId={6} identity={{ status: 'success', data: { speciesName, formKey } }} />
    </QueryClientProvider>
  )
  return { client, element }
}

describe('실전 추천 세팅 화면 (TC-06·09)', () => {
  it('포맷을 선택하면 세팅 항목과 후보·대안 분배를 표시한다', () => {
    const { client, element } = setup()
    render(element())
    const select = screen.getByRole('combobox', { name: '대전 포맷' })
    expect(select).toHaveValue('')
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    fireEvent.change(select, { target: { value: 'ou' } })
    const card = screen.getByRole('article', { name: 'Base attacker' })
    for (const label of ['성격', '특성', '도구', '노력치', '개체값', '기술']) expect(within(card).getByText(label)).toBeInTheDocument()
    expect(within(card).getByText('Timid')).toBeInTheDocument()
    expect(within(card).getByText('Modest')).toBeInTheDocument()
    expect(within(card).getByText('Air Slash')).toBeInTheDocument()
    expect(within(card).getByText('Roost')).toBeInTheDocument()
    expect(within(card).getByText('특수공격 252 / 스피드 252')).toBeInTheDocument()
    expect(within(card).getByText(/HP 252 \/ 특수공격 252/)).toBeInTheDocument()
    expect(within(card).getByText('공격 0')).toBeInTheDocument()
    expect(screen.queryByText('Mega X attacker')).not.toBeInTheDocument()
    client.clear()
  })

  it('폼을 바꾸면 이전 세팅과 포맷 선택을 바로 초기화한다', () => {
    const { client, element } = setup()
    const view = render(element())
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ou' } })
    expect(screen.getByText('Base attacker')).toBeInTheDocument()
    view.rerender(element('mega-x'))
    expect(screen.queryByText('Base attacker')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ou' } })
    expect(screen.getByText('Mega X attacker')).toBeInTheDocument()
    expect(screen.getByText('Direct X attacker')).toBeInTheDocument()
    expect(screen.queryByText('Mega Y attacker')).not.toBeInTheDocument()
    view.rerender(element('mega-y'))
    expect(screen.queryByText('Mega X attacker')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ou' } })
    expect(screen.getByText('Mega Y attacker')).toBeInTheDocument()
    client.clear()
  })

  it.each(['caterpie', 'rayquaza'])('%s 세팅 부재를 오류와 구분한다', (speciesName) => {
    const { client, element } = setup()
    render(element(speciesName === 'rayquaza' ? 'mega' : 'default', speciesName))
    expect(screen.getByText('등록된 실전 세팅이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    client.clear()
  })

  it('포켓몬 식별 정보 실패를 재시도하고 세팅을 임의로 조회하지 않는다', () => {
    const retry = vi.fn()
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    render(<SmogonSetsSection pokemonId={6} identity={{ status: 'error', message: 'failed' }} onRetryIdentity={retry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('포켓몬 정보를 불러오지 못했습니다.')
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(retry).toHaveBeenCalledOnce()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('조회 로딩·오류·재시도 후 성공을 표시한다', async () => {
    let resolveFirst!: (response: Response) => void
    const fetch = vi.fn()
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveFirst = resolve }))
      .mockImplementationOnce(async () => Response.json(SMOGON_FIXTURE))
    vi.stubGlobal('fetch', fetch)
    const { client, element } = setup(null)
    render(element())
    expect(screen.getByRole('status')).toHaveTextContent('실전 세팅을 불러오는 중입니다.')
    resolveFirst(new Response('', { status: 503 }))
    expect(await screen.findByRole('alert')).toHaveTextContent('실전 세팅을 불러오지 못했습니다.')
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledTimes(2)
    client.clear()
  })
})
