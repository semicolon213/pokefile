import type { RouteObject } from 'react-router'
import { FavoritesPage } from './pages/FavoritesPage'

export const favoritesRoutes: RouteObject[] = [{ path: 'favorites', element: <FavoritesPage /> }]
