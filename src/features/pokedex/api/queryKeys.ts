export const pokedexQueryKeys = {
  all: ['pokedex'] as const,
  searchIndex: () => [...pokedexQueryKeys.all, 'search-index'] as const,
}
