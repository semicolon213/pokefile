# QA 보고서 — TASK-017 재검증 (D-A · D-B · T-1)

- 대상 TASK: TASK-017 도감 체크리스트 (담당 성윤우)
- 요구사항 ID: FR-29, NFR-03·08 / 테스트: TC-14·09·08
- PR/Commit: 미커밋 작업본 (브랜치 feat/TASK-017-checklist, 기반 HEAD 07ec63ee96c631e2126e197dcdd243e6583280dc)
- 구현자 및 도구: Codex
- 독립 검증자 및 도구: Claude (Cowork, 클라우드 Linux 사본에서 실행)
- 검증 일자: 2026-11-05 (KST)
- 결과: **FR-29 기능 범위 PASS / 전체 인수 FAIL(공통 셸 320px) / 외부 API E2E 9개 BLOCKED**

## 0. 검증 환경과 한계
- 사용자 PC(D:\claude\pokefile\task-017-checklist)는 폴더 접근만 허용되고 로컬 셸이 없어, **원본 폴더에서 직접 실행하지 못했다.**
- 원본 폴더의 소스·테스트·설정·문서·공개 데이터 231개 파일을 클라우드로 복사해 `npm ci` 후 실행했다(node 22.23.4, Linux, Playwright 1.64.1 + 사전 설치 Chromium 1243 headless shell). `node_modules`·`dist`·`.github`·`PBL Report`·이미지는 복사하지 않았다.
- 해시 비교 범위: `task017-qa-fixes-source-sha256.json`의 **변경 파일 11개만** 사본과 SHA-256 일치(11/11). 나머지 파일은 같은 시점 복사본이지만 해시 목록이 없어 일치를 별도로 증명하지 않았다. git 메타데이터가 없어 `git status`/diff는 확인하지 못했다.
- Playwright 래퍼 설정(`pw.qa.config.ts`)은 저장소 설정을 그대로 가져오고 브라우저 실행 파일 경로만 지정했다. 웹서버는 같은 빌드 결과로 `vite preview --port 4173`을 직접 띄웠다(프록시 환경에서 webServer 대기 시간 초과 때문).
- PokéAPI는 이 환경에서 연결 불가(`curl` HTTP 000).

## 1. 범위 확인
- [x] 허용 경로만 수정 — 수정 시각(mtime) 기준 체크아웃 이후 변경 파일은 `src/features/favorites/**`와 `tests/{unit,integration,e2e}/favorites/**`뿐. git으로는 미확인.
- [x] 타인 소유 영역 변경 없음 — `src/app/**`, `src/shared/**` 변경 흔적 없음. 공통 헤더 결함을 우회하는 코드 없음.
- [x] SRS/DESIGN/공통 API 계약 변경 없음(docs mtime 모두 체크아웃 시각). 저장 키 `pokefile:favorites`·스키마 `{version:1, ids}`·즐겨찾기 메시지 유지 확인.

