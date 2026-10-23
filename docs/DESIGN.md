# PokeFile 설계 명세서 (DESIGN)

- 버전: 0.1 / **설계 제안, 승인 전**
- 근거: 1주차 보고서 및 `SRS.md`
- 확정 기술: React + Vite, React Router, TanStack Query, Recharts, PokéAPI, data.pkmn.cc, localStorage
- 미확정: 배포 플랫폼, 라우트 상세, 폼 처리 범위, 테스트 프레임워크

## 1. 목표와 경계
브라우저만으로 동작하는 정적 React 웹. 사용자 계정, 별도 백엔드 및 자체 DB는 포함하지 않는다.
외부 API 호출 실패나 일부 데이터 누락이 전체 페이지 장애로 이어지지 않도록 기능 단위 오류를 분리한다.

## 2. 논리 구조
```text
Browser
 ├─ app/ (Router, QueryClient, Layout)
 ├─ features/pokedex/ (검색, 필터, 정렬, 무한 스크롤)
 ├─ features/pokemon-detail/ (기본 정보, 차트, 진화, 출현)
 ├─ features/battle-tools/ (실전 세팅, 선택: 상성/비교)
 ├─ features/favorites/ (localStorage 즐겨찾기) [담당 배정은 OWNERSHIP 참조]
 └─ shared/
    ├─ api/ (PokéAPI, data.pkmn.cc 호출)
    ├─ models/ (정규화 모델)
    ├─ ui/ (공통 UI)
    └─ utils/ (식별자/폼 매핑)
```
`features/favorites/`는 세 번째 담당자의 기능 범위로 제안한다. 폴더 구조는 팀 승인 후 확정.

## 3. 제안 디렉터리
```text
src/
  app/{router,providers,layout}/
  features/{pokedex,pokemon-detail,battle-tools,favorites}/
  shared/{api,models,ui,utils}/
tests/{unit,integration,e2e}/
```
기능 간 직접 내부 파일 참조는 피하고 `shared`의 공개 인터페이스 또는 명시된 feature public API를 이용한다.

## 4. 페이지 및 이동 (제안)
- `/`: 검색/필터/정렬/카드 목록
- `/pokemon/:id`: 상세/종족값/진화/출현/실전 세팅/즐겨찾기
- `/favorites`: 저장된 포켓몬 목록
정적 호스팅에서 상세 URL 새로고침 처리 필요.

## 5. 데이터 처리 흐름
1. 검색용 포켓몬 목록을 수집한다.
2. species의 한국어 이름을 연결해 클라이언트 검색 인덱스를 구성한다.
3. 검색어 → 타입·세대 필터 → 정렬 → 가시 항목 분할 순서로 표시한다 (**처리 순서 제안**).
4. 상세 진입 시 Query가 기본/종/진화/출현/실전 데이터를 분리 조회한다.
5. 응답은 `shared/models`의 정규화 형태로 변환한다.
6. 개별 요청 실패 시 해당 섹션에 오류 또는 '데이터 없음'을 표시한다.

## 6. 공통 모델 초안 (계약 승인 필요)
```ts
type PokemonId = number;
type PokemonSummary = {
  id: PokemonId;
  nameEn: string;
  nameKo?: string;
  types: string[];
  generation?: string;
  imageUrl?: string;
};
type Loadable<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "empty" }
  | { status: "error"; message: string };
```
위 모델은 제안이며 PokéAPI 응답 스키마를 그대로 복사한 것이 아니다.

## 7. 기능별 인터페이스 계약
| 제공자 | 소비자 | 계약 | 변경 승인 |
|---|---|---|---|
| shared/api | 전체 기능 | HTTP 요청/오류 처리 | 공통 관리자 + 영향 담당자 |
| shared/models | 전체 기능 | PokemonId, PokemonSummary 등 | 영향 담당자 합의 |
| pokedex | detail | 상세 이동 시 PokemonId | 양쪽 담당자 |
| detail | battle-tools | ID/폼 식별자 | 양쪽 담당자 |
| favorites | 목록·상세 | 저장 여부 조회/토글 | 영향 담당자 |

## 8. 상태·캐싱
- 서버 상태: TanStack Query, Query Key는 리소스+ID+폼+게임 등 실제 조회 차원을 포함한다.
- UI 상태: 검색어, 선택 필터, 정렬, 표시 개수는 화면 범위에서 관리한다.
- 즐겨찾기: localStorage, 중복 방지·파싱 오류 대비. 키/스키마는 팀 확정 필요.
- 캐시 TTL, 초기 로딩 전략, 동시 요청 제한은 성능 측정 후 결정한다.

## 9. 예외 처리
- 로딩 / 오류 / 결과 없음 / API 데이터 없음은 구분한다.
- 포켓몬 상세 기본 데이터 실패와 부가 섹션 실패를 구분한다.
- 한국어 이름 누락 시 영문 이름 폴백 여부는 결정 필요.
- Smogon 폼 매핑 실패 시 임의 세팅을 표시하지 않는다.

## 10. 접근성·반응형
검색·필터·카드·즐겨찾기는 키보드 접근 가능해야 하며 차트에는 텍스트 수치도 제공한다.
PC/모바일 반응형은 필수이나 정확한 브레이크포인트는 화면 설계에서 확정한다.

## 11. 설계 변경 관리
공통 타입·API 계약·라우팅·패키지 의존성 변경은 이슈/ADR → 영향 담당자 승인 → 별도 PR.
자세한 승인 규칙은 `OWNERSHIP.md`, `WORKFLOW.md` 참조.
