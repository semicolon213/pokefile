import { ScrollRestoration, type Location } from 'react-router'

// 스크롤 위치 복원. 목록은 주소(필터 쿼리)마다 기억해 뒤로 가기·'도감 목록으로' 모두 제자리로 돌아온다.
// 그 밖의 화면은 방문 기록마다 기억한다(새로 들어가면 맨 위, 뒤로 가면 제자리).
// data router(createHashRouter) 안에서만 동작하므로 레이아웃이 아니라 루트 경로에 둔다.
const scrollKey = (location: Location) =>
  location.pathname === '/' ? location.pathname + location.search : location.key

export function AppScrollRestoration() {
  return <ScrollRestoration getKey={scrollKey} />
}
