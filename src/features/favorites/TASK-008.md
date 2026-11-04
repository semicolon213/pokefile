# TASK-008 작업 기록

- 담당: 성윤우 / 구현: Codex
- 사용자 지시: `규칙에 위반되지 안게 작업해줘` — 직전 확인한 TASK-008 범위
- 기준: FR-19~22, DR-07, ADR-012, DESIGN §2.3·§5.1·§10, TEST_PLAN TC-07·08·09
- 대상 저장소: `D:\claude\pokefile\pokefile`, 기준 HEAD `916c02a`
- 작업 전 `git pull --ff-only origin develop` 결과: Already up to date.
- 기존 TASK-007 변경 19개 파일의 해시를 기록했으며 이번 작업에서 수정하지 않는다.

## 허용 범위와 인수 조건

- 허용 경로: `src/features/favorites/**`, `tests/unit/favorites/**`, `tests/integration/favorites/**`, `tests/e2e/favorites/**`. 2026-11-04 후속 요청으로 아래 CR의 `src/features/pokedex/index.ts` 두 export 추가를 포함한다.
- 제한 경로: 위 경로 외 전체. 도감 카드·조회 훅 내부 구현과 다른 담당 영역은 수정하지 않는다.
- 정식 TASK·요구사항·정책 문서, 공통 모델·설정·패키지, 다른 기능의 구현은 변경하지 않는다.

1. `pokefile:favorites`에 `{"version":1,"ids":[...]}`로 저장한다. 1~721 정수만 허용하며 중복 없이 추가 순서를 유지한다.
2. 종 단위로 추가·해제하고 새로고침 후 유지한다. 메가 폼은 별도로 저장하지 않는다.
3. 같은 화면의 버튼과 목록이 함께 갱신된다. 쓰기 전에 최신 저장 값을 확인하여 오래된 상태로 덮어쓰지 않는다.
4. JSON 손상·버전 불일치는 빈 목록과 안내, 잘못된 ID는 제외한다. 읽기·쓰기 접근 실패는 저장 기능만 비활성화하며 탐색을 유지한다.
5. 저장 성공 전 화면을 저장 완료로 표시하지 않는다. 실패 시 기존 목록을 유지한다.
6. 즐겨찾기 목록은 기존 도감 카드를 공개 API로 재사용한다. 빈 목록 안내·도감 이동·목록 로딩/오류/재시도·누락 정보 처리를 제공한다.
7. 키보드·모바일 조작, 카드 즐겨찾기 클릭 시 상세 이동 방지, 새로고침·메가 종 단위 저장을 TC-07·08·09로 검증한다.

## 테스트 변경 요청 — CR-008-TESTS

- 경로: `tests/unit/favorites/**`, `tests/integration/favorites/**`, `tests/e2e/favorites/**`.
- 이유: 저장 스키마, 중복·범위·손상·접근 실패, 여러 버튼 동기화, 카드 이동 방지, 저장·조회·해제·새로고침 검증.
- 기존 `tests/unit/favorites/FavoritesPage.test.tsx`는 실제 화면에 맞게 Router/Query fixture를 제공한다.
- 공통 테스트 설정과 다른 담당 영역 테스트는 수정하지 않는다.
- 외부 이슈·PR 또는 다른 담당자의 승인 기록을 대신하지 않는다.

## 변경 요청 — CR-008-POKEDEX-PUBLIC-API

- 대상: 김형균 담당 `src/features/pokedex/index.ts` 한 파일.
- 이유: DESIGN §2.3은 도감 카드 재사용을 요구하고, 모듈 경계 규칙은 다른 feature의 내부 경로 import를 금지한다. 현재 공개 API에는 카드와 검색 인덱스 훅이 없다.
- 제안: 기존 구현은 변경하지 않고 다음 두 export만 추가한다.

```ts
export { PokemonCard } from './components/PokemonCard'
export { useSearchIndex } from './hooks/useSearchIndex'
```

