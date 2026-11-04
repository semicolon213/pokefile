# QA 보고서 — TASK-020

- 대상 TASK: TASK-020 다크 모드 (시스템 설정·라이트·다크 선택, 저장, 렌더 전 적용, 토큰, AA)
- 요구사항 ID: FR-32, ADR-018, TC-16
- PR/Commit: PR #22 (`d906562`, 병합 `3907570`) / develop `7c469bc` 기준 검증
- 구현자 및 도구: Claude Code (semicolon213 지시)
- 독립 검증자 및 도구: Claude Code 독립 QA 세션 (구현 세션과 별도)
- 검증 일자: 2026-11-04
- 결과: **PASS**

## 1. 범위 확인
- [x] 허용 경로: `index.html`, `src/app/**`, `src/shared/**`(다크 모드는 공통 영역, OWNERSHIP §1), `src/features/pokedex/**`, `src/features/type-chart/**`(김형균), 테스트
- [x] 타인 소유 영역 변경 없음
- [x] 같은 PR에서 SRS FR-32·DESIGN 다크 토큰·ADR-018·OQ-24 CLOSED — 근거 "팀 결정(semicolon213 전달)"

## 2. 요구사항별 결과
| 요구사항/인수 조건 | 증거 | 결과 |
|---|---|---|
| 아이콘 3개(시스템/라이트/다크), `aria-pressed`·`aria-label`·`title` | `ThemeToggle.tsx:5-30` | PASS |
| 기본 = 시스템 설정 | `theme.ts:18-25`; 시스템 다크 에뮬레이션에서 html 배경 `rgb(17,19,23)`, 라이트에서 흰색 | PASS |
| 저장 `pokefile:theme`(light·dark, 시스템이면 키 삭제), `<html data-theme>`, URL 미사용 | 프로브: 라이트 선택 → `ls=light`, 시스템 선택 → `ls=null`·속성 없음, 주소에 테마 없음 | PASS |
| 시스템 다크 + 라이트 선택 시 라이트 유지 | 프로브·E2E `theme.spec.ts:11` | PASS |
| 새로고침 후 유지·**깜빡임 없음** | 프로브: 앱 JS를 **전부 차단**하고 새로고침해도 `data-theme=dark`, 배경 `rgb(17,19,23)`, `#root` 자식 0 → 인라인 스크립트(`index.html:9-16`)만으로 렌더 전 적용됨. 앱은 초기 적용을 하지 않으므로 E2E 새로고침 테스트도 사실상 이 스크립트를 검증 | PASS |
| 저장소 차단 시 시스템 설정 동작 + 세션 메모리 유지 | 프로브: `localStorage` 접근이 예외를 던지게 한 상태에서 다크 선택 → 적용, 다른 화면 이동 후에도 유지, 페이지 오류 0 | PASS |
| 다른 탭에서 바꾸면 따라감 | 프로브: 2번째 탭 `data-theme=light`, 버튼 `aria-pressed=true` | PASS |
| 두 테마 글자 대비 AA | 프로브 `probe3.mjs`: 8개 화면(목록·지방+타입 필터·상세 기본/메가X·피카츄·상성표·비교·즐겨찾기) × 라이트/다크에서 직접 텍스트를 가진 모든 요소의 글자색 vs 실제 배경(반투명 합성) 계산 → **AA 미달 0건**. 다크 최저: 주 버튼 `검색` 5.07:1, 보조 글자 6.66~6.79:1. 18개 타입 칩·상성표 머리 칸 포함 | PASS |
| 다크 토큰은 `global.css` 다크 블록 | `global.css:72-106`(시스템 다크 블록 + `[data-theme=dark]` 블록 같은 값) | PASS(D-020-01 참고) |

## 3. 실행한 검증
| 명령/절차 | 실행 여부 | 결과 | 로그 |
|---|---|---|---|
| lint | 실행 | PASS | `lint.log` |
| typecheck | 실행 | PASS | `tsc.log` |
| test | 실행 | PASS — 245/245 (theme 단위 4, 통합 1) | `vitest.log` |
| build | 실행 | PASS | `build.log` |
| E2E | 실행 | PASS — 41/41 (`theme.spec.ts` 2건) | `e2e.log` |
| 수동: Playwright `probe3.mjs`·`probe3b.mjs`(대비 스캔, JS 차단, 저장소 차단, 탭 동기화) | 실행 | §2 결과 | 스크래치 `qa/` |

## 4. 결함
| 심각도 | 재현 절차 | 기대/실제 | 담당 |
|---|---|---|---|
| 하 (D-020-01) | `TypeChart.css:10-30`, `Compare.css:5-19` | ADR-018 "다크 토큰은 global.css의 다크 블록 하나". 실제로 기능 CSS에도 다크 블록(상성표 칸 색, 비교 색)이 있음. 시스템 다크 블록과 `[data-theme=dark]` 블록이 같은 값을 두 번 적어 수정 누락 위험 | 김형균(문서 또는 구조 정리) |
| 하 (D-020-02) | 시스템 설정 상태에서 OS 테마를 실행 중 변경 | 페이지 색은 CSS로 바뀌지만 `theme-color` 메타는 갱신되지 않음(`theme.ts:35-41`는 선택 시에만 호출) | 김형균 |

## 5. 결론
- PASS/FAIL/BLOCKED 사유: 선택·저장·렌더 전 적용·저장소 차단·탭 동기화·두 테마 AA를 빌드본에서 직접 측정해 모두 충족했다.
- 남은 위험/미검증 항목: 대비 스캔은 기본 상태만 대상(hover·focus 상태, placeholder, 비텍스트 3:1 대비는 미검증). 실제 모바일 브라우저 주소창 색은 미확인.
- 수정 요청: 없음(D-020-01·02 선택).
- 사람 승인자: 김형균(공통 영역)
- 문서 갱신 별도 TASK: D-020-01을 구조 대신 문서로 맞출 경우 ADR-018·DESIGN §3.1 문구 수정
