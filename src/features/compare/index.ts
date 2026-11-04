// compare feature public API — 다른 영역은 이 파일에서 export한 것만 import한다. (TASK-022, FR-25)
// 비교 화면 경로(comparePath)는 상세 등에서 순환 import 없이 쓰도록 shared/utils에 있다.
export { compareRoutes } from './routes'
