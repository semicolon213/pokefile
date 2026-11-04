import { createHashRouter } from 'react-router'
import { routes } from './routes'

// GitHub Pages는 서버 rewrite가 없으므로 HashRouter를 사용한다 (ADR-005). 실제 주소: /pokefile/#/pokemon/25
export const router = createHashRouter(routes)
