import { describe, expect, it } from 'vitest'
import { favoriteEntries } from '@/features/favorites/model/list'
import type { PokemonSummary } from '@/shared/models'

const pokemon: PokemonSummary[] = [
  { id: 25, nameEn: 'pikachu', nameKo: '피카츄', types: ['electric'], generation: 'generation-i', megaForms: [] },
  { id: 133, nameEn: 'eevee', nameKo: '이브이', types: ['normal'], generation: 'generation-i', megaForms: [] },
]

describe('저장 목록과 도감 정보 연결 (FR-22)', () => {
  it('도감 순서와 관계없이 저장한 순서대로 표시한다', () => {
    const entries = favoriteEntries([133, 25], pokemon)
    expect(entries.map((entry) => entry.pokemon?.nameKo)).toEqual(['이브이', '피카츄'])
  })

  it('도감에 없는 ID도 목록에서 해제할 수 있도록 남긴다', () => {
    expect(favoriteEntries([25, 6], pokemon)).toEqual([
      { id: 25, pokemon: pokemon[0] }, { id: 6, pokemon: undefined },
    ])
  })
})
