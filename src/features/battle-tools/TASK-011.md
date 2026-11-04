# TASK-011 작업 기록

## PR #31 반영 및 호환성 독립 QA 결과 — 2026-11-05

- 사용자 승인: `pr 31 반영해서 수정해줘`. 검증한 호환성 수정안을 기존 PR #31의 소스 브랜치에 커밋·푸시하고 PR 설명을 갱신한다. PR은 초안으로 유지하며 병합·배포·정식 TASK 상태 변경은 포함하지 않는다.
- 기준: develop `07ec63e`, 기존 PR head `a41d08e`. 기존 PR 이력을 유지하면서 develop 기반 수정안을 반영한다. 제품·테스트 소스는 아래 자체 검증 및 사용자가 전달한 최신 독립 QA 대상과 같다.
- 사용자 전달 Claude 독립 QA: **FR-23 기능 PASS / 전체 통합 E2E·CI FAIL**. 최신 파일 226개를 새 Linux 사본으로 복사했고 Windows dist와 사본 빌드의 JS·CSS가 바이트 단위로 같았다고 보고했다. 실제 Windows 작업 폴더에서 명령을 실행한 보고는 아니며 git 상태도 직접 확인하지 못했다.
- 독립 QA 사본: lint·typecheck·build 성공, 43개 파일·294개 테스트 통과. 미디어 E2E는 5개 통과·2개 실패, 전체 E2E는 39개 통과·11개 실패(공통 메뉴 가로 넘침 2개 + 외부 API 차단 9개). 기본 headless-shell 대신 브라우저 경로만 지정한 QA 설정을 사용했다.
- 독립 시나리오 Q1~Q7 통과: 실제 GIF·ogg 바이트 주입으로 D-1 포커스 복구·자동 재생 방지, D-2 메가X·Y 원본 표시와 로드 후 영역 축소 시 같은 모드 PNG/정보 없음 전환, 일반화된 폼·지연 응답·오류 격리·캐시를 확인했다. Minor 이상 새 결함은 없다고 보고했다.
- 공통 메뉴 `NAV.app-nav`가 320px 화면에서 문서 너비를 384px로 늘리는 문제는 김형균 담당이다. 미디어 오른쪽 끝은 304px로 화면 안에 있으며 공통 CSS·가로 넘침 테스트 기준은 수정하지 않는다. 미디어 E2E 실패 2건은 해소되지 않았다.
- 잔여 사항: 미사용 FR-24 helper와 기존 Trivial 항목은 후속으로 남긴다. 상세 이미지 영역 연결은 임지섭 확인 대상이다. 외부 미디어 서버에 대한 브라우저 직접 접근, 이번 수정분의 스피커 청취, 실제 거다이맥스 미디어 가용성, 다른 브라우저·실기기·스크린리더는 미검증이다.
- 독립 QA 원본·로그·스크린샷은 클라우드 `/mnt/user-data/outputs/qa-task011-compat/`에 있다는 사용자 보고에 근거한다. 이 저장소에 원본 산출물을 복사하거나 첨부한 것은 아니다. 푸시 후 새 PR CI 결과는 GitHub Actions에서 별도로 확인한다.

## PR #31 최신 develop 호환성 수정 — 2026-11-04

- 사용자 확인: `feat(TASK-011): 이로치·울음소리 및 포커스 복구 (FR-23) 도 수정해야 하는거 아니야`.
- CI 근거: PR #31, head a41d08e, base develop. Verify 실행 41846128882에서 `fitPixelArt`·`FORM_KEYS` 공개 export 제거로 타입 검사 실패, 같은 원인으로 E2E용 빌드가 시작되지 않았다. 과거 브랜치 자체 E2E 7개 통과는 최신 develop 통합 성공을 뜻하지 않는다.
- 별도 `fix/TASK-011-develop-compat` 작업 폴더를 origin/develop 07ec63e에서 만들고 제출 커밋 변경을 커밋 없이 적용했다. 기존 제출 브랜치·별도 공개 컴포넌트 작업 폴더·TASK-017을 보존한다.
- owner 성윤우 / FR-23 / TC-08·09·11. allowed_paths: `src/features/battle-tools/**`, `tests/unit/battle-tools/**`, `tests/integration/battle-tools/**`, `tests/e2e/battle-tools/**`. 그 외는 restricted_paths.
- CR-011-COMPAT-TESTS: 공통 설정의 최대 번호·일반화된 폼 키, v2 검색 인덱스, 공개 미디어 컴포넌트 계약에 맞는 회귀 테스트를 허용된 경로에서 갱신한다. 공통 코드·상세 연결 파일·정책 문서를 과거 계약으로 되돌리지 않는다.
- 공통 DESIGN의 정수배 확대와 기존 D-2의 상자 크기 초과 대체 조건은 feature 내부에서 유지하며 공개 `fitSprite`를 사용한다.
- 수정 후 전체 정적 검증·테스트·관련 E2E와 독립 QA 재검증 필요. PR 코드 푸시·제목/본문 변경·병합은 아직 수행하지 않는다.

### 호환성 수정 내용

