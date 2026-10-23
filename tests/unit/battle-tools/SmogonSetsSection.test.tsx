import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SmogonSetsSection } from '@/features/battle-tools'

describe('SmogonSetsSection', () => {
  it('렌더링된다', () => {
    render(<SmogonSetsSection pokemonId={25} />)
    expect(screen.getByRole('region', { name: '실전 추천 세팅' })).toBeInTheDocument()
  })
})
