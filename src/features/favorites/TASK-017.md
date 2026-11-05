# TASK-017 도감 체크리스트

## 독립 QA 재검증 반영·PR 제출 준비 — 2026-11-05

- 사용자 지시: 독립 QA 결과 전달 후 `깃에 푸시 pr`. 기존 TASK-017 허용 범위의 변경을 커밋·푸시하고 develop 대상 초안 PR로 제출한다. 최종 사람 승인·병합·배포는 별도다.
- Claude 독립 QA: **FR-29 기능 PASS, D-A·D-B·T-1 해결 확인 / 전체 인수 FAIL(공통 셸 320px) / 수정 후 외부 API 9개는 당시 BLOCKED**. 클라우드 사본에서 41개 파일·286개 테스트, 기능/즐겨찾기 E2E 16개, 추가 QA 10개 통과. 전체 52개는 42개 통과·공통 셸 1개 및 네트워크 차단 9개 실패였다.
- 원본 독립 QA 보고서 `test-results/qa-task017-recheck/QA_TASK-017_recheck.md`를 내용 변경 없이 `src/features/favorites/QA_TASK-017_recheck.md`로 복사해 제출에 포함한다. SHA-256 `202a714f9d0dbf883b14dc3d831b5b3c708c1dd984d83fbb8a67d3aac019a5c7`. 보고서의 BLOCKED는 작성 당시의 상태이며 아래 Windows 실행 결과와 구분한다. 원본 개별 로그·QA 스크립트·캡처는 로컬 test-results에 보존한다.
- 제출 전 기존 수정 파일 11개를 `test-results/task017-qa-fixes-source-sha256.json`과 비교해 11/11 일치를 확인했다. 그 뒤 제품·테스트는 변경하지 않았고 이 기록 보완 및 QA 보고서 복사만 수행했다.
- `git fetch origin` 후 기반 HEAD와 origin/develop은 모두 `07ec63e`, 앞섬/뒤처짐은 0/0이다. 다른 작업 폴더와 FR-23 PR은 수정하지 않는다.

### 수정 후 외부 API E2E 9개 — Windows 직접 실행

- 위치: `D:/claude/pokefile/task-017-checklist`, Node v24.19.0, Playwright 1.64.1, 기존 Chromium, 네트워크 허용 환경.
- 명령: `node node_modules/playwright/cli.js test tests/e2e/pokemon-detail/detail.spec.ts tests/e2e/app/my-game.spec.ts tests/e2e/compare/compare.spec.ts tests/e2e/type-chart/type-chart.spec.ts --grep-invert '상단 메뉴에서|게임을 바꾼 뒤' --workers=1 --retries=0 --reporter=line,json --trace=retain-on-failure --output=test-results/task017-external-api-postfix`.
- `CI=1`로 기존 서버를 재사용하지 않고 수정 후 작업 폴더를 새로 빌드했다. 실제 PokéAPI를 호출했으며 응답 fixture나 제품·테스트·설정 변경을 사용하지 않았다.
- 결과: **종료 0, 9개 모두 통과, 34.5초, 재시도 없음**. 상세 5개·내 게임 2개·비교 1개·타입 상성 1개다. 증거: `test-results/task017-external-api-postfix.json`, 같은 이름의 `.log`, 출력 폴더의 `.last-run.json`.
- 이는 Codex의 수정 후 Windows 실행 증거이며 Claude가 직접 실행했다고 표현하지 않는다. 보고서에서 네트워크로 미검증이던 해당 9개에 대한 추가 증거를 확보했다. 여러 실행을 합쳐 전체 52개 PASS로 표현하지 않는다.
- 제출 내용은 제품 11개·테스트 3개·작업 기록/독립 QA 보고서 2개, 총 16개 파일이다. 정책 문서·공통 헤더·타인 영역 변경은 없다. 공통 헤더 가로 넘침이 남아 전체 인수 FAIL을 유지하고 초안 PR로 검토한다. 정식 TASK 상태를 변경하지 않는다.

## D-A·D-B·T-1 수정 — 사용자 승인 (2026-11-05)

