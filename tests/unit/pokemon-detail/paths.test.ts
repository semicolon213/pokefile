import { describe, expect, it } from 'vitest'
import { pokemonDetailPath } from '@/features/pokemon-detail'

describe('pokemonDetailPath', () => {
  it('상세 경로를 만든다', () => {
    expect(pokemonDetailPath(25)).toBe('/pokemon/25')
  })
})