- `components/PokemonMedia.tsx`: 제거된 `fitPixelArt` import를 `fitSprite`로 전환. 기존 D-2 조건(원본이 실제 가용 상자보다 크면 같은 모드 PNG 대체)을 feature 내부에서 검사해 유지한다. 공통 이미지 유틸을 과거 구현으로 되돌리지 않는다.
- `model/tools.ts`: 제거된 `FORM_KEYS` 대신 공통 `parseFormKey`와 지원 범위의 `isPokemonId`를 사용한다. 기본 폼의 번호 조회와 종/폼 응답 일치 검사를 유지한다.
- `components/PokemonToolsSection.tsx`, `index.ts`: `PokemonMediaSection`과 props 타입을 공개한다. 기존 호출 계약과 동작을 보존하며 메가 외 폼 표기는 공통 `formLabel` 및 인덱스 metadata를 사용한다. 상세 담당 파일은 수정하지 않는다.
- `hooks/usePokemonTools.ts`: 이미지·음원 조회의 Query Key에서 고정 gen6 차원을 제거한다. 실전 세팅 세대 선택 TASK-025는 변경하지 않는다.
- 통합·E2E fixture는 v2 인덱스와 forms 객체 배열로 갱신한다. 지원 밖 번호 테스트는 공통 최대 번호 기준으로 바꾸고 리전폼/거다이맥스 리소스·잘못된 폼 키 검증을 추가한다. 통합 테스트 15개는 공개 컴포넌트를 통해 실행한다.
- 이번 호환성 수정은 위 제품 5개 파일·테스트 4개 파일·이 기록, 총 10개 파일에 적용했다. develop 대비 전체 변경은 제출 커밋을 포함해 17개이며 모두 battle-tools 허용 경로다.

### 실행 결과와 남은 검증

| 명령 | 결과 |
|---|---|
| `npm.cmd run lint` | 종료 0 — 모듈 경계 검사 포함 통과 |
| `npm.cmd run typecheck` | 종료 0 — CI의 두 export 오류 해소 |
| `npm.cmd test` | 종료 0 — 43개 파일·294개 통과, 기존 jsdom scrollTo 미구현 경고 유지 |
| `npm.cmd test -- tests/integration/battle-tools/PokemonToolsSection.test.tsx` | 종료 0 — 최종 공개 API 경유 15개 통과 |
| `npm.cmd run build` | 종료 0 — JS 732.32 kB, 기존 500 kB 청크 경고 유지 |
| `npm.cmd run test:e2e -- tests/e2e/battle-tools/tools.spec.ts --workers=1 --reporter=line --output=test-results/task011-develop-compat` | 종료 1 — **5개 통과·2개 실패**(21.4초). 빌드 실패로 시작하지 못하던 상태는 해소됐지만 전체 PASS가 아님 |
| `git diff HEAD --check`, 변경 경로 확인 | 통과 — 모두 battle-tools 소유 경로 |

