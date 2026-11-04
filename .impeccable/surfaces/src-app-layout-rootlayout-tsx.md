---
version: 1
slug: "src-app-layout-rootlayout-tsx"
primary_target: "src/app/layout/RootLayout.tsx"
related_targets: ["src/features/pokedex/pages/PokedexPage.tsx","src/features/pokemon-detail/pages/PokemonDetailPage.tsx","src/features/favorites/pages/FavoritesPage.tsx"]
---

# Surface brief: PokeFile app shell (도감 목록 · 상세 · 즐겨찾기)

- Scope: 전체 앱 리디자인 — 공통 셸(헤더·토큰), 도감 목록(`/`), 상세(`/pokemon/:id`), 즐겨찾기(`/favorites`), 실전 세팅 섹션.
- Visitor mode: Operate. 플레이 중 PC 옆 화면에 띄워 둔 팬이 몇 초 안에 찾고 확인한다. 기준 화면은 PC(1280~1440), 모바일은 확장.
- Constraints: 기능·데이터·라우트·URL 상태·접근성 계약 유지. 한국어 우선, 화면 이름 PokeFile. 상세는 임지섭, 즐겨찾기·실전 세팅은 성윤우 소유 → PR에서 영향 담당자 확인.
- Quality bar: 포켓몬코리아 공식 도감, Pokémon Database, Pokémon Showdown 도감의 완성도.
- Chosen: category standard (canon), sketch `.impeccable/mocks/decision/canon.html`.
- Unresolved: OQ-10 선택 기능 메뉴, OQ-18 장소 한국어 이름, OQ-19 세팅 포맷.

## Direction contract

THESIS: 도감 사이트의 정공법 — 상단 바, 세대 사이드바, 흰 카드 격자, 절제된 빨강. 장식 배너·히어로 대신 첫 화면부터 목록이 일한다. 거부하는 것: 회색 SaaS 대시보드, 네온 게이밍, 픽셀 코스프레, 공식 사이트 복제.

OWN-WORLD: 흰 바탕(#FFFFFF)과 아주 옅은 회색 면(#F6F8FA), 잉크 #1F2328, 보조 #57606A, 선 #E3E6EA. 강조 빨강 #D1300A(AA 대비)는 주 버튼·선택 상태에만, 선택 배경 #FDECE8 + 글자 #B42A0A. 타입 배지는 옅은 타입 색 바탕 + 잉크 글자(18종 모두 AA). 모서리 8px(컨트롤)·12px(카드), 4px 배수 간격, Noto Sans KR 계열 시스템 스택, 숫자는 tabular.

STORY: 방문자는 첫 화면에서 721마리 격자와 검색·세대·타입·정렬이 모두 보이는 것을 확인하고, 카드를 눌러 상세에서 종족값·진화·출현·실전 세팅을 한 화면에 읽고, 별로 즐겨찾기한다.

FIRST VIEWPORT: 높이 64px 상단 바(왼쪽 몬스터볼 마크+PokeFile, 메뉴 '포켓몬 도감'·'즐겨찾기' 탭형, 오른쪽 검색 입력 320px+빨간 '검색' 버튼). 아래 248px 좌측 세대 사이드바(전체 721 … 6세대 칼로스지방 72, 선택은 옅은 빨강 면). 본문: 타입 칩 줄 → 'N마리의 포켓몬'+정렬 select → 6열 카드(번호·스프라이트 정수배·이름·타입 배지·별). 시그니처: 카드 스프라이트를 회색 원판 위에 정수배로 또렷하게, 즐겨찾기 별의 즉각 상태 전환.

FORM: canon (standing exit; not on the grounded list) · seed:87b810a56008c95d

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
