import type { RouteObject } from 'react-router'
import { PokemonDetailPage } from './pages/PokemonDetailPage'
import { POKEMON_DETAIL_ROUTE } from './paths'

export const pokemonDetailRoutes: RouteObject[] = [
  { path: POKEMON_DETAIL_ROUTE, element: <PokemonDetailPage /> },
]