- 사용자 지시: `D-A·D-B·T-1 도 해결해줘`. TASK-017 / 성윤우 / Codex / FR-29, NFR-03·08 / TC-14·09·08. 기존 allowed_paths와 restricted_paths를 유지한다.
- CR-017-QA-FIX: 허용 테스트 경로에 최초 읽기 차단 시 포획 여부·필터·결과 표시, 전체 손상/미지원 버전과 일부 항목 제외 구분, 원본 보존·명시적 초기화·취소·동시 변경·저장 실패, 목록 재시도 중 로딩 회귀 검증을 추가한다.
- D-A: 마지막으로 읽은 포획 상태가 없으면 확인 불가로 표시하고 포획 상태 필터를 보류한다. 기존에 읽은 기록은 저장 장애 시 유지한다.
- D-B: 전체 손상·미지원 버전은 완성률과 일반 토글 저장을 보류하고 원본을 보존한다. 명시적인 초기화 확인 뒤에만 빈 v1 기록으로 시작한다. 일부 잘못된 항목/중복 제외는 별도 문구로 알린다.
- 저장소 factory는 같은 feature 내부에서 확장하되 기존 즐겨찾기의 키·스키마·손상 처리·다음 저장 동작은 유지한다. 초기화 확인 이후 다른 탭이 기록을 바꿨으면 덮어쓰지 않는다.
- T-1: 목록 재시도 중 로딩 상태와 중복 요청 방지를 제공한다. 공통 헤더·다른 담당 코드·정식 TASK 상태는 변경하지 않는다.
- 검증 계획: 회귀 테스트 실패 재현 → 수정 → 관련 즐겨찾기/체크리스트 테스트, lint/typecheck/test/build, 체크리스트 E2E(기존 공통 셸 실패 포함)를 실행하고 실제 결과를 아래에 기록한다. 독립 QA 재검증·사람 승인은 별도다.

### D-A·D-B·T-1 변경 결과

이번 수정 파일은 11개이며 모두 기존 allowed_paths 안에 있다. 원래 작업 트리의 나머지 변경과 다른 작업 폴더는 보존했다.

| 파일 | 변경 |
|---|---|
| `collection/storage.ts` | 정상·일부 복구·확인 불가를 구분. 전체 손상·미지원 버전·유효 항목이 전혀 없는 손상 배열은 상태/완성률을 확정하지 않음 |
| `collection/store.ts` | 확인 불가 기록의 일반 토글 저장 금지, 전체 손상일 때만 명시적 초기화 허용 |
| `collection/useCollection.ts` | 초기화 확인 대상 snapshot과 초기화 동작 연결 |
| `collection/CollectionToggle.tsx` | 확인 불가일 때 native indeterminate/ARIA mixed·비활성·명시적 접근성 이름 제공. 좁은 카드의 표시 문구는 `확인 불가` |
| `collection/CollectionChecklist.tsx` | 확인 불가의 완성률 숨김·포획 필터 보류·독립적인 도감 검색 유지. 초기화 확인/취소·실패 안내·키보드 포커스 연결. 목록 재시도 로딩과 버튼 비활성화 |
| `model/savedIdsStore.ts` | feature 내부 factory를 typed snapshot과 기능별 쓰기/초기화 조건으로 확장. 확인 시점 snapshot이 바뀌면 초기화 거부, 쓰기 실패 시 원본 보존 |
| `model/store.ts` | 기존 즐겨찾기 snapshot 생성 함수를 명시적으로 전달. 즐겨찾기 손상 처리·다음 저장·키·스키마·메시지는 유지 |
| `tests/unit/favorites/collection.test.ts` | 최초 읽기 실패/이전 기록 보존, 전체 손상 저장 차단·초기화·동시 변경·쓰기 실패·부분 복구 검증 추가 |
| `tests/integration/favorites/CollectionChecklist.test.tsx` | 확인 불가 UI·필터·재읽기, 손상/버전 불일치 원본 보존·초기화 취소/확인·즐겨찾기 독립성, 재시도 로딩 검증 |
| `tests/e2e/favorites/collection.spec.ts` | 실제 Chromium의 D-A 복구, D-B 손상/미지원 버전·초기화 키보드 조작, T-1 지연 응답 검증. 기존 공통 셸 검사는 유지 |
| `TASK-017.md` | 승인·변경 요청·실제 검증 결과 기록 |

### 실제 실행 결과 — Windows / Node v24.19.0 / Playwright 1.64.1

