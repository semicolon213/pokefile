import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
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
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ version: 1, generatedAt: '', count: 0, pokemon: [] })))
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

  it('지원 범위 밖의 game 값은 무시한다', async () => {
    const router = renderAt('/favorites?game=scarlet')
    expect(await screen.findByRole('combobox', { name: '내 게임' })).toHaveValue('')
    expect(localStorage.getItem(MY_GAME_STORAGE_KEY)).toBeNull()
    expect(search(router)).toBe('?game=scarlet')
  })
})
