# QA 보고서 — TASK-012

- 대상 TASK: TASK-012 외부 API 계약 검증 테스트 (`scripts/verify-api/verify-api.test.mjs`)
- 요구사항 ID: DR-01~05, API_SPEC §5·§5.2·§5.4
- PR/Commit: 최초 `d6d3d4a`, 이후 PR #12(`0129d1d`)·#16(`04d5479`)·#21(`6914b16`)에서 확장 / develop `7c469bc` 기준 검증
- 구현자 및 도구: Claude Code (semicolon213 지시)
- 독립 검증자 및 도구: Claude Code 독립 QA 세션 (구현 세션과 별도)
- 검증 일자: 2026-11-04
- 결과: **PASS** (단, 테스트 다수가 단언 없이 기록만 남겨 계약 변경을 잡지 못하는 약점 있음 — §4 D-012-01)

## 1. 범위 확인
- [x] 허용 경로만 수정 — `scripts/verify-api/**`(공통 영역, 관리 책임자 김형균 본인)
- [x] 타인 소유 영역 변경 없음
- [x] SRS/DESIGN/공통 API 계약 변경 여부 확인 — 테스트 파일 자체는 계약을 바꾸지 않음. 다만 API_SPEC §5 결과 기록은 구현 AI 자체 실행 기록(TEST_PLAN §6.1에 "독립 QA 아님" 명시)

## 2. 요구사항별 결과
| 요구사항/인수 조건 | 증거 | 결과 |
|---|---|---|
| 실제 네트워크로 PokéAPI·data.pkmn.cc 계약 확인 | 직접 실행 14/14 통과(37.2초). 세대 9개·#1025 = pecharunt 단언(`verify-api.test.mjs:52-58`) | PASS |
| DR-01 전체 목록·인덱스 일치 | 기본 폼이 아닌 폼 수 ≥326, 종 이름 접두 규칙, 인덱스 폼 수 = API 폼 수 단언(`:62-73`) | PASS |
| DR-02 한국어 이름 | 누락 0/1025는 **로그만**, 단언은 #25 = 피카츄 1건(`:84-85`) | PASS(약함) |
| DR-04 이름·폼 매핑 | 매칭 수는 로그만, `Charizardite X` 추출과 세팅 존재 단언(`:259-261`), CORS `*` 단언(`:180`) | PASS |
| DR-05 출현 데이터 공백 | #906 장소 0개 등 **로그만**, 단언 없음(`:155-167`). `hasEncounters:false` 게임이 실제로 데이터가 없는지도 확인하지 않음 | PASS(약함) |
| scope.json 게임 버전·확장팩 버전 존재·세대 일치 | 단언 있음(`:75-82`) | PASS |
| 타입 상성표 = damage_relations (§5.4) | 18타입 행 비교 단언(`:265-277`). 별도로 QA가 독자 상성표(표준 6세대 이후)와 대조 → 120칸 일치 | PASS |
| GIF 없는 종의 PNG 대체 | 6세대 이하 GIF 누락 0·GIF 없는 종의 PNG 존재 단언(`:116-118`) | PASS |

## 3. 실행한 검증
| 명령/절차 | 실행 여부 | 결과 | 로그 |
|---|---|---|---|
| lint (`npm run lint`) | 실행 | PASS (oxlint 경고 0, 모듈 경계 검사 통과) | QA 스크래치 `lint.log` |
| typecheck (`npx tsc -b`) | 실행 | PASS (출력 없음) | `tsc.log` |
| test (`npx vitest run`) | 실행 | PASS — 39 files / 245 tests | `vitest.log` |
| build (`npm run build`) | 실행 | PASS (청크 725 kB 경고만) | `build.log` |
| E2E (`npx playwright test`) | 실행 | PASS — 41/41 | `e2e.log` |
| `node --test scripts/verify-api/verify-api.test.mjs` | 실행(실네트워크) | PASS — tests 14, pass 14, fail 0, 37.2초 | `verify-api.log` |
| 재현성: 저장소 밖 사본에서 `build-pokedex-index.mjs`·`build-type-chart.mjs` 재실행 후 커밋본과 비교 | 실행 | 인덱스(generatedAt 제외)·상성표 모두 **바이트 동일** | `regen-index.log`, `regen-chart.log` |

## 4. 결함
| 심각도 | 재현 절차 | 기대/실제 | 담당 |
|---|---|---|---|
| 중 (D-012-01) | `verify-api.test.mjs`의 "한국어 이름 존재 여부"(`:81-86`), "한국어 도감 설명"(`:88-99`), "past_types"(`:124-132`), "출현 장소 버전 범위"(`:155-167`), "진화 체인"(`:169-...`) 확인 | 기대: 계약이 바뀌면 실패. 실제: 수치를 `console.log`로만 남기고 단언이 없거나 표본 1건만 단언 → 예: ko 이름이 100종 빠져도 통과, 6세대 이후 타입 변경이 생겨도 통과 | 김형균 |
| 하 (D-012-02) | ADR-015 "지방 도감(`/pokedex`) 번호 … `scripts/verify-api`에 항목을 추가해 확인" | 지방 도감 계약은 verify-api에 없고 `build-pokedex-index.mjs` 생성 시 검사로만 존재(인덱스 재생성 전에는 확인 안 됨) | 김형균 |
| 하 (D-012-03) | `:14` `GEN6_MEGA_GROUPS`, `:218` `NON_STANDARD_FORMATS`(5개) | scope.json 밖 하드코딩. ADR-016은 변칙 포맷 9개로 확장(실전 세팅 쪽은 TASK-025 범위). 테스트 이름도 "6세대 기준" 등 이전 범위 표현이 남음 | 김형균 / TASK-025 성윤우 |
| 하 (D-012-04) | API_SPEC §5.2 "탐색 스크립트로 전수 조회" | form_names 개수·Smogon 911종 커버 등 일부 수치는 저장소의 스크립트로 재현할 수 없음(탐색 스크립트 미커밋) | 김형균 |

## 5. 결론
- PASS/FAIL/BLOCKED 사유: 14개 테스트를 실제 네트워크로 직접 실행해 모두 통과했고, 인덱스·상성표 생성 결과가 커밋본과 동일함을 재생성으로 확인했다. 계약 검증 도구로서 동작한다.
- 남은 위험/미검증 항목: 절반가량의 테스트가 "기록용"이라 통과가 곧 계약 유지를 뜻하지 않는다(D-012-01). 배포 origin(GitHub Pages) CORS·요청량 제한은 미검증(API_SPEC §5 그대로).
- 수정 요청: D-012-01 핵심 수치(ko 이름 누락 0, 6세대 이후 타입 변경 0, `hasEncounters:false` 게임 데이터 없음)에 단언 추가.
- 사람 승인자: 김형균(공통 영역)
- 문서 갱신 별도 TASK: API_SPEC §5 "최종 실행 11/11" 표기를 현재 14개 기준으로 갱신(별도 문서 작업).