| 명령 | 결과 |
|---|---|
| `node node_modules/vitest/vitest.mjs run tests/unit/favorites/collection.test.ts tests/integration/favorites/CollectionChecklist.test.tsx --testNamePattern 'D-A:|D-B:|T-1:' --reporter=json --outputFile=test-results/task017-qa-fixes-red.json` | 수정 전 종료 1 — 선택한 12개 중 11개 실패·1개 통과, 나머지 23개는 패턴 제외. 실패를 PASS로 집계하지 않음 |
| `npm.cmd test -- tests/unit/favorites tests/integration/favorites --reporter=json --outputFile=test-results/task017-qa-fixes-related.json` | 종료 0 — 관련 테스트 69개 통과 |
| `npm.cmd run lint` | 최종 종료 0 — 모듈 경계 포함 통과 |
| `npm.cmd run typecheck` | 종료 0. 아래 최종 build도 타입 검사를 포함해 통과 |
| `npm.cmd test -- --reporter=json --outputFile=test-results/task017-qa-fixes-full-unit.json` | 최종 종료 0 — 41개 파일·286개 통과, 실패 0. 기존 jsdom `scrollTo()` 미구현 경고 유지 |
| `npm.cmd run build` | 최종 종료 0 — JS 733.80 kB, 기존 500 kB 청크 경고 유지 |
| `node node_modules/playwright/cli.js test tests/e2e/favorites --workers=1 --retries=0 --reporter=line,json --trace=retain-on-failure --output=test-results/task017-qa-fixes-favorites` | 종료 1 — **16개 통과·기존 공통 셸 1개 실패**, 28.7초. 체크리스트 기능 8개와 기존 즐겨찾기 8개는 모두 통과 |
| `node node_modules/playwright/cli.js test tests/e2e/favorites/collection.spec.ts --grep 'D-A:|D-B: 손상된' --workers=1 --retries=0 --reporter=line,json --output=test-results/task017-qa-fixes-mobile-final` | 마지막 카드 표시 문구를 다듬은 후 종료 0 — 320px 라이트·다크/초기화 키보드 2개 통과, 9.5초 |
| `git diff --check`·변경 경로 확인 | 통과. 공통/타인 소스·설정·정책 문서 변경 없음 |

- E2E는 `CI=1`로 기존 서버를 재사용하지 않고 새로 빌드했다. JSON reporter 경로는 각 출력 폴더와 같은 이름의 `.json`, stdout/stderr는 `.log`에 저장했다. 재시도·skip·예상 실패 처리를 적용하지 않았다.
- 유일한 실패: 320px에서 체크리스트 문서 373px, 기존 즐겨찾기 문서 368px. 넘친 요소는 `app-nav`와 마지막 링크다. 기존 CR-017-HEADER는 미해결이며 해당 담당 영역을 수정하지 않았다. E2E 전체 실행을 PASS로 표현하지 않는다.
- 시각 확인: `task017-qa-fixes-mobile-final` 아래 `collection-read-unavailable-mobile-dark.png`, `collection-reset-confirmation-mobile.png`를 직접 열어 확인했다. 체크리스트 본문·필터·확인 버튼·확인 불가 표시가 320px 안에 들어온다. 본문 너비 검사도 통과했다. 문서 전체 헤더 넘침과 구분한다.
- 중간 실패: 최초 관련 실행은 67개 통과·2개 실패였다. 테스트가 재사용하던 저장소에 이미 정상 빈 기록이 읽혀 최초 읽기 실패 조건이 아니었으므로 해당 두 시나리오에 새 store를 연결해 조건을 바로잡았다. 최초 타입 검사는 Testing Library가 지원하지 않는 `exact` 옵션 5곳 때문에 실패했고 제거 후 통과했다.
- 검증 범위: 이번 브라우저 검증은 fixture를 사용하는 즐겨찾기·체크리스트 17개와 최종 표시 확인 2개다. 프로젝트 전체 E2E(추가 후 52개)와 외부 API 9개는 이번 수정 후 재실행하지 않았다. 앞 절의 외부 API 9개 PASS는 수정 전 실행 결과로 유지한다.
- 상태: 요청한 D-A·D-B·T-1 수정 및 자체 검증을 마쳤으며 독립 QA 재검증·사람 승인은 대기한다. 기존 전체 인수 FAIL과 정식 TASK 상태를 변경하지 않았다. 커밋·푸시·PR·병합·배포 없음.

