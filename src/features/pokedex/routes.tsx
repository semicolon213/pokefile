import type { RouteObject } from 'react-router'
import { PokedexPage } from './pages/PokedexPage'

export const pokedexRoutes: RouteObject[] = [{ index: true, element: <PokedexPage /> }]
