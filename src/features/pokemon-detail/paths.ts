import type { PokemonId } from '@/shared/models'

export const POKEMON_DETAIL_ROUTE = 'pokemon/:id'

export function pokemonDetailPath(id: PokemonId): string {
  return `/pokemon/${id}`
}