## 외부 API E2E 9개 로컬 재검증 — 2026-11-04

- 사용자 지시: 외부 API E2E 9개 검증 요청, 이후 `그래줘`로 실행 확인.
- 실행 위치: `D:/claude/pokefile/task-017-checklist`, `feat/TASK-017-checklist`, HEAD `07ec63ee96c631e2126e197dcdd243e6583280dc`와 기존 TASK-017 미커밋 작업 트리. Windows, Node v24.19.0, npm 11.17.0, Playwright 1.64.1, 기존 Chromium, 네트워크 허용 환경.
- 대상: 실제 PokéAPI를 사용하는 상세 5개·내 게임 2개·비교 1개·타입 상성 1개. 사전 `--list`로 4개 파일의 9개 선택을 확인했다. 응답을 fixture로 대체하거나 제품·테스트·설정을 수정하지 않았다.
- 명령: `node node_modules/playwright/cli.js test tests/e2e/pokemon-detail/detail.spec.ts tests/e2e/app/my-game.spec.ts tests/e2e/compare/compare.spec.ts tests/e2e/type-chart/type-chart.spec.ts --grep-invert '상단 메뉴에서|게임을 바꾼 뒤' --workers=1 --retries=0 --reporter=line,json --trace=retain-on-failure --output=test-results/task017-external-api-recheck-20261104`.
- 환경 변수: `CI=1`로 기존 preview 서버를 재사용하지 않고 작업 폴더를 새로 빌드했다. JSON reporter 출력 경로는 `test-results/task017-external-api-recheck-20261104.json`으로 지정했다. stdout/stderr는 같은 이름의 `.log`에 저장했다.
- 결과: **종료 0, 9개 모두 통과, 31.0초**. JSON 통계 `expected=9`, `unexpected=0`, `skipped=0`, `flaky=0`; 재시도 0. `.last-run.json`은 `passed`, 실패 목록은 비어 있다. WebServer 빌드도 성공했으며 기존 청크 경고와 색상 환경 변수 경고는 남았다.
- 빌드 식별: `dist/assets/index-BDGD_Ev7.js` SHA-256 `79e4670ac5d5896698bd39567d06add991df321e4289ac8bc35599588173f344`, `index-CUF4HZjT.css` SHA-256 `80e127bbd648ff579bb222eceedbe76d0ebd4c5537c540a46c373fc56410a831`. 사용자 전달 클라우드 QA 보고서의 대표 번들 해시 접두값과 일치한다. 이는 번들 동일성의 근거이며 전체 소스·테스트 동일성의 증명으로 확대하지 않는다.
- 증거: `test-results/task017-external-api-recheck-20261104.log`, `test-results/task017-external-api-recheck-20261104.json`, `test-results/task017-external-api-recheck-20261104/.last-run.json`.
- 판정 범위: 클라우드에서 네트워크로 차단됐던 해당 9개는 이번 Windows 직접 실행에서 통과했다. Codex의 로컬 검증 결과이며 Claude 독립 QA의 직접 실행 기록을 대신 작성한 것은 아니다. 전체 50개 E2E는 이번에 재실행하지 않았고, D-A·D-B·T-1 및 공통 헤더 넘침이 해결됐다는 의미도 아니다. 전체 인수 FAIL·정식 TASK 상태를 변경하지 않았다.
- 변경 파일: 이 작업 기록 1개. 제품·테스트·정책 문서 변경, 스테이징·커밋·푸시·PR·병합·배포 없음.

## 성윤우 허용 범위 내 후속 검증 — 2026-11-04

- 사용자 지시: `내가 가능 범위에서 해결해줘`. 기존 allowed_paths를 유지하며 타인 담당 영역 수정으로 확대하지 않는다.
- 최신 origin/develop은 여전히 07ec63e로 관련 담당자 수정은 추가 반영되지 않았다. 작업 폴더에서 네트워크 허용 git fetch는 Windows 소유권 검사로 거부됐으며, 원래 공유 저장소 폴더에서 fetch에 성공했다. 전역 safe.directory 설정은 변경하지 않았다.
- CR-017-SCOPED-QA: 기존 모바일 테스트에 섞여 있던 FR-29 본문/보기 전환의 너비·키보드·필터 검증과 공통 셸 너비 계약을 별도 테스트로 구성한다. 기존 문서 전체 너비·기존 즐겨찾기 기준 너비 검사는 새 공통 셸 회귀 테스트에 그대로 유지한다. `skip`, 실패 예상 처리, CSS 숨김, 대기시간 증가, 타인 소스 수정으로 통과시키지 않는다.
- 제품 코드 결함으로 확인된 체크리스트 문제는 현재 없다. 이번 변경은 테스트 원인 식별과 담당자 인계 기록이며 공통 헤더·스크롤·상세 실패의 제품 수정 완료를 의미하지 않는다.

