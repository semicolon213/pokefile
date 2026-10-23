import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { PokedexPage } from '@/features/pokedex/pages/PokedexPage'

describe('PokedexPage', () => {
  it('렌더링된다', () => {
    render(<PokedexPage />, { wrapper: MemoryRouter })
    expect(screen.getByRole('heading', { name: '포켓몬 도감' })).toBeInTheDocument()
  })
})
