import type { RouteObject } from 'react-router'
import { battleToolsRoutes } from '@/features/battle-tools'
import { favoritesRoutes } from '@/features/favorites'
import { pokedexRoutes } from '@/features/pokedex'
import { pokemonDetailRoutes } from '@/features/pokemon-detail'
import { NotFoundPage } from '../layout/NotFoundPage'
import { RootLayout } from '../layout/RootLayout'

// 각 feature는 자신의 routes.tsx에서 경로를 관리한다.
// 이 파일은 feature 추가/삭제 시에만 수정한다 (DESIGN.md §11 라우팅 변경 승인).
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      ...pokedexRoutes,
      ...pokemonDetailRoutes,
      ...favoritesRoutes,
      ...battleToolsRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