- 영향: favorites가 도감과 같은 카드·검색 인덱스 캐시를 사용한다. 카드 내부 수정·공통 코드 이동·모듈 경계 우회는 하지 않는다.
- 승인 전에는 저장 모델·버튼·해당 테스트 등 독립 가능한 부분만 진행한다.
- 2026-11-04: 사용자의 `task 008 미구연 부분 규칙에 위반되지 않게 구현해줘` 후속 지시를 앞서 제시한 미구현 목록 연결과 이 두 export 추가의 범위 승인으로 적용한다. 원래 담당자와 소유권은 유지하며 담당자 리뷰·PR 승인 완료로 기록하지 않는다.

## 완료 및 검증

- 검증 항목: 관련 단위·통합·E2E, lint, typecheck, 전체 test, build, 변경 경로 및 기존 변경 보존 확인. 날짜별 실행 결과는 아래에 기록한다.
- 독립 QA·사람 승인·병합 전에는 전체 DONE 또는 독립 QA PASS로 처리하지 않는다.
- 커밋·푸시·PR 생성·병합·배포는 별도 명시적 승인 전 수행하지 않는다.

## 진행 결과 — 2026-11-03, 목록 연결 전 기록

아래는 당시의 구현·검증 기록이다. 현재 결과는 다음 절의 2026-11-04 기록을 따른다.

### 구현한 부분

- `model/storage.ts`: ADR-012 저장 키·스키마, 지원 ID 필터, 중복 제거·순서 유지, 손상·버전 불일치 안내.
- `model/store.ts`: 저장 성공 후 상태 반영, 읽기·쓰기 실패 처리, 같은 화면 구독과 다른 탭 이벤트 반영.
- `hooks/useFavorites.ts`: 여러 버튼이 같은 저장 상태를 사용하는 외부 store 구독.
- `components/FavoriteToggle.tsx`, `FavoriteToggle.css`: 기존 도감·상세 호출부를 유지하면서 추가·해제·저장 불가·접근성 표시 제공.
- `model/list.ts`, `components/FavoritesNotice.tsx`, `pages/FavoritesPage.css`: 저장 순서·누락 정보·안내·목록 레이아웃 준비. 목록 화면에는 아직 연결하지 않았다.

### 당시 남은 부분

- `CR-008-POKEDEX-PUBLIC-API`는 사용자 답변 대기다. `src/features/pokedex/index.ts`는 수정하지 않았다.
- 공개 API 승인 후 기존 `PokemonCard`, `useSearchIndex`로 `FavoritesPage`를 연결하고 빈 목록·정보 로딩·오류·재시도 화면을 검증해야 한다.
- 현재 `FavoritesPage.tsx`는 기존 자리표시 화면이며 FR-22 및 목록 전체 인수 조건은 아직 완료하지 않았다.

### 실행한 검증

| 명령·절차 | 결과 |
|---|---|
| favorites 단위·통합 테스트 초기 실행 | 4개 파일·23개 통과 |
| `npm run lint` | 성공. 모듈 경계 검사 포함 |
| `tsc -b` | 성공 |
| `npm test` | 최종 24개 파일·148개 통과. 목록 연결 후 추가 재검증 필요 |
| `npm run build` | 성공. 타입 검사 포함. 688.26 kB 청크 크기 경고 있음 |
| `node node_modules/playwright/cli.js test tests/e2e/favorites/favorites.spec.ts tests/e2e/battle-tools/smogon.spec.ts --workers=1 --reporter=line` | 7개 통과: favorites 3개(저장·새로고침·메가 종 단위 저장, 다른 탭 동기화, 저장소 접근 차단), TASK-007 회귀 4개 |
| `git diff --check` | 성공 |
| 기존 변경 보존·범위 검사 | 작업 전 19개 파일의 해시 불변 확인. TASK-008 변경 14개 파일 모두 favorites 소스·테스트 범위 이내 |

검증은 기존 Node 런타임과 npm scripts로 수행했다. 브라우저 테스트는 fixture를 사용하며 사용자 브라우저의 실제 저장 데이터는 변경하지 않았다. 임시 검증 서버는 종료했고 사용자용 개발 서버는 유지한다.