## 2. 결함별 결과
| 항목 | 증거 | 결과 |
|---|---|---|
| D-A 최초 읽기 실패 | 저장 값 `{"version":1,"ids":[25,6]}` + 최초 접근부터 `localStorage` 차단: 체크박스 비활성·indeterminate·`aria-checked=mixed`·이름 "포획 여부 확인 불가", 화면 "확인 불가", 포획 상태 필터 `전체`로 보류·비활성, "검색 결과 3마리 · 포획 상태 확인 불가", 진행 막대 0개, role=alert 안내. 차단 해제 후 "포획 기록 다시 읽기" → 2/3·66.7%, 체크 복원, 필터 활성, `포획 완료` 2마리·`미포획` 1마리 (repo e2e #5, QA-7) | **해결** |
| D-A 이후 장애와 구분 | 정상 읽기(2/3) 후 차단: 기존 체크가 체크된 채 비활성으로 유지, 새 체크 불가, 재읽기 후 원본 그대로 (QA-6, unit "최초 읽기 실패와 읽은 뒤 장애를 구분") | **해결** |
| D-B 전체 손상·미지원 버전·유효 번호 없음 | `broken`, `{"version":2,...}`, `{"version":1,"ids":["x",0,99999,25.5]}` 모두 확인 불가·완성률 숨김·토글 불가, 새로고침 후 원본 그대로 (repo e2e #4·#6, QA-1) | **해결** |
| D-B 초기화 흐름 | 기록 초기화 → 취소(원본 유지, 포커스 `기록 초기화`로 복귀) → 다시 진입 → 초기화하고 시작 → `{"version":1,"ids":[]}`, 포커스 h1, 0/3·0%, 이후 체크 저장 (repo e2e #4·#6) | **해결** |
| D-B 확인 중 외부 변경 | 다른 탭 변경(storage 이벤트) 시 확인 단계가 닫히고 다른 탭 값 유지(QA-3). 이벤트 없이 값이 바뀐 뒤 확인을 눌러도 덮어쓰지 않고 실패 안내(QA-4) | **해결** |
| D-B 초기화 쓰기 실패 | `setItem` 예외 시 `broken` 보존, "초기화하지 않았습니다" 안내 (QA-5, unit) | **해결** |
| D-B 일부 손상 구분 | `[25,25,"x"]`: 별도 안내, 피카츄 체크, 1/3·33.3%, 초기화 버튼 없음, 읽기만으로 미변경 (QA-2) | **해결** |
| T-1 재시도 로딩 | 503 후 재시도 응답 지연: 로딩 문구 표시 + `목록 다시 시도` 비활성, 응답 후 목록 표시 (repo e2e #7, integration) | **해결** |
| 320px 라이트·다크 체크리스트 영역 | 확인 불가·초기화 확인 상태에서 영역 scrollWidth 288 ≤ clientWidth 288, 오른쪽 304 ≤ 320 (QA-8 light/dark, 스크린샷) | PASS |
| 기존 즐겨찾기 회귀 | favorites.spec 8/8 통과(손상 JSON·버전 불일치 후 다음 저장, 탭 동기화, 저장소 차단), unit store 6/6 | PASS |
| 공통 셸 320px | 문서 너비 384px > 320px, 넘친 요소 `nav.app-nav`·마지막 메뉴 링크(`a.active`) — 체크리스트·기존 즐겨찾기 둘 다 | **FAIL(타 담당 영역)** |

## 3. 실행한 검증 (모두 클라우드 사본에서 Claude가 직접 실행)
| 명령/절차 | 결과 | 로그 |
|---|---|---|
| `npm ci` | 종료 0 | — |
| `npm run lint` (oxlint + 경계 검사) | 종료 0 | lint.log |
| `npm run typecheck` | 종료 0 | typecheck.log |
| `npm run build` | 종료 0 (청크 크기 경고만) | build.log |
| `npx vitest run` | 종료 0, 41파일·286개 통과 | vitest-full.log / vitest-full.json |
| E2E favorites (repo spec) | 종료 1, 16 통과·1 실패(공통 셸) | e2e-favorites.log |
| E2E 전체 52개 | 종료 1, 42 통과·10 실패 = 공통 셸 1 + 외부 API 9(PokéAPI 연결 불가) | e2e-full.log |
| QA 추가 시나리오 10개 (spec/qa-recheck.spec.ts) | 종료 0, 10/10 통과 | qa-extra.json, qa-extra-artifacts/ |

외부 API 9개(my-game 2, compare 1, detail 5, type-chart 1)는 2026-11-04 수정 **전** Windows 실행에서 9/9 통과 기록(`task017-external-api-recheck-20261104.json`)만 있고, **수정 후에는 어디서도 통과 증거가 없다** → BLOCKED.

## 4. 결함·관찰
| 심각도 | 위치 | 재현 | 기대/실제 | 확신도 | 담당 |
|---|---|---|---|---|---|
| 중 (인수 차단) | 공통 헤더 `src/app/layout/RootLayout.tsx` 계열 / `global.css` `.app-nav` | 320px로 `#/favorites` 또는 `?view=collection` 열기 | 문서 너비 ≤320 / 실제 384(Linux), Codex Windows 373·368 | 높음 | 공통 영역 관리 책임자(김형균) |
| 낮음 (관찰) | CollectionChecklist 초기화 확인 단계 | 확인 단계에서 Esc | 닫힘 기대 가능 / 닫히지 않음. 명세 요구는 없음 | 높음 | 성윤우(선택) |
| 낮음 (관찰) | savedIdsStore | 정상 읽기 후 쓰기 실패 → 저장소 회복 | 수동 "다시 읽기" 전까지 저장 불가 상태 유지(보수적 설계, 의도로 보임) | 중 | — |
| 정보 | CollectionToggle | 도감·상세 화면 연결 없음(공개 API만 제공) | 연결부는 화면 담당자 확인 사항 | 높음 | 각 화면 담당 |

## 5. 결론
- FR-29 기능(D-A·D-B·T-1 포함): **PASS** — 직접 실행·추가 시나리오로 세 결함 모두 해결 확인.
- 전체 인수: **FAIL** — 공통 셸 320px 가로 넘침 미해결(TC-08). 기능 코드 문제는 아님.
- 외부 API E2E 9개: **BLOCKED** — 수정 후 실연동 미검증.
- Codex 증거 확인: 단위 286/286, favorites E2E 16/1, mobile-final 2/2 로그 내용이 보고와 일치. 단, `CollectionToggle.tsx`(최종 문구 수정)는 favorites E2E 실행 **이후** 수정되어 Codex의 16개 통과는 최종본 기준이 아니며, 최종본 기준 16개 통과는 이번 Claude 실행이 근거다.
- 미검증: Windows 원본 폴더 실행, git diff 범위, 수정 후 외부 API, 실제 스크린리더 낭독.
- 수정 요청: 공통 헤더 넘침은 관리 책임자에게 이슈로 전달. 기능 코드 추가 수정 요청 없음.
- 사람 승인자: 미정 (TASK 상태 변경하지 않음)
- 문서 갱신 별도 TASK: 필요 시 별도 승인
