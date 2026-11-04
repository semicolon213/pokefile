import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FavoritesPage } from '@/features/favorites/pages/FavoritesPage'
import { favoritesStore } from '@/features/favorites/model/store'

beforeEach(() => { localStorage.clear(); favoritesStore.refresh() })

describe('FavoritesPage', () => {
  it('빈 목록 안내와 도감으로 이동하는 링크를 표시한다 (FR-22)', () => {
    const fetch = vi.spyOn(globalThis, 'fetch')
    render(<MemoryRouter><FavoritesPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: '즐겨찾기' })).toBeInTheDocument()
    expect(screen.getByText('즐겨찾기한 포켓몬이 없습니다.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '도감으로 이동' })).toHaveAttribute('href', '/')
    expect(fetch).not.toHaveBeenCalled()
    fetch.mockRestore()
  })
})
