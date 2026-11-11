import type { FormKey, PokemonId } from '@/shared/models'

export const pokemonDetailQueryKeys = {
  pokemon: (id: PokemonId, formKey: FormKey = 'default') => ['pokemon', id, formKey] as const,
  pokemonForm: (name: string) => ['pokemon-form', name] as const,
  species: (id: PokemonId) => ['species', id] as const,
  ability: (name: string) => ['ability', name] as const,
  evolutionChain: (chainId: number) => ['evolution-chain', chainId] as const,
  /** 진화 조건의 도구·기술·장소 이름 */
  conditionName: (kind: 'item' | 'move' | 'location', name: string) => [kind, name] as const,
  encounters: (id: PokemonId) => ['encounters', id] as const,
  pokedexIndex: () => ['pokemon-detail', 'pokedex-index'] as const,
}
