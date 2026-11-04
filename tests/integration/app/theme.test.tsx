import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { routes } from '@/app/router/routes'

describe('상단 바 화면 테마 선택 (FR-32)', () => {
  it('아이콘 세 개 중 하나를 고르고, 고른 것을 표시한다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ version: 2, generatedAt: '', count: 0, pokemon: [] })))
    const user = userEvent.setup()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/favorites'] })} />
      </QueryClientProvider>,
    )
    const group = await screen.findByRole('group', { name: '화면 테마' })
    const button = (name: string) => within(group).getByRole('button', { name })
    expect(button('시스템 설정')).toHaveAttribute('aria-pressed', 'true')
    await user.click(button('다크 모드'))
    expect(button('다크 모드')).toHaveAttribute('aria-pressed', 'true')
    expect(button('시스템 설정')).toHaveAttribute('aria-pressed', 'false')
    expect(document.documentElement.dataset.theme).toBe('dark')
    await user.click(button('라이트 모드'))
    expect(document.documentElement.dataset.theme).toBe('light')
    vi.unstubAllGlobals()
  })
})
