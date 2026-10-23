import { createBrowserRouter } from 'react-router'
import { routes } from './routes'

// 배포 플랫폼(OQ-04) 확정 후 SPA fallback 또는 basename을 조정한다.
export const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL })
