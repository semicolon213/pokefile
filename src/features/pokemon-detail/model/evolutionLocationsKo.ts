import LOCATION_NAMES from './locationNamesKo.json'

// 진화 조건에 나오는 장소의 한국어 이름 (FR-28). PokéAPI location은 칼로스 외 지역에 ko가 없다(OQ-18).
// 게임별 진화 방법을 모두 보여 주므로(2026-11-18 결정) 영원의숲·천관산 등 여러 장소가 나온다.
// 출현 장소와 같은 장소 이름표(locationNamesKo.json, TASK-006)를 쓴다. 표에 없으면 PokéAPI 이름(ko → en)을 쓴다.
export const EVOLUTION_LOCATION_NAMES_KO: Readonly<Record<string, string>> = LOCATION_NAMES