### 허용 범위 후속 실행 결과

- 이번 후속 변경 파일은 `tests/e2e/favorites/collection.spec.ts`와 이 기록 2개다. 제품 코드·공통 CSS·스크롤 복원 코드·다른 담당 테스트는 변경하지 않았다.
- 320px 다크 모드에서 포획 체크·해제·포커스 유지, 본문/보기 전환 영역의 실제 너비, 키보드 포획 필터 및 빈 결과·전체 완성률을 검증했다. 성윤우 기능 E2E **6개 모두 통과**했다.
- `npm.cmd run lint`: 종료 0. 모듈 경계 포함 통과.
- `npm.cmd run test:e2e -- tests/e2e/favorites/collection.spec.ts --workers=1 --reporter=line --output=test-results/task017-owned-scope`: 종료 1, **6개 통과·공통 셸 계약 1개 실패**, 15.6초.
- 최초 공통 계약은 두 화면의 문서 너비가 정확히 같다는 진단용 가정에서도 실패했다(374px/368px). 화면 전환 중 실제 너비가 달라질 수 있으므로 요구사항에 맞춰 각 화면이 320px 이내인지 각각 검사하도록 수정했다. 기존 가로 넘침 검사는 유지했으며 soft assertion은 두 실패를 모두 기록하고 테스트 전체를 FAIL로 만든다.
- `npm.cmd run test:e2e -- tests/e2e/favorites/collection.spec.ts --grep=공통 --workers=1 --reporter=line --output=test-results/task017-shared-contract`: 종료 1, 공통 셸 1개 실패. 체크리스트 문서 383px, 기존 즐겨찾기 381px로 둘 다 320px 초과. 넘친 요소는 여전히 `app-nav`와 마지막 메뉴 링크다. WebServer의 타입 검사·빌드는 성공했고 기존 청크 경고가 남았다.
- 현재 E2E는 기능/공통 계약 분리로 총 50개다. 전체 재실행은 이번 후속에서 수행하지 않았다. 직전 전체 실행 결과 44/49를 현재 50개의 전체 결과로 바꾸거나 전체 PASS로 표현하지 않는다.
- 테스트 산출물은 위 `test-results` 경로에 있다. 단위·통합 274개 통과 기록은 제품 코드가 변경되지 않은 이전 실행 결과이며 이번에 재실행하지 않았다.
- 공통 수정은 사용자의 허용 범위 유지 지시에 따라 이번 작업에서 제외한다. 아래 담당자 인계 사항은 제안이며 외부 메시지 전송·이슈 등록·승인 완료를 의미하지 않는다. 독립 QA·사람 승인 전, 전체 결함 해결 또는 DONE 상태가 아니다.

### 담당자 인계

| 담당 | 대상과 재현 | 검토할 조치 |
|---|---|---|
| 김형균 | `src/app/styles/global.css` 모바일 `.app-nav`: 320px에서 양쪽 화면 모두 368~383px까지 넘침 | 기존 CR-017-HEADER의 너비 제한·가로 스크롤안 검토. 메뉴 키보드 접근·다른 화면 회귀도 확인 |
| 김형균 | `tests/e2e/pokedex/list-return.spec.ts:24`: 상세 주소 변경 직후 `scrollY=2075`, 기대 0 | 현재 단발 측정을 `expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)`처럼 실제 초기화 완료를 기다리는 방식으로 재검증. 계속 실패하면 `src/app/layout/AppScrollRestoration.tsx` 조사. 뒤로 가기 복원 조건도 함께 유지 |
| 임지섭 | `tests/e2e/pokemon-detail/detail.spec.ts:21·27·41`: 기본 타입·출현 장소·알로라 타입 표시 대기 중 실패 | `hooks/useDetailQueries.ts`와 API 요청의 응답/오류/완료 시각 확인. UI fixture 검증과 실제 API 검증을 구분하고, 원인 확인 후 담당 범위에서 수정. 데이터 누락·네트워크 차단·제품 결함 중 어느 것인지 현재 확정하지 않음 |

