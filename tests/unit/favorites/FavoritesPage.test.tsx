import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FavoritesPage } from '@/features/favorites/pages/FavoritesPage'

describe('FavoritesPage', () => {
  it('렌더링된다', () => {
    render(<FavoritesPage />)
    expect(screen.getByRole('heading', { name: '즐겨찾기' })).toBeInTheDocument()
  })
})
