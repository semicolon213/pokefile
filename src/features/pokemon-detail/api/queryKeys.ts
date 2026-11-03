import type { FormKey, PokemonId } from '@/shared/models'

export const pokemonDetailQueryKeys = {
  pokemon: (id: PokemonId, formKey: FormKey = 'default') => ['pokemon', id, formKey] as const,
  pokemonForm: (name: string) => ['pokemon-form', name] as const,
  species: (id: PokemonId) => ['species', id] as const,
  ability: (name: string) => ['ability', name] as const,
  encounters: (id: PokemonId) => ['encounters', id] as const,
  pokedexIndex: () => ['pokemon-detail', 'pokedex-index'] as const,
}