## 전체 E2E 재실행 — 사용자 요청 (2026-11-04)

- 명령: `npm.cmd run test:e2e -- --workers=1 --reporter=line --output=test-results/task017-full-rerun`
- 위치/브랜치: `D:/claude/pokefile/task-017-checklist` / `feat/TASK-017-checklist`. 네트워크 허용 환경, 기존 Chromium, 1 worker. 제품 코드·테스트 수정 없이 실행했으며 이 기록만 갱신했다.
- 결과: **종료 1, 44개 통과·5개 실패, 1.3분**. 전체 PASS가 아니다.
- 실패 1: `tests/e2e/favorites/collection.spec.ts:81` — 320px 화면의 문서 너비 368px. `app-nav`와 마지막 링크만 넘쳤고 기존 `/favorites`에서도 같은 너비를 확인했다.
- 실패 2: `tests/e2e/pokedex/list-return.spec.ts:17` — 목록에서 상세 진입 직후 기대한 `scrollY=0` 대신 `2075`. 원인은 미확정이며 해당 담당 코드는 수정하지 않았다.
- 실패 3~5: `tests/e2e/pokemon-detail/detail.spec.ts:21`, `:27`, `:41` — 잘못된 폼 값의 기본 비행 타입, 레드 출현 장소, 알로라 라이츄의 에스퍼 타입 표시를 기다리다 실패. 캡처에서 데이터 로딩 상태가 확인된다. 외부 API 또는 타이밍 등 원인은 확정하지 않았다.
- 산출물: `test-results/task017-full-rerun/` 아래 `.last-run.json`, 각 실패의 `error-context.md`, 모바일 스크린샷. 초기 전체 결과·별도 상세 재검증 PASS와 구분한다.
- 남은 항목: 공통 헤더 변경 범위 확인, 스크롤·상세 데이터 표시 실패 원인 조사, 독립 QA·사람 승인. 커밋·푸시·배포 없음.

- 사용자 승인: 성윤우 담당 TASK-017 진행 요청(2026-11-04).
- owner: 성윤우 / implementer: Codex / requirements: FR-29, NFR-01·03·08 / tests: TC-14·08·09.
- 기반: 최신 `origin/develop` 07ec63e. `feat/TASK-017-checklist`, 별도 작업 폴더. TASK-011 미커밋 파일 보존.
- allowed_paths: `src/features/favorites/**`, `tests/unit/favorites/**`, `tests/integration/favorites/**`, `tests/e2e/favorites/**`.
- restricted_paths: 위 경로 외 전체. `shared/config`·공통 타입·라우터·헤더·상세·다른 feature·패키지·정책 문서 변경 없음.

## 인수 조건과 구현 선택

1. 전국도감 종 단위 포획 체크·해제와 새로고침 후 유지. 폼은 별도 종으로 세지 않는다.
2. 전체·세대별 완료 수/전체 수/비율 표시. 세대와 유효 번호는 공통 설정을 사용하고 분모는 정적 검색 인덱스에서 계산한다. 검색·표시 필터는 완성률을 바꾸지 않는다.
3. 즐겨찾기 구조를 재사용하되 `pokefile:collection`, `{"version":1,"ids":[...]}`로 분리한다. 손상·버전 불일치·중복·잘못된 번호 안내, 읽기만으로 원본 덮어쓰기 금지, 읽기/쓰기 차단 시 기록 보존·조작 비활성·재읽기, 탭 간 동기화.
4. 기존 `/favorites` 안에 `?view=collection` 진입점과 보기 전환을 둔다. 새 라우트·타인 화면 연결은 추가하지 않는다. 이름/번호 검색·세대·잡음/미포획 필터와 추가 표시를 제공한다.
5. 키보드·320px 모바일·라이트/다크 접근성, 로딩·조회 실패·재시도·결과 없음 처리.
6. 관련 단위·통합·E2E, lint/typecheck/test/build와 변경 경로 검증. 독립 QA·사람 승인 전 DONE으로 처리하지 않는다.