- E2E 실패 두 건은 161×107·201×166 이미지 시나리오의 320px 문서 전체 가로 넘침 검사다. 각 시나리오의 이미지 URL·원본 너비·높이 검사는 통과한 뒤 공통 헤더에서 실패했다. 그 뒤에 배치된 가용 영역 축소 검사는 이 최신 기반 실행에서 도달하지 못했으므로 통과로 집계하지 않는다. 기존 TASK-017에서도 확인된 공통 app-nav 문제이며 공통 CSS는 수정하지 않았다.
- 이전 제출본(a41d08e)의 E2E 7개 통과와 이번 develop 통합 5/7 결과를 구분한다. 전체 E2E는 이번 호환성 작업에서 실행하지 않았다. 이 수정분은 이전 독립 QA에 포함되지 않으므로 재검증이 필요하다.
- 기존 [PR #31](https://github.com/semicolon213/pokefile/pull/31)은 아직 a41d08e의 초안이고, [기존 CI](https://github.com/semicolon213/pokefile/actions/runs/41846128882)는 실패 상태다. 이번 로컬 수정은 아직 커밋·푸시·원격 PR 변경하지 않았다. 상세 이미지 영역 연결은 임지섭 확인 대상이며, 별도 미커밋 공개 컴포넌트 작업을 병합하거나 검증한 것으로 표현하지 않는다.
- 작업 폴더: `D:/claude/pokefile/task-011-integration`, 브랜치 `fix/TASK-011-develop-compat`. 원래 제출 브랜치의 커밋과 미추적 파일, 별도 TASK-011-media·TASK-017 작업은 보존한다.

## PR 제출 준비 — 2026-11-04

- 사용자 지시: `깃에 푸시랑 pr 올려줘`, 이후 `pr애 담아줘`. 현재 폴더의 QA 대상 구현을 보존해 `feat/TASK-011-battle-tools`에서 `develop` 대상 초안 PR로 제출한다. 병합·배포 승인은 포함하지 않는다.
- 독립 QA: 사용자가 전달한 Claude 후속 보고에서 FR-23 독립 QA 완료를 확인했다. 상세 E2E 4개는 해당 QA 환경의 네트워크 차단으로 직접 확인하지 못했으며 PR CI 확인을 남겼다. 원본 보고서 파일은 이 저장소에 추가하지 않았다.
- 수동 검증: 사용자가 실제 소리 청취와 접기·폼 변경·목록 이동 시 재생 중지를 확인했다. 최종 기능 오너 승인은 별도다.
- 제출 범위: FR-23 미디어 UI·상세 연결·회귀 테스트와 기존 adapter 의존 파일. 미연결 `StatComparison.tsx`, `TypeMatchups.tsx`는 로컬에 보존하고 제출에서 제외한다. 공통 파일·타인 담당 파일·정식 TASK 상태는 변경하지 않는다.
- 변경 요청 CR-011-DEVELOP-INTEGRATION: 현재 검증 기준은 `b862650`이고 원격 `develop`은 `07ec63e`다. 최신 공통 API는 `fitPixelArt` 대신 `fitSprite`를 공개하고 `FORM_KEYS`를 제거했으며 지원 범위·폼 키와 검색 인덱스 계약도 바뀌었다. 따라서 기존 QA 결과를 최신 develop 통합 결과로 간주할 수 없다. 통합 전까지 초안 상태로 검토하며 공통 계약을 과거 버전으로 되돌리지 않는다.
- 별도 작업 폴더 `D:/claude/pokefile-task011-media`의 최신 API 기반 공개 컴포넌트 구현은 별도 미커밋 작업으로 보존했다. 해당 파일을 이번 제출에 섞거나 덮어쓰지 않았다.
- 이번 제출 전 검증: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`(29개 파일·200개), `npm.cmd run build` 모두 종료 0. 기존 500 kB 청크 경고(JS 699.90 kB)는 유지된다. 이 결과는 현재 브랜치 기준이며 최신 develop과의 통합 검증이 아니다. 전체 E2E는 이번에 재실행하지 않았고 아래의 이전 36개 통과 기록과 구분한다.
- 후속: 기존 Trivial 3건과 필터 E2E 간헐 실패를 미해결로 명시한다. CI·최신 API 통합 확인·최종 사람 승인 전 병합하지 않는다.

## 독립 QA D-1·D-2 보완 — 2026-11-04

- 사용자 승인: `d-1 이랑 d-2 보완해줘`. TASK-011 / 담당 성윤우 / 구현 Codex / FR-23, NFR-01·08 / TC-08·09·11.
- allowed_paths: `src/features/battle-tools/**`, `tests/unit/battle-tools/**`, `tests/integration/battle-tools/**`, `tests/e2e/battle-tools/**`. restricted_paths: 그 외 전체. 기존 미커밋 변경 보존, 정식 TASK 상태·공통 코드·정책·설정 변경 없음.
- CR-011-QA-REGRESSION: 제품 코드 수정 전 D-1의 음원 교체·후보 소진·재시도 포커스와 비조작 상태 포커스 보존, D-2의 161×107·201×166 이미지 및 좁은 화면·크기 초과 대체 경로에 대한 해당 feature 통합·E2E 테스트 추가를 기록한다.
- D-1 인수 조건: 현재 조작 중인 음원의 다음 후보와 재시도 버튼으로 포커스를 이어주고, 재시도 후 음원으로 복귀한다. 다른 곳의 포커스를 가져오거나 자동 재생하지 않고 음원 대체·실패를 알린다.
- D-2 인수 조건: feature 내부 미디어 이미지 상자를 최대 224px로 확장하고 실제 가용 너비에 맞춰 공통 `fitPixelArt`를 사용한다. 보고된 메가X·Y 크기는 정수배(원본 1배 포함)로 표시하며, 화면 축소 시 다시 맞춘다. 가용 상자보다 큰 원본은 같은 모드의 PNG로 대체한다. 공통 DESIGN §3.3의 소수배 축소 금지 규칙은 유지한다.
- 검증 계획: 실패 재현 → 수정 → 관련 통합·브라우저 테스트 → lint/typecheck/test/build·전체 E2E. 독립 QA 결과와 아래 실행 결과는 구분한다.

### D-1·D-2 변경·실행 결과

변경 파일은 아래 5개다. 별도 패키지·설정·공통 코드·타인 담당 파일 변경은 없다.

| 파일 | 변경 |
|---|---|
| `components/PokemonMedia.tsx` | D-1: 조작 중인 음원에서 오류가 나면 다음 음원 또는 재시도 버튼으로 포커스 복원. 재시도 후 음원으로 복귀. `role=status` 안내와 `aria-describedby`, 명시적 키보드 포커스 제공. 다른 곳의 포커스와 수동 재생 원칙 유지. D-2: 실제 가용 너비와 최대 224px에 맞춘 정수배 표시, ResizeObserver로 크기 변화 재계산 |
| `components/PokemonToolsSection.css` | 미디어 이미지 열·상자를 최대 224px로 확장하고 모바일 가용 너비 안에서 표시 |
| `tests/integration/battle-tools/PokemonToolsSection.test.tsx` | D-1 포커스 이동·비조작 포커스 보존, D-2 161×107·201×166 원본 크기와 좁은 상자 대체 검증 5개 추가 |
| `tests/e2e/battle-tools/tools.spec.ts` | 실제 Space·Enter 조작으로 음원 404→대체→404→재시도→재생 확인. PC/320px의 두 이미지 크기와 로드 후 영역 축소 검증. 3개 추가 |
| `TASK-011.md` | 사용자 승인·변경 요청·인수 기준·실행 결과 기록 |

실행 위치: `D:/claude/pokefile/pokefile`, Windows·기존 Node/npm 및 설치된 Chromium. 모두 구현 담당 Codex의 자체 검증이다.

| 명령 | 최종 결과 |
|---|---|
| `npm.cmd test -- tests/integration/battle-tools/PokemonToolsSection.test.tsx` | 종료 0 — 15개 통과 |
| `npm.cmd run lint` | 종료 0 — 모듈 경계 검사 포함 통과 |
| `npm.cmd run typecheck` | 종료 0 |
| `npm.cmd test` | 종료 0 — 29개 파일·200개 통과 |
| `npm.cmd run build` | 종료 0 — JS 699.90 kB, 기존 500 kB 청크 경고 유지 |
| `npm.cmd run test:e2e -- --workers=1 --reporter=line --output=test-results/task011-d1-d2-full` | 종료 0 — 네트워크 허용 환경의 전체 36개 통과(40.5초), 미디어 7개 포함 |

- 실패·수정 이력: 최초 추가 통합 테스트는 12개 통과·3개 실패(D-1 및 두 이미지 크기). 보완 중 한 차례 포커스 테스트 1개가 남아, 음원의 키보드 포커스를 명시하고 `ownerDocument.activeElement`로 현재 조작 대상을 확인한 뒤 15개가 통과했다. 최초 대상 E2E는 두 D-2 시나리오에서 같은 해시로 이동해도 열린 영역이 유지되는 테스트 초기화 문제로 타임아웃했다. PC 확인 후 접고 다음 크기에서 다시 여는 방식으로 테스트를 수정했다. 종료 처리 대기 중인 이 최초 실행은 직접 중단했으며 통과로 집계하지 않았다. 이후 위 전체 E2E는 종료 코드 0으로 완료됐다.
- 시각 확인: `test-results/task011-d1-d2-full/battle-tools-tools-D-2-201-eadb7--화면에서-원본-크기로-표시한다-TC-08·11--chromium/media-201-mobile.png`, 같은 출력 아래 기존 모바일·키보드 시나리오의 `pokemon-media-mobile.png`를 직접 확인했다. 가로 넘침·이미지 축소·조작부 잘림 없음. 161px 시나리오도 별도 PNG 생성.
- 검증 한계: 이미지 크기는 QA가 보고한 161×107·201×166을 재현한 SVG 응답 fixture, 재생은 기존 WAV fixture를 사용했다. 전 종·폼의 외부 GIF/음원 가용성, 실제 스피커 청취, Chromium 외 브라우저·스크린리더는 미검증이다. 상세 E2E 4개는 실제 PokéAPI로 통과했다.
- 기존 필터 E2E는 이번 전체 실행에서 통과했지만 다른 담당 코드를 수정하지 않았으므로 기존 간헐 실패의 원인을 해결한 것으로 주장하지 않는다.
- 상태: D-1·D-2 수정 및 자체 검증 완료. Claude/다른 팀원의 독립 QA 재검증과 사람 승인 대기. 기존 독립 QA의 BLOCKED를 PASS로 변경하거나 정식 TASK를 DONE으로 변경하지 않았다. 스테이징·커밋·푸시·PR·병합·배포 없음.

## 재확인 결과 — 2026-11-04 (이번 요청)

- 요청 시점부터 아래 FR-23 전용 구현과 테스트가 미커밋 상태로 존재했다. 이번에는 소스를 새로 구현하거나 기존 변경을 덮어쓰지 않고 현재 구현을 검토·재실행했다. 변경 파일은 이 작업 기록뿐이다.
- 확인한 기능: 일반/이로치 전환, 같은 모드 GIF→PNG→이미지 없음, 수동 음원 재생, 음원 누락·실패·재시도, 접기·폼 전환·화면 이탈 시 중지, 지연 조회·캐시, 모바일·키보드 조작. 상성·비교는 현재 미디어 화면에 연결되어 있지 않다.
- `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`: 모두 성공. 단위·통합 테스트 29개 파일·195개 통과. 빌드의 기존 500 kB 청크 경고는 남아 있다.
- `npm.cmd run test:e2e -- --workers=1 --reporter=line --output=test-results/task011-recheck`: 미디어 4개를 포함한 29개 통과, 외부 API를 직접 사용하는 상세 4개는 요청 실패. 이후 종료 처리가 남아 전체 성공으로 집계하지 않았다.
- 네트워크 허용 환경에서 `npm.cmd run test:e2e -- --workers=1 --reporter=line --output=test-results/task011-network-recheck`: **32개 통과·1개 실패**. 미디어 4개와 상세 4개 통과. 실패는 `tests/e2e/pokedex/filters.spec.ts:5`의 필터·정렬 URL 보존이며 예상 `type=fairy&gen=6&sort=name`에서 `type=fairy`가 사라졌다.
- 해당 필터 테스트만 `--grep "필터·정렬이 URL에 저장되고" --repeat-each=3 --workers=1 --reporter=line --output=test-results/task011-filter-recheck`로 재실행: **2개 통과·1개 실패**. 간헐적 실패가 재현되어 전체 E2E PASS로 표현하지 않는다. 다른 담당 영역이므로 소스·테스트는 변경하지 않았다.
- 모바일 화면: `test-results/task011-recheck/battle-tools-tools-모바일·키보드-4ee2a-환을-조작하고-가로-넘침이-없다-TC-08·11--chromium/pokemon-media-mobile.png`를 직접 확인했다. 테스트 이미지·WAV fixture 사용, 390×844에서 조작부·포커스·넘침 확인.
- 외부 필드: [PokéAPI 공식 문서](https://pokeapi.co/docs/v2#pokemon)의 `showdown.front_default/front_shiny`, PNG, `cries.latest/legacy` 예시를 재확인했다. 이번에는 전체 종·폼의 실제 파일 가용성이나 스피커 청취를 검증하지 않았다.
- 상태: FR-23 구현 존재·자체 검증 통과, 독립 QA·사람 승인 대기. 정식 TASK 상태는 변경하지 않았다. 커밋·푸시·PR·병합·배포 없음.

## 현재 요청 범위 — 이로치·울음소리만 (2026-11-04)

- 사용자 지시: `TASK-011 이로치·울음소리(하) 만 구현해줘`. 이번 변경은 **FR-23**으로 한정한다. 아래 FR-24·25 구현 기록은 이전 작업 이력이며 이번 인수 범위가 아니다.
- 담당: 성윤우 / 구현: Codex. 기존 `allowed_paths`와 `restricted_paths`를 유지한다.
- CR-011-MEDIA: 기존 battle-tools 진입점을 이로치·울음소리 전용으로 좁히고 관련 통합·E2E 테스트를 FR-23에 맞춘다. 상성·비교의 기존 파일은 보존하며 화면 연결·추가 타입 조회는 제외한다. 공통 파일·상세 담당 파일·패키지는 수정하지 않는다.
- 인수 조건: 기본·지원 메가 폼의 일반/이로치 전환, 같은 모드 GIF→PNG→정보 없음, 사용자 조작으로만 울음소리 재생, 음원 누락·실패·재시도, 접기/폼 변경/화면 이탈 시 재생 중지, 폼 변경 시 이전 미디어 제거, 열 때만 조회·캐시 재사용, 로딩·오류·재시도·키보드·모바일 지원.
- 검증: TEST_PLAN TC-08·09·11, 관련 단위·통합·E2E, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. 결과는 아래에 별도로 기록한다. 독립 QA·사람 승인 전 DONE으로 표시하지 않는다.

### 이번 변경 파일

| 경로 (저장소 기준) | 변경 |
|---|---|
| `src/features/battle-tools/components/PokemonToolsSection.tsx` | 상세 진입점을 미디어 전용으로 좁힘. 상성·비교 컴포넌트 및 타입 API 조회 연결 제거, 미디어 전용 제목·로딩·오류·재시도 제공 |
| `src/features/battle-tools/components/PokemonMedia.tsx` | 음원 교체·접기·폼 변경·화면 이탈 시 이전 오디오 중지, 음원 후보 소진 후 재시도, 제목 계층 정리 |
| `tests/integration/battle-tools/PokemonToolsSection.test.tsx` | FR-23 통합 테스트 10개. 지연 응답·폼 변경·재생 중지·누락·실패·재시도·움직임 감소·캐시·범위 검증 |
| `tests/e2e/battle-tools/tools.spec.ts` | FR-23 E2E 4개. 실제 브라우저 재생 시간 증가·접기/폼 변경 시 중지·메가 이로치·실패 격리·모바일·키보드 검증 |
| `src/features/battle-tools/TASK-011.md` | 현재 요청 범위·변경 요청·검증 결과 기록. 이전 작업 기록은 이력으로 유지 |

이번 시작 시 기존 TASK-011 파일 18개가 이미 미커밋 상태였다. 상성·비교 소스/테스트, 기존 모델·API·CSS·상세 연결 코드를 새로 구현하거나 삭제하지 않았으며 현재 미디어 화면은 기존 미디어 adapter·Query를 재사용한다. 상위 `D:/claude/pokefile`의 기존 lockfile 변경도 유지했다.

### 이번 실행 결과 (2026-11-04)

환경: Windows / 기존 Node·npm·Vitest·Playwright Chromium. 패키지·설정 추가 없음.

| 명령·절차 | 결과 |
|---|---|
| `npm.cmd run lint` | PASS — 모듈 경계 검사 포함 |
| `npm.cmd run typecheck` | PASS — 최종 `tsc -b` 성공 |
| `npm.cmd test` | PASS — 전체 29개 파일·195개 테스트. 미디어 통합 10개 포함 |
| `npm.cmd run build` | PASS — 타입 검사·정적 빌드 성공. 기존 500 kB 청크 경고는 유지(JS 699.12 kB) |
| `node node_modules/playwright/cli.js test tests/e2e/pokemon-detail/detail.spec.ts --workers=1 --reporter=line --output=test-results/network-recheck` | PASS — 네트워크 허용 환경에서 기존 상세 4개 재검증(12.1초) |
| `node node_modules/playwright/cli.js test --workers=1 --reporter=line --output=test-results/final` | PASS — 네트워크 허용 환경에서 최종 전체 33개(36.4초), 미디어 4개 포함 |
| PokéAPI 실응답 GET `/pokemon/6`, `/pokemon/charizard-mega-x` | PASS — 일반/이로치 GIF·PNG, latest/legacy 필드 재확인. 메가X의 legacy는 null. [공식 문서](https://pokeapi.co/docs/v2#pokemon)와 일치 |
| 모바일 시각·키보드 확인 | PASS — Chromium 390×844. Enter로 열기, Space로 이로치 전환, 포커스 표시, 가로 넘침 없음. 이미지·음원은 테스트 fixture 사용 |
| 변경 경로 검사·`git diff --check` | PASS — battle-tools 허용 경로 안에서만 변경 |

- 시각 확인 파일: `test-results/final/battle-tools-tools-모바일·키보드-4ee2a-환을-조작하고-가로-넘침이-없다-TC-08·11--chromium/pokemon-media-mobile.png` (자동 생성·git 제외).
- 초기 실패: PowerShell의 `npm.ps1` 실행 정책 때문에 npm 명령이 시작되지 않아 `npm.cmd`로 재실행했다. 첫 대상 테스트는 도감 번호 예상 자릿수 오류로 1개 실패(26개 통과); 기존 4자리 규칙에 맞게 테스트를 수정했다. 테스트 타입 검사는 Testing Library에 없는 `exact` 옵션 2곳에서 실패해 옵션 제거 후 재통과했다. jsdom에 없는 `pause()`는 테스트 내부에서 대체하고 정리 순서를 명시했다.
- 초기 전체 E2E: 미디어 4개는 통과했으나 실시간 API를 사용하는 기존 상세 4개가 네트워크 로딩 실패로 실패했다. 종료 처리도 멈춰 이번에 시작한 Playwright와 그 임시 서버 프로세스만 확인 후 종료했다. 네트워크 허용 상태에서 기존 상세 4개와 최종 전체 33개가 모두 통과했다. 초기 실패·중단을 PASS로 집계하지 않는다.
- 미검증: 독립 QA, 사람 승인, 스피커를 통한 청취, 전체 종·폼의 실제 음원 가용성, Chromium 외 브라우저·실기기·스크린리더·배포 origin. 미디어 브라우저 테스트는 기존 WAV/이미지 fixture를 사용한다.
- 상태: FR-23 구현·자체 검증 완료, 독립 QA·사람 승인 대기. 정식 TASK 상태·정책 문서 변경 없음. 커밋·푸시·PR·병합·배포는 수행하지 않았다. 검증용 preview 서버는 종료했다.

## 이전 작업 이력 — FR-23~25

- 담당: 성윤우 / 구현: Codex
- 사용자 지시: `task-011 진행해줘` (2026-11-04). FR-23~25의 세 선택 기능 구현을 이번 작업 범위로 적용한다. 앞서 문의한 타입 상성을 우선 검증한다.
- 기준: SRS FR-23~25, NFR-01~04·07~08, ADR-008·009·013, TEST_PLAN TC-08·09·11.
- 브랜치: `feat/TASK-011-battle-tools`, 기반 `b862650`.
- 시작 전 `git pull --no-rebase --no-edit origin develop`: 충돌 없이 fast-forward. 기존 TASK-007·008과 최신 디자인·공통 타입 배지를 포함한다.
- 정식 OQ-10·TASK 상태는 이번 지시만으로 CLOSED/DONE으로 변경하지 않는다. 선택 기능의 이번 착수·우선순위는 사용자 지시에 따른다. 기존 필수 기능의 문서 상태·독립 QA 이력은 유지한다.

## 허용 범위와 변경 요청

- allowed_paths: `src/features/battle-tools/**`, `tests/unit/battle-tools/**`, `tests/integration/battle-tools/**`, `tests/e2e/battle-tools/**`.
- restricted_paths: 위 경로 외 전체. 공통 모델·전역 CSS·패키지·정책 문서·라우터·헤더·상세 담당 파일을 수정하지 않는다.
- CR-011-TESTS: 기능 구현 전 위 battle-tools 테스트 경로에 API adapter·6세대 상성·미디어·비교·접근성·실패 복구 검증 추가를 기록한다. 공통 테스트 설정은 유지한다.
- CR-011-ENTRY: 기존 공개 `SmogonSetsSection(pokemonId, identity, onRetryIdentity)` 호출 계약을 유지하면서, 같은 feature가 소유한 컴포넌트에 별도 제목의 접이식 추가 도구를 형제 영역으로 구성한다. 상세는 이미 전달하는 종 ID·유효 폼을 그대로 사용한다. 도구를 열 때만 추가 조회한다. 새로운 경로나 타인 영역 호출부 수정 없이 접근 가능한 상세 화면 진입점을 제공한다.
- PokéAPI는 기존 승인 출처를 유지한다. 새 필드·`/type/{name}` 계약은 공식 문서와 실제 응답 검증 후 사용한다. 검증 결과는 이 기록에 남기며 API_SPEC을 구현에 맞춰 수정하지 않는다.
- 화면은 최신 DESIGN의 공통 CSS 변수와 공개 TypeBadge를 사용한다. `docs/image/type.jpeg`는 방향 참고 자료이며 수치를 복제하지 않는다.

## 인수 조건

1. FR-23: 선택한 기본·6세대 메가 폼의 일반/이로치 이미지를 전환하고 제공되는 울음소리를 사용자가 재생할 수 있다. 자동 재생하지 않는다. GIF → 해당 모드 PNG → 정보 없음 순서, 울음소리 없음·로드 실패 안내를 제공한다.
2. FR-24: 현재 선택한 포켓몬·폼의 타입으로 받는 공격 배율을 18개 타입에 대해 표시한다. 단일·복합 타입의 4/2/1/0.5/0.25/0배를 정확히 결합하며, 과거 타입 관계는 6세대 기준을 선택한다. 특성·도구·기술 등 효과를 포함하지 않는다는 설명을 표시한다.
3. FR-25: 지원 범위 두 포켓몬의 6개 종족값과 합계를 나란히 비교한다. 이름·번호와 폼을 명확하게 표시하고 실제 수치를 텍스트 표로 제공한다. 6세대 이후 변경 이력이 있으면 6세대 값을 사용한다. 조회 실패를 0으로 대체하지 않는다.
4. #1~721 기본 폼과 인덱스에 등록된 6세대 메가만 지원한다. 잘못된 ID·폼·다른 종 응답은 거부한다. 미디어·비교·상성의 부분 실패가 상세·실전 세팅을 중단시키지 않는다.
5. 선택 변경 시 이전 포켓몬·폼의 이미지·상성·능력치를 새 선택의 데이터처럼 표시하지 않는다. 조회는 TanStack Query로 리소스·폼 단위 캐시를 공유하고 취소 신호를 전달한다.
6. 로딩·데이터 부재·오류·재시도를 구분한다. 한국어 레이블·키보드·포커스·모바일 넘침을 검증한다.
7. 관련 단위·통합·E2E, lint/typecheck/test/build, 변경 범위 검사를 수행한다. 독립 QA와 사람 승인 전 DONE/독립 QA PASS로 표시하지 않는다.

## 진행 및 검증

- 구현 전 작업 트리는 clean이었다. 이 작업은 새 브랜치에서 진행하며 기존 PR 브랜치를 수정하지 않는다.
- 외부 계약 확인·구현·검증 결과는 작업 후 아래에 추가한다.
- 이번 TASK에 대한 커밋·푸시·PR 생성·병합·배포는 아직 수행하지 않았다.

## 외부 계약 검증 — 2026-11-04

- 공식 문서: https://pokeapi.co/docs/v2#pokemon, https://pokeapi.co/docs/v2#types. `past_*`의 generation은 해당 값이 적용되는 마지막 세대라는 설명을 확인했다.
- 실제 GET 검증: `/type/{name}` 18개 전부와 `/pokemon/6`, `/pokemon/25`, `/pokemon/charizard-mega-x`, `/pokemon/aegislash-shield` 4개. 검증 스냅샷은 시스템 임시 폴더의 `pokefile-task011-api-snapshot.json`에 저장했으며 저장소에는 포함하지 않는다.
- 타입 관계: 18개에 `damage_relations`·`past_damage_relations`가 있다. 발견한 과거 관계의 마지막 세대는 I 또는 V이며 VI에 해당하지 않는다. 향후 변경 이력이 있으면 VI 이상 중 가장 가까운 마지막 세대의 관계를 선택한다.
- 종족값: `past_stats`는 전체 6개 값이 아니라 변경된 값만 포함한다. 킬가르도 실응답은 VII까지 방어·특수방어 150을 제공한다. VI 비교에는 현재 값에 해당 이력을 항목별로 덮어써야 한다.
- 미디어: 기본·메가에서 `sprites.other.showdown.front_default/front_shiny`, 기본 PNG, `cries.latest/legacy` URL 확인. 메가X의 legacy 울음소리는 null이다. 누락을 다른 폼의 자료로 채우지 않는다.
- API는 기존 승인된 PokéAPI 출처이며, 미디어는 응답에 실제 제공된 HTTPS URL만 사용한다. 이번 검증은 대표 4개 폼과 타입 18개에 한정한다. 전체 721종·48메가 미디어 가용성을 보증하지 않는다.

## 구현 결과

| 변경 파일 | 내용 |
|---|---|
| `model/tools.ts` | 종·폼 응답 확인, 번호 기반 기본 폼 조회, 6세대 타입/종족값 이력 반영, GIF/PNG·울음소리 후보 정규화, 합계 |
| `model/matchups.ts` | 6세대 타입 관계 정규화, 복합 타입의 방어 배율 결합, 누락/충돌 데이터 거부 |
| `api/tools.ts`, `hooks/usePokemonTools.ts` | PokéAPI adapter, 취소 신호, 포켓몬·폼·타입별 Query 캐시 |
| `components/PokemonToolsSection.tsx`, `PokemonToolsSection.css` | 상세 화면에 접이식 도구 영역, 열 때만 조회, 현재 폼 변경 시 이전 콘텐츠 제거, 공통 디자인 토큰 사용 |
| `components/PokemonMedia.tsx` | 일반/이로치 전환, 같은 모드의 GIF → PNG → 없음, 움직임 줄이기 시 PNG, 수동 오디오 재생·후보 실패 안내 |
| `components/TypeMatchups.tsx` | 선택한 폼의 18타입별 받는 배율과 범위 설명, 로딩·부분 오류·재시도 |
| `components/StatComparison.tsx` | 현재 포켓몬과 비교 대상·메가 폼 선택, 종족값 6개·합계 표. 표시용 이름을 URL로 추정하지 않고 기본 번호 조회의 실제 종 이름으로 메가 요청 |
| `components/SmogonSetsSection.tsx` | 기존 실전 세팅 본문을 유지하고 유효한 identity일 때 추가 도구를 형제 영역으로 연결. 공개 props 계약 유지 |
| `tests/unit/battle-tools/tools.test.ts`, `matchups.test.ts`, `toolsApi.test.ts` | 실응답 adapter·세대 이력·상성·범위·잘못된 응답·HTTP 실패·취소 신호 검증 |
| `tests/integration/battle-tools/PokemonToolsSection.test.tsx` | 접기/캐시·미디어 대체·자동 재생 방지·폼 전환·비교·부분 실패/재시도·움직임 줄이기 8개 검증 |
| `tests/integration/battle-tools/task011-fixture.json` | 검증한 타입 18개와 대표 포켓몬 4개 응답의 관련 필드 스냅샷 |
| `tests/e2e/battle-tools/tools.spec.ts`, `cry.wav` | 상세 진입·미디어·상성·현재/비교 메가 폼·부분 실패·모바일·키보드 4개. 재생 엔진 검증용 1초 PCM fixture |
| `TASK-011.md` | 범위·변경 요청·인수 조건·API 검증·실행 결과 기록 |

소스·기록 11개와 테스트·fixture 7개, 총 18개 파일이다. 기존 추적 파일 수정은 `SmogonSetsSection.tsx` 하나이며 나머지는 신규 파일이다. 정식 문서·공통 타입/설정·타인 영역은 수정하지 않았다.

## 실행한 검증 — 2026-11-04

환경: Windows, 기존 Node 런타임 및 설치된 npm·Vitest·Playwright Chromium 사용. 추가 패키지 설치 없음.

| 명령·절차 | 결과 |
|---|---|
| PokéAPI 공식 문서 + 18타입·4포켓몬 실응답 GET | 성공. 위 계약 검증 범위 기준 |
| `node node_modules/vitest/vitest.mjs run tests/unit/battle-tools/tools.test.ts tests/unit/battle-tools/matchups.test.ts tests/unit/battle-tools/toolsApi.test.ts tests/integration/battle-tools/PokemonToolsSection.test.tsx` | 4개 파일·32개 통과 |
| `npm run lint` | 성공. 모듈 경계 검사 포함 |
| `npm run typecheck` (`tsc -b`) | 테스트 타입 수정 후 성공 |
| `npm test` | 전체 29개 파일·193개 통과. 신규 32개 포함 |
| `npm run build` | 성공. 타입 검사 포함, JS 청크 704.78 kB로 기존 500 kB 기준 초과 경고 있음 |
| `node node_modules/playwright/cli.js test --workers=1 --reporter=line` | 최종 전체 33개 통과(24.4초): 기존 29개 회귀 + TASK-011 4개 |
| 모바일·키보드 | Chromium 390×844, Enter로 열기·Space로 이로치 전환·비교 선택, 18개 상성·비교 표 표시, 가로 넘침 없음 |
| 오디오 재생 | 자동 재생·사전 다운로드 없이 controls 제공. 실제 브라우저의 재생 시간 증가·일시정지를 테스트 PCM으로 확인 |
| 시각 확인 | `test-results/battle-tools-tools-모바일·키보드-88a0f-교를-조작하고-가로-넘침이-없다-TC-08·11--chromium/pokemon-tools-mobile.png` 확인. 타입 이름/배율·미디어 조작·비교 수치 가독성 확인. 미디어는 테스트 fixture |
| `git diff --check`·변경 범위 검사 | 성공. 변경 18개 모두 allowed_paths 이내, 범위 밖 변경 없음 |
| 개발 서버 | `http://127.0.0.1:5174/pokefile/` HTTP 200. 상세 `/pokefile/#/pokemon/6`에서 `추가 도구 열기`로 확인 가능 |

### 실패·수정 이력

- 첫 기능 테스트: 30/31 통과, 비교 fixture가 종 표시 이름에 폼 이름(`aegislash-shield`)을 넣어 응답 일치 검증에 실패했다. 올바른 종 표시 이름으로 수정했다. 추가 검토에서 Mr. Mime 등 표시 이름을 API 식별자로 추정하지 않도록 번호 조회·실제 종 이름 사용으로 보강하고 신규 회귀 테스트를 추가했다.
- 테스트 추가 후 타입 검사: Testing Library에 없는 `exact` 옵션과 Node 전역 Buffer 사용이 실패했다. 테스트 옵션을 정리하고 재생 fixture를 별도 WAV 파일로 분리해 공통 TS 설정 변경 없이 해결했다.
- 첫 E2E 수집: Node ESM의 JSON import 속성이 누락돼 실행되지 않았다. `with { type: 'json' }`을 추가했다.
- 첫 전체 E2E 실행: 30개 통과·새 비교 선택기 관련 3개 실패. Playwright의 레이블 텍스트 조회에 옵션 문구가 포함돼 exact 조회가 실패했다. 실제 접근성 이름을 사용하는 combobox role 조회로 수정 후 전체 33개 재통과했다.
- 위 실패를 최초부터 PASS로 표현하지 않는다. 최종 결과와 수정 전 결과를 구분한다. 실행 출력은 작업 대화에 있으며 별도 영구 원시 로그는 생성하지 않았다.

## 현재 상태와 제한

- FR-23~25 구현과 자체 검증을 마쳤다. 정식 TASK 상태·OQ-10·SRS·DESIGN·WORKFLOW는 변경하지 않았다.
- 독립 QA·사람 승인·병합 전이며 독립 QA PASS 또는 전체 DONE으로 표시하지 않는다.
- 타입 상성은 타입 자체의 방어 배율이며 특성·도구·기술·날씨 효과를 계산하지 않는다. 종족값은 실제 배틀 능력치 계산기가 아니다.
- 실제 음원의 전 종·전 메가 가용성, 스피커를 통한 청취, Chromium 이외 브라우저·실기기·스크린리더·운영 배포 origin은 미검증이다. 자동 브라우저 미디어 검증은 fixture를 사용한다.
- 테스트의 임시 preview 서버는 종료했고 기존 개발 서버는 유지한다. 이번 TASK의 커밋·푸시·PR·병합·배포는 수행하지 않았다.
