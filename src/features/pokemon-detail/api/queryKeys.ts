import type { PokemonId } from '@/shared/models'

export const pokemonDetailQueryKeys = {
  pokemon: (id: PokemonId) => ['pokemon', id] as const,
  species: (id: PokemonId) => ['species', id] as const,
  encounters: (id: PokemonId) => ['encounters', id] as const,
}