이 단계는 저장·버튼 부분의 자체 검증 결과이며 TASK-008 전체 완료 또는 독립 QA PASS가 아니다. 정식 `docs/TASKS.md` 상태·정책 문서·공통 설정·타인 영역을 수정하지 않았고 커밋·푸시·PR·병합·배포도 수행하지 않았다.

## 목록 화면 연결 — 2026-11-04

- 작업 전 `git pull --ff-only origin develop`: Already up to date.
- 범위: 기존 도감 카드·검색 인덱스 훅의 공개 export 두 줄, favorites 화면·해당 테스트·이 작업 기록.
- 인수 조건: 저장 순서에 따른 카드 표시와 해제, 새로고침 유지, 빈 목록·도감 이동, 인덱스 로딩·오류·재시도, 누락 ID의 해제 수단, 손상·차단된 저장소 안내, 모바일·키보드 조작을 구현·검증한다.
- 테스트 변경 요청 `CR-008-TESTS`의 기존 범위 안에서 `FavoritesPage` 테스트를 보강한다. 다른 기능의 테스트·설정은 변경하지 않는다.
- 구현 전 기존 변경 33개 파일의 해시를 확인했으며 이번 범위 외 파일은 보존한다.

### 이번에 변경한 파일

| 파일 | 변경 내용 |
|---|---|
| `src/features/pokedex/index.ts` | 기존 `PokemonCard`, `useSearchIndex`의 공개 export 두 줄 추가. 내부 구현 변경 없음 |
| `src/features/favorites/pages/FavoritesPage.tsx` | 저장 순서대로 기존 도감 카드 표시, 즉시 해제, 빈 목록·도감 링크, 조회 로딩·오류·재시도, 누락 정보의 번호별 상세 이동·해제, 저장소 안내·재읽기 연결 |
| `tests/unit/favorites/FavoritesPage.test.tsx` | 빈 목록·이동 링크와 불필요한 조회 요청 방지 검증 |
| `tests/integration/favorites/FavoritesPage.test.tsx` | 목록 순서·해제·로딩·재시도·누락 정보·손상/버전·잘못된 ID·저장소 차단/쓰기 실패 복구 9개 검증 |
| `tests/e2e/favorites/favorites.spec.ts` | 실제 화면 목록·캐시 재사용·새로고침·해제·손상/버전 복구·조회 오류·모바일/키보드 검증 보강 |
| `src/features/favorites/TASK-008.md` | 범위와 변경 요청 적용 근거, 인수 조건, 실행 결과 기록 |

기존 저장 모델·구독·버튼·안내·CSS를 재사용했다. 추가 패키지·자체 백엔드·외부 데이터 출처 변경은 없다.

### 요구사항과 검증 연결

| 기준 | 구현·증거 |
|---|---|
| FR-19·20 / TC-07 | 도감·상세에서 종 단위 저장, 즐겨찾기 목록 표시·즉시 해제, 마지막 해제 후 빈 목록 |
| FR-21·DR-07·ADR-012 / TC-07 | 기존 버전 1 저장 스키마·ID 범위·중복 제거, 새로고침·탭 간 상태 유지, 메가 폼도 종 ID만 저장 |
| FR-22·DESIGN §2.3 / TC-07·09 | 도감과 같은 `PokemonCard`·검색 인덱스 캐시 사용, 저장 순서 표시, 빈 목록·도감 이동, 로딩·오류·재시도·누락 정보 처리 |
| NFR-01·08 / TC-08 | 390×844 모바일 화면 넘침 없음, 별 버튼 Space 조작으로 해제, 상세 이동 방지 |
| NFR-02~04·07 / TC-09 | 손상/버전 불일치 안내, 읽기만으로 덮어쓰기 방지, 저장소 접근 차단·쓰기 실패 시 기존 데이터/탐색 유지 및 재읽기 |

### 실행 결과 — 2026-11-04

기존 Node 런타임으로 아래 npm scripts/CLI를 실행했다.

