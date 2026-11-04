import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { routes } from '@/app/router/routes'
import { MY_GAME_STORAGE_KEY } from '@/shared/state'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

const search = (router: ReturnType<typeof renderAt>) => router.state.location.search

describe('상단 바 내 게임 선택 (FR-26)', () => {
  beforeEach(() => {
    // 목록 화면의 검색 인덱스 요청은 빈 목록으로 응답한다
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ version: 2, generatedAt: '', count: 0, pokemon: [] })))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('게임을 고르면 저장되고 URL에 game이 붙는다', async () => {
    const user = userEvent.setup()
    const router = renderAt('/')
    const select = screen.getByRole('combobox', { name: '내 게임' })
    expect(select).toHaveValue('')
    await user.selectOptions(select, 'black-2')
    expect(localStorage.getItem(MY_GAME_STORAGE_KEY)).toBe('black-2')
    expect(search(router)).toBe('?game=black-2')

    await user.selectOptions(select, '')
    expect(localStorage.getItem(MY_GAME_STORAGE_KEY)).toBeNull()
    expect(search(router)).toBe('')
  })

  it('공유 링크(?game=)로 들어오면 그 게임을 저장한다', async () => {
    renderAt('/favorites?game=x')
    expect(await screen.findByRole('combobox', { name: '내 게임' })).toHaveValue('x')
    expect(localStorage.getItem(MY_GAME_STORAGE_KEY)).toBe('x')
  })

  it('저장된 게임이 있으면 다른 화면으로 가도 URL에 다시 붙는다', async () => {
    localStorage.setItem(MY_GAME_STORAGE_KEY, 'red')
    const router = renderAt('/favorites')
    expect(await screen.findByRole('combobox', { name: '내 게임' })).toHaveValue('red')
    await vi.waitFor(() => expect(search(router)).toBe('?game=red'))
  })

  it('뒤로 가기로 예전 game 주소에 돌아와도 직접 고른 선택을 유지하고 주소를 맞춘다 (QA D-014-01)', async () => {
    const user = userEvent.setup()
    const router = renderAt('/favorites')
    const select = await screen.findByRole('combobox', { name: '내 게임' })
    await user.selectOptions(select, 'red')
    await vi.waitFor(() => expect(search(router)).toBe('?game=red'))

    await act(() => router.navigate('/types?game=red'))
    await user.selectOptions(screen.getByRole('combobox', { name: '내 게임' }), 'x')
    await vi.waitFor(() => expect(search(router)).toBe('?game=x'))

    await act(() => router.navigate(-1))
    expect(router.state.location.pathname).toBe('/favorites')
    await vi.waitFor(() => expect(search(router)).toBe('?game=x'))
    expect(localStorage.getItem(MY_GAME_STORAGE_KEY)).toBe('x')
    expect(screen.getByRole('combobox', { name: '내 게임' })).toHaveValue('x')
  })

  it('앱 안 링크에 예전 game이 붙어 있어도 선택을 되돌리지 않는다', async () => {
    localStorage.setItem(MY_GAME_STORAGE_KEY, 'x')
    const router = renderAt('/favorites')
    await vi.waitFor(() => expect(search(router)).toBe('?game=x'))
    await act(() => router.navigate('/types?type=fire&game=red'))
    await vi.waitFor(() => expect(search(router)).toBe('?type=fire&game=x'))
    expect(localStorage.getItem(MY_GAME_STORAGE_KEY)).toBe('x')
  })

  it('전체 게임으로 바꾼 뒤 뒤로 가면 주소의 game을 지운다', async () => {
    const user = userEvent.setup()
    const router = renderAt('/favorites?game=red')
    expect(await screen.findByRole('combobox', { name: '내 게임' })).toHaveValue('red')
    await act(() => router.navigate('/types?game=red'))
    await user.selectOptions(screen.getByRole('combobox', { name: '내 게임' }), '')
    await act(() => router.navigate(-1))
    await vi.waitFor(() => expect(search(router)).toBe(''))
    expect(localStorage.getItem(MY_GAME_STORAGE_KEY)).toBeNull()
  })

  it('지원 범위 밖의 game 값은 무시한다', async () => {
    const router = renderAt('/favorites?game=champions')
    expect(await screen.findByRole('combobox', { name: '내 게임' })).toHaveValue('')
    expect(localStorage.getItem(MY_GAME_STORAGE_KEY)).toBeNull()
    expect(search(router)).toBe('?game=champions')
  })
})
