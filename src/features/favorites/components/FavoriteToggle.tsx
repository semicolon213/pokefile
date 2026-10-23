import type { PokemonId } from '@/shared/models'

type Props = { pokemonId: PokemonId }

// FR-19~20 즐겨찾기 추가/해제 — TASK-008에서 구현
export function FavoriteToggle({ pokemonId }: Props) {
  return (
    <button type="button" disabled aria-label={`#${pokemonId} 즐겨찾기`}>
      ☆ 즐겨찾기
    </button>
  )
}