## 변경 요청 (구현 전 기록)

- CR-017-STORE: 같은 feature의 즐겨찾기 저장소에서 ID 배열 영속화 로직을 내부 공용 factory로 추출한다. 기존 즐겨찾기 공개 계약·키·메시지·스키마는 유지하며 체크리스트가 factory를 재사용한다. 기존 즐겨찾기 테스트를 회귀 검증한다.
- CR-017-TESTS: 위 허용 테스트 경로에 저장 오류·계산·검색과 필터·재읽기·새로고침·탭 동기화·모바일·키보드·기존 즐겨찾기 독립성을 검증하는 테스트를 추가한다. 공통 테스트 설정 수정 없음.
- 공통 지원 범위(SCOPE)와 pokedex 공개 API를 읽어 사용한다. 고정 세대 수·최대 번호·세대별 종 수를 새로 하드코딩하지 않는다.

## 실행 결과

### 확인된 범위 밖 문제 — CR-017-HEADER

- 320px에서 공통 `app-nav`와 마지막 메뉴 링크가 오른쪽 368px까지 넘친다. 체크리스트 콘텐츠는 화면 안에 있으며, 공통 셸은 이 작업에서 변경하지 않았다.
- 영향 경로: `src/app/styles/global.css`의 모바일 `.app-nav`. OWNERSHIP §2의 김형균 담당 영역으로 현재 allowed_paths 밖이다.
- 검토할 수정안: 모바일 `.app-nav`에 `min-width: 0; max-width: 100%; overflow-x: auto;`를 적용해 메뉴를 가로 스크롤할 수 있게 하고 페이지 전체 넘침을 막는다. 실제 소스 수정 전 범위 승인 필요. 이 기록은 외부 이슈 등록이나 담당자 승인 완료를 의미하지 않는다.
- 전체 E2E에서 별도로 실제 API를 쓰는 상세 리전폼 테스트(`tests/e2e/pokemon-detail/detail.spec.ts:41`)가 에스퍼 타입을 기다리는 동안 실패했다. 캡처는 로딩 상태이며, 원인은 미확정이다. 타인 담당 소스·테스트는 변경하지 않았다.

## 구현 결과와 변경 파일

- `collection/storage.ts`, `store.ts`, `useCollection.ts`: 즐겨찾기와 독립된 포획 기록. 유효 번호·중복·버전 검증, 같은 문서 구독·탭 간 동기화, 읽기/쓰기 오류와 명시적 재읽기.
- `collection/progress.ts`: 공통 세대/번호 범위와 실제 인덱스의 종을 사용한 전체·세대별 집계. 폼·중복·지원 밖 항목을 중복 집계하지 않는다. 전체 1025종·세대 합계를 실제 인덱스로 검사했다.
- `collection/CollectionChecklist.tsx`, `CollectionChecklist.css`: 전체/세대 진행률, 검색·세대·포획 필터, 48개씩 추가 표시, 조회 오류·재시도·빈 결과·다크 모드. 저장소 차단 시 완성률을 0%로 추정하지 않고 표시를 보류한다.
- `collection/CollectionToggle.tsx`, `index.ts`: native checkbox 공개 컴포넌트와 공개 체크리스트. 카드 상세 링크·즐겨찾기 동작과 포획 토글을 분리한다.
- `pages/FavoritesPage.tsx`: 기존 경로의 `view=collection` 보기 전환. 기존 게임 등 쿼리 유지. 기본 즐겨찾기 화면의 계약은 유지한다.
- `model/savedIdsStore.ts`, `model/store.ts`: 기존 ID 영속화 factory를 추출해 두 저장소가 공유한다. 즐겨찾기 키·스키마·메시지는 유지한다.
- `tests/unit/favorites/collection.test.ts`, `tests/integration/favorites/CollectionChecklist.test.tsx`, `tests/e2e/favorites/collection.spec.ts`: 새 단위·통합 테스트 23개와 E2E 6개.
- 이 작업 기록을 포함해 **15개 파일**, 모두 allowed_paths 안에 있다. 공통·상세·다른 담당 feature·정책 문서 변경 없음.

## 실행 결과 — 2026-11-04

