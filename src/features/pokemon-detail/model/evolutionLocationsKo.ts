// 진화 조건에 나오는 장소의 한국어 이름 (FR-28). PokéAPI location은 칼로스 외 지역에 ko가 없다(OQ-18).
// 최신 게임 조건만 표시하므로(2026-11-11 결정) 현재 쓰이는 장소는 dusty-bowl 하나다(전체 540개 체인 실측).
// 출처: 포켓몬 위키(pokemon.fandom.com/ko) '데스마스 (포켓몬)' 진화 조건 (2026-11-11). 표에 없으면 PokéAPI 이름(ko → en)을 쓴다.
export const EVOLUTION_LOCATION_NAMES_KO: Readonly<Record<string, string>> = {
  'dusty-bowl': '모래먼지구덩이',
}