| 명령·절차 | 결과 |
|---|---|
| `git pull --ff-only origin develop` | 성공, Already up to date |
| `node node_modules/vitest/vitest.mjs run tests/unit/favorites tests/integration/favorites` | 6개 파일·34개 통과 |
| `npm run lint` | 성공, 모듈 경계 검사 통과 |
| `npm run typecheck` | 성공 (`tsc -b`) |
| `npm test` | 전체 25개 파일·157개 통과 |
| `npm run build` | 성공. JS 청크 690.48 kB로 500 kB 초과 경고 있음 |
| `node node_modules/playwright/cli.js test tests/e2e/favorites/favorites.spec.ts tests/e2e/battle-tools/smogon.spec.ts --workers=1 --reporter=line` | 12개 통과: favorites 8개 + TASK-007 회귀 4개 |
| 모바일 스크린샷 확인 | 테스트 산출물 `test-results/favorites-favorites-모바일에서-카드가-넘치지-않고-키보드로-해제할-수-있다-TC-07·08--chromium/favorites-mobile.png` 확인. 카드·별 버튼·이름·타입·이동 링크 표시, 가로 넘침 없음. 이미지는 테스트 fixture로 대체 |
| `git diff --check` | 성공 |
| SHA-256 변경 범위 확인 | 이번 변경 6개 파일은 위 표와 일치. 범위 밖 기존 변경 19개 파일의 해시 불변, 범위 밖 신규 변경 없음. 공개 API diff는 export 두 줄뿐 |
| 개발 서버 확인 | `http://127.0.0.1:5174/pokefile/` HTTP 200. 즐겨찾기 주소: `http://127.0.0.1:5174/pokefile/#/favorites` |

브라우저 검증은 별도 Chromium 컨텍스트와 고정 fixture를 사용했다. 사용자 브라우저의 저장 데이터는 변경하지 않았으며 임시 preview 서버는 종료했다. 사용자용 개발 서버는 유지한다.

### 목록 구현 직후 상태와 미검증 항목

- TASK-008의 남은 목록 연결을 구현했고 이번 범위의 자체 검증은 통과했다. 검증 실패를 PASS로 처리한 항목은 없다.
- 독립 QA, 사람 결과 승인, PR/병합은 아직 수행하지 않았다. 전체 DONE 또는 독립 QA PASS로 표시하지 않는다.
- 운영 데이터에 대한 실제 외부 요청과 Chromium 이외 브라우저 조합은 이번 자동 검증 범위에 포함하지 않았다.
- 정식 `docs/TASKS.md` 상태·명세·정책·공통 설정은 변경하지 않았다. 커밋·푸시·PR 생성·병합·배포도 수행하지 않았다.

## 커밋·푸시·PR 제출 — 2026-11-04

- 사용자 후속 지시 `git에 푸시하고 pr 로 같이해줘`에 따라 기존 구현과 통합 QA 보고서를 커밋·푸시하고 Draft PR을 생성했다.
- 공통 선행 커밋: `aaabf6654f333d7242878857ae65963bcaa24691`. [PR #3](https://github.com/semicolon213/pokefile/pull/3): 메가스톤 공통 대응표·공개 export·단위 테스트 → `develop`.
- 기능 구현 커밋: `d59ae2c32859b9ba1eb4646c2a4469848888dec4`. [PR #4](https://github.com/semicolon213/pokefile/pull/4): TASK-007·008 구현·테스트·통합 QA 보고서 → 공통 선행 브랜치.
- #3이 develop에 먼저 병합된 뒤 #4의 base를 develop으로 변경해야 한다. 두 PR 모두 Draft이며 병합·배포는 수행하지 않았다.
- 통합 [QA 보고서](../../../docs/qa/QA_TASK-007-008.md)에 자체 검증 결과와 D-008-01(즐겨찾기 해제 후 키보드 포커스 관리 개선)을 기록했다. 독립 QA·사람 승인·정식 DONE 처리는 대기 상태다.
- 제출 정보 갱신은 이 기록과 QA 보고서에 한정하며 제품 코드·테스트·정책 문서는 변경하지 않는다. 최신 CI 결과는 각 PR의 Checks에서 확인한다.