작업 위치 `D:/claude/pokefile/task-017-checklist`, 브랜치 `feat/TASK-017-checklist`, 기반 07ec63e. 기존 설치 의존성은 같은 lockfile임을 확인하고 무시 대상 `node_modules` junction으로 재사용했다. 설치·패키지 변경 없음.

| 명령 | 결과 |
|---|---|
| `git fetch origin develop` | 최초 샌드박스 네트워크 실패, 네트워크 허용 후 성공. 기존 TASK-011 작업 폴더는 수정하지 않음 |
| `npm.cmd test -- tests/unit/favorites tests/integration/favorites` | 종료 0 — 초기 관련 8개 파일·55개 통과. 이후 읽기 차단·추가 표시 2개를 더해 아래 전체 검증에 포함 |
| `npm.cmd run lint` | 종료 0 — 모듈 경계 포함 통과 |
| `npm.cmd run typecheck` | 종료 0 |
| `npm.cmd test` | 종료 0 — 41개 파일·274개 통과. 기존 jsdom `scrollTo()` 미구현 경고는 유지 |
| `npm.cmd run build` | 종료 0 — JS 731.39 kB, 기존 500 kB 청크 경고 유지 |
| `npm.cmd run test:e2e -- --workers=1 --reporter=line --output=test-results/task017-full` | 종료 1 — **47/49 통과**, 체크리스트 5/6. 실패는 위 320px 공통 헤더 및 실제 API 상세 리전폼 테스트 |
| `npm.cmd run test:e2e -- tests/e2e/favorites/collection.spec.ts --grep=320px --workers=1 --reporter=line --output=test-results/task017-mobile-recheck` | 종료 1 — 키보드 체크·해제·포커스는 통과한 뒤 전체 너비 검사에서 실패. 체크리스트와 기존 `/favorites` 둘 다 368px임을 확인. 넘친 요소는 `app-nav`·마지막 링크뿐 |
| `npm.cmd run test:e2e -- tests/e2e/pokemon-detail/detail.spec.ts --grep=리전폼 --workers=1 --reporter=line --output=test-results/task017-detail-recheck` | 종료 0 — 1개 통과(10.5초). 최초 전체 실패를 지우거나 전체 PASS로 합산하지 않음 |
| `git diff --check`·변경 경로 확인 | 통과. 15개 파일 모두 성윤우 허용 범위, 삭제 없음 |
| 개발 서버 | `npm.cmd run dev -- --host 127.0.0.1 --port 5177 --strictPort`, HTTP 200. `http://127.0.0.1:5177/pokefile/#/favorites?view=collection` |

### 실패·제한·인계

- 최초 대상 E2E는 `getByLabel`이 select의 옵션 문구까지 포함해 일치하지 않은 문제와 공통 헤더 넘침으로 실패했다. 접근성 트리에서 실제 이름을 확인한 뒤 `combobox` role로 조회하도록 테스트를 수정했다. 제품 레이블을 임의로 바꾸거나 가로 넘침 검사를 제거하지 않았다. 해당 초기 실행은 종료 처리 대기 중 중단했으며 PASS로 집계하지 않는다.
- 실패 항목을 한 번에 재검증하려던 npm 명령은 Windows shell에서 grep의 `|`가 명령 파이프로 해석돼 시작하지 못했다. 이후 `--grep=320px`, `--grep=리전폼`으로 나눠 위 결과를 얻었다.
- 시각 확인: `test-results/task017-full/favorites-collection-320px-e656e-드-체크와-해제·필터가-가능하다-TC-08·14--chromium/collection-mobile-dark.png`. 카드·체크박스·필터·진행률은 화면 안에 있고, 공통 헤더만 넘친다. 이미지와 인덱스는 E2E fixture다.
- 공유 CSS 수정은 범위 확인 요청 상태다. 실제 공통/상세 코드·테스트를 수정하거나 타인 담당 결함을 해결했다고 주장하지 않는다.
- 상태: FR-29 구현·단위/통합 자체 검증 통과. 전체 E2E는 PASS 아님. 공통 헤더 범위 확인, 독립 QA·사람 승인 대기. 정식 TASK 상태 변경·스테이징·커밋·푸시·PR·병합·배포 없음.
- 미검증: 독립 QA, 실기기·스크린리더·Chromium 외 브라우저·배포 origin. 기존 TASK-011 미커밋 작업과 별도 작업 폴더를 보존했다.
