# TASK-028 — 움직임 줄이기에서 선택 폼 유지

- issue: https://github.com/semicolon213/pokefile/issues/49
- owner: 성윤우 (@yoonwoo2002)
- implementer_tool: Codex
- status: QA_REVIEW
- requirements: FR-11, FR-23, NFR-08, ADR-016, DESIGN §2.2·3.3
- tests: TC-04, TC-08, TC-11
- authorization: 사용자 #49 구현·PR 생성 지시 및 사전 확정한 이미지 정책
- base: develop `4df19f1903d964efd935772d65d3a6c86a6703fa` (PR #50 포함)

## 허용 경로
- `src/features/battle-tools/**`
- `tests/unit/battle-tools/**`
- `tests/integration/battle-tools/**`
- `tests/e2e/battle-tools/**`
- `src/features/pokemon-detail/model/detail.ts`
- `src/features/pokemon-detail/components/BasicInfoSection.tsx`
- `tests/unit/pokemon-detail/detail.test.ts`
- `tests/integration/pokemon-detail/PokemonDetailPage.test.tsx`

상세 연결 2개 파일과 계약 테스트는 [CHANGE REQUEST](https://github.com/semicolon213/pokefile/issues/49#issuecomment-7150622824)를 먼저 남긴 뒤 수정했다. 이후 PR #50이 병합되어 [보완 요청](https://github.com/semicolon213/pokefile/issues/49#issuecomment-7150909784)에 상세 회귀 테스트 경로를 추가했다. 사용자 구현 지시 범위의 연결 변경이며 PR에서 상세 담당 임지섭의 검토를 요청한다. 다른 상세 로직, shared/app, package/lockfile, 공통 설정, 정식 명세 문서는 수정하지 않는다. 다른 작업의 수정 파일은 별도 작업 트리로 보존한다.

## 인수 조건
- OFF: 선택 폼 GIF → PNG → HOME. 선택 폼 URL이 있지만 모두 로딩에 실패하면 이미지 없음으로 안내한다(PR #50의 결정 유지).
- ON: 같은 폼 PNG → HOME → GIF의 기본/첫 프레임을 PNG로 변환해 표시한다. 변환할 수 없으면 정적 이미지 안내를 표시하며 애니메이션·다른 폼으로 대체하지 않는다.
- 선택 폼의 URL 자체가 없을 때만 기본 폼 후보를 사용하고, 로드 성공 후 ‘기본 모습으로 표시 중’이라고 알린다.
- 이로치 후보는 일반·기본 폼 후보와 섞지 않는다.
- 페이지를 연 상태에서 움직임 설정을 바꿔도 즉시 반영하고, 이전 비동기 이미지 작업 결과를 적용하지 않는다.
- GIF 전용 조건은 테스트 데이터임을 기록하고 실제 데이터 결과와 구분한다.
- 관련 테스트 및 lint/typecheck/test/build를 실행한다. 독립 QA와 사람 승인은 PR에서 별도로 받는다.

## 구현 기준
- PR #50의 후보 배열을 유지하고, 기본 모습 대체 여부만 지역 메타데이터 `isBaseImage`로 별도 전달한다. 외부 URL 구조로 폼을 추정하지 않는다.
- 새 의존성·백엔드 없이 브라우저 `createImageBitmap`과 canvas를 사용한다. HTML 표준에서 애니메이션의 기본 이미지 또는 첫 프레임으로 정한다: https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html
- 명세 문서의 정책 반영은 독립 QA 후 별도 DOC-TASK에서 수행한다. 이번 작업이 QA PASS/DONE이라는 의미는 아니다.

## 검증
구현 AI 자체 검증(2026-11-25). 독립 QA PASS·사람 승인·병합은 아직 아니다.

| 명령·절차 | 결과 |
|---|---|
| `npm run lint` | 성공, 모듈 경계 검사 포함. 범위 밖 `StatFilter.tsx`의 기존 React 경고 1건 |
| `npm run typecheck` | 성공 |
| `npm test` | PR #50 통합 후 48개 파일·385/385 성공 (통합 전 384/384) |
| `npm run build` | 성공, 기존 500kB 청크 경고 |
| `CI=true npx playwright test` | 전체 Chromium E2E 74/74 성공, 신규 5건 포함 |
| GIF 경계 조건 | 테스트 데이터: 빨강/파랑 2프레임 GIF의 첫 프레임을 PNG로 표시하고 픽셀 값까지 확인. 기본 폼 PNG로 바뀌지 않음 |
| 실제 URL을 이용한 경계 조건 | 실제 메가X GIF URL은 유지하고 API 응답의 PNG·HOME만 제거한 테스트 데이터에서 161×107 PNG 변환·폼 유지·움직임 설정 실시간 전환 성공 |
| 실제 데이터 | 코라이돈 `sprinting-build`에서 기본 모습 이미지·대체 안내 표시. PR #44 QA의 실제 326개 폼 조사에서는 GIF만 있는 지원 폼을 찾지 못했음 |
| 모바일·다크 | Chromium 320px(자동 테스트), 390px(실제 URL 확인)에서 화면 캡처 확인. 전자는 합성 GIF, 후자는 API 필드를 바꾼 테스트 데이터와 실제 코라이돈을 구분 |
| `git diff --check` | 성공 |

실행 로그·캡처: 작업 공간 `.qa/task-028/`(커밋하지 않음). 테스트의 `test-results/`도 커밋하지 않는다.

### 실패와 수정
- 최초 표적 테스트 44/45: `beforeEach`가 mock 함수를 반환해 테스트 프레임워크가 cleanup으로 해석하면서 timeout. 반환하지 않도록 수정 후 전체 384개 성공, PR #50 통합 후 385개 성공.
- 최초 build: 앱 TS 설정에는 Node API 타입이 없어 E2E의 `node:buffer` import가 실패. 설정·의존성을 바꾸지 않고 GIF 바이너리 fixture로 분리했다. 이때 첫 E2E도 webServer build 단계에서 실행되지 않았다. 수정 후 typecheck/build와 전체 E2E 74개 성공.
- PR 생성 직전 PR #50 병합을 발견했다. 사전 CHANGE REQUEST를 보완하고 상세 모델·단위 테스트 충돌을 PR #50의 후보 선택 의미를 보존하도록 해결했다. 기본 모습 대체 여부만 별도 전달하며 새로운 상세 회귀 테스트는 GIF 직접 재생 대신 미지원 안내를 확인한다. 최신 develop 기준 lint/typecheck/test/build와 전체 E2E를 재실행했다.

## 남은 확인
- Codex 자체 검증이며 독립 QA·사람 승인을 대체하지 않는다. 상세 연결은 임지섭, 성윤우 담당 코드 교차 확인은 김형균에게 요청한다.
- 실제 휴대전화·Safari·화면 낭독기는 미검증이다. `createImageBitmap` 미지원·CORS/디코딩 실패는 정적 이미지 안내로 처리하고 애니메이션이나 다른 폼으로 대체하지 않는다.
- 실시간 설정 변경은 Chromium의 미디어 설정 에뮬레이션으로 검증했다. 실제 OS 설정 UI를 조작한 검증은 아니다.
- 정식 ADR/DESIGN 문서 반영은 독립 QA 후 별도 DOC-TASK에서 진행한다.
