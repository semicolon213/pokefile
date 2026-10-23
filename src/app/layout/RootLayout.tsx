import { NavLink, Outlet } from 'react-router'

export function RootLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="app-logo">
          PokeFile
        </NavLink>
        <nav aria-label="주요 메뉴">
          <NavLink to="/" end>
            도감
          </NavLink>
          <NavLink to="/favorites">즐겨찾기</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
