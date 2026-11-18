// type-chart feature public API — 다른 영역은 이 파일에서 export한 것만 import한다. (TASK-021, FR-24)
export { TypeMatchups } from './components/TypeMatchups'
export { typeChartPath } from './model/params'
export { typeChartRoutes } from './routes'
// 파티 분석(FR-33)이 같은 상성 데이터로 계산한다
export { damageTaken, formatMultiplier, typeEffectiveness } from './model/matchup'
