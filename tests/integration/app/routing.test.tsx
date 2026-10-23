import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { routes } from '@/app/router/routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

describe('app routing', () => {
  it.each([
    ['/', '포켓몬 도감'],
    ['/pokemon/25', '포켓몬 #25'],
    ['/favorites', '즐겨찾기'],
    ['/unknown', '페이지를 찾을 수 없습니다'],
  ])('%s 경로를 렌더링한다', async (path, heading) => {
    renderAt(path)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })
})
