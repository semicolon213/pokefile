import { NavLink, Outlet, useLocation } from 'react-router'
import { HeaderSearch } from '@/features/pokedex'
import { BrandMark } from '@/shared/ui'

export function RootLayout() {
  // 상세(/pokemon/:id)는 도감의 하위 화면이므로 '포켓몬 도감' 탭을 현재 위치로 표시한다
  const { pathname } = useLocation()
  const inPokedex = pathname === '/' || pathname.startsWith('/pokemon/')
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="app-brand" aria-label="PokeFile 홈">
          <BrandMark />
          PokeFile
        </NavLink>
        <nav aria-label="주요 메뉴" className="app-nav">
          <NavLink to="/" end className={inPokedex ? 'active' : undefined}>
            포켓몬 도감
          </NavLink>
          <NavLink to="/favorites">즐겨찾기</NavLink>
        </nav>
        <div className="app-header__search">
          <HeaderSearch />
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
