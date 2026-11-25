# QA 보고서 — TASK-015 / PR #48

> 최신 재검증: `5dc5046` **FAIL** — 원 재현은 수정됐으나 물수리검 분류·내 게임 왕복 전환 사례가 남음. 상세 결과는 §6.

- 대상 TASK: TASK-015 — 상세 화면의 게임별 기술 섹션
- 요구사항 ID: FR-26·FR-27, TC-12; 보조 검증 NFR-01~04·07~08, TC-08·09·10
- 기준 문서: `docs/SRS.md`, `docs/DESIGN.md`, `docs/OWNERSHIP.md`, `docs/TASKS.md`, `docs/TEST_PLAN.md`, `docs/WORKFLOW.md`, ADR-020(제안)
- PR/Commit: [PR #48](https://github.com/semicolon213/pokefile/pull/48), `206f47efc558169240cb8abebd6f67963a4f610c`
- 비교 기준 develop: `4df19f1903d964efd935772d65d3a6c86a6703fa` (#44·#50 반영)
- 구현자 및 도구: 임지섭(MianShang) / Claude Code — PR 설명 기준
- 독립 검증자 및 도구: Codex, 구현 세션과 별도 QA / Vitest·Playwright Chromium·실제 PokéAPI 응답·스크린샷 검토
- 검증 일자: 2026-11-25 (KST)
- 환경: Windows, Node v24.19.0; PR 스냅샷 `.qa/pr48-206f47e/source`
- 결과: **FAIL** — 게임별 기술 수치 오류와 내 게임 변경 미반영을 재현함. 문서 오류 1건도 확인함.

## 1. 범위 확인

- [x] PR의 제품 코드 변경은 `src/features/pokemon-detail/**`에 한정됨. 테스트는 `tests/{unit,integration,e2e}/pokemon-detail/**`에 추가됨.
- [x] 다른 담당 feature·`src/shared/**`·`src/app/**`·공통 설정·패키지 변경 없음.
- [x] SRS/DESIGN/공통 API 계약의 직접 변경 없음. `/pokemon` 쿼리 키·요청을 기본 정보와 공유함.
- [ ] 명시적인 TASK-015 작업 카드의 `allowed_paths`·`restricted_paths` 및 ADR-020 팀 승인 기록은 PR/작업표에서 확인하지 못함. 소유자 배정과 PR에 기재된 범위를 기준으로 읽기 전용 검증함. 코드 영역 적합성을 정식 승인 증거로 대체하지 않음.
- 문서 변경: `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, `docs/TASKS.md`. ADR-020은 담당자 제안·팀 확인 대기 상태이며 QA가 이를 승인한 것으로 간주하지 않음.
- QA 중 제품 코드·기존 작업 파일·TASK/ADR 상태는 변경하지 않음. 보고서·로그·추가 검증 스크립트·화면 증거만 별도 `.qa/pr48-206f47e/`에 생성함.
- #44와의 중복 파일 `PokemonDetailPage.tsx`는 이미 develop 병합을 포함한 PR HEAD에서 검증함. 종료 시 재조회한 HEAD와 base는 위 SHA와 동일했고 PR은 OPEN/MERGEABLE, verify·e2e CI는 SUCCESS였음. 병합·댓글·승인 리뷰는 수행하지 않음.

PR 변경 파일(14개):

```text
docs/DECISIONS.md
docs/OPEN_QUESTIONS.md
docs/TASKS.md
src/features/pokemon-detail/api/queryKeys.ts
src/features/pokemon-detail/components/MovesSection.css
src/features/pokemon-detail/components/MovesSection.tsx
src/features/pokemon-detail/data/build-moves.mjs
src/features/pokemon-detail/data/moves.json
src/features/pokemon-detail/hooks/useMoves.ts
src/features/pokemon-detail/model/moves.ts
src/features/pokemon-detail/pages/PokemonDetailPage.tsx
tests/e2e/pokemon-detail/moves.spec.ts
tests/integration/pokemon-detail/MovesSection.test.tsx
tests/unit/pokemon-detail/moves.test.ts
```

## 2. 요구사항별 결과

| 요구사항/인수 조건 | 증거 | 결과 |
|---|---|---|
| FR-27: 선택 게임의 레벨업 목록·레벨 순서 | 실제 `/pokemon/6`의 스칼렛·바이올렛 기록과 UI 15행의 기술·레벨을 대조. 진화 → Lv.1 → 오름차순 확인 | PASS(표본) |
| FR-27: 게임별 기술머신·비전머신·기술레코드 | 스칼렛·바이올렛 화염방사 TM125, 소드·실드 TR02를 실제 `/machine/2023`, `/machine/1613`과 대조. 기존 E2E로 레드·블루 풀베기 HM01 확인. 스칼렛·바이올렛 리자몽 머신 61행 확인 | PASS(표본) |
| ADR-020: 기술 가르침·방법별 빈 상태 | 소드·실드 리자몽 5행, 블라스트번 포함. 가르침이 없는 게임은 전용 안내. 세 방법 전환 가능 | PASS(표본) |
| ADR-020: 선택 게임에 맞는 기술 상세 수치 | 레드·블루 리자몽 화염방사의 위력을 90으로 표시. 실제 API의 이전 값은 95. D-015-01 | **FAIL** |
| FR-27: 메가·리전폼·로토무 목록 | 메가리자몽X, 알로라 라이츄, 기본 로토무, 워시로토무의 실제 응답과 기본 선택 게임 레벨업 행을 대조. 워시로토무는 SV에 폼 변경 하이드로펌프가 있고 기본 로토무에는 없음. 메가X에 SV 게임 옵션 없음 | PASS(표본) |
| FR-26·TC-12: 내 게임 없음·첫 선택·새로고침·공유 | 미선택 시 최신 기록인 LEGENDS Z-A로 시작. `?game=red` → 레드·블루, 저장값 red·새로고침 유지. 상단을 실드로 변경(수동 선택 전)하면 소드·실드로 전환. 새 브라우저 컨텍스트에 실드 URL 공유 후 같은 표 확인 | PASS |
| ADR-020: 내 게임 기록이 없는 폼 | `#/pokemon/6?form=mega-x&game=scarlet`에서 데이터 부재 안내, SV 옵션 없음, 최신 기록인 LEGENDS Z-A로 대체 표시. 기본 리자몽 목록으로 바꾸지 않음 | PASS |
| FR-26·TC-12: 기술 표를 수동 변경한 뒤 내 게임 변경 | 표를 SV로 선택한 뒤 상단 내 게임을 실드로 변경하면 URL·저장 선택은 실드지만 표는 SV에 남음. D-015-02 | **FAIL** |
| NFR-01·08: 320·390px, 라이트·다크, 세 방법 | 12개 조합에서 문서 너비가 각각 320/390px. 긴 표만 내부 가로 스크롤, 포커스 후 ArrowRight 이동 확인. 390px 기술 가르침 표는 폭 안에 들어가 스크롤 불필요 | PASS |
| 다크 모드 가독성 | 라이트·다크 스크린샷 육안 확인. 기술 이름/섹션 배경 대비 표본은 각각 15.80:1 / 14.06:1. 전체 토큰·타입 배지의 전수 대비 검증은 아님 | PASS(표본) |
| NFR-02·03·07·TC-09: 로딩·실패·재시도·데이터 없음 | 실제 응답을 기반으로 지연·HTTP 500·빈 moves를 주입. 로딩/오류/빈 상태 구분, 다시 시도 성공, 빈 기술 목록에서도 종족값 섹션 유지 | PASS |
| NFR-04: 요청 재사용·정적 데이터 A안 | 기본 정보와 기술 섹션을 띄우고 게임·방법을 여러 번 바꿔도 `/pokemon/6` 요청 1회. 빌드에서 기술 데이터 별도 청크 101.73kB(gzip 23.46kB) 확인 | PASS |
| OQ-23/ADR-020 추적 정확성 | OQ-23은 OPEN인 채 OQ-18에 기술 표 제안이 기재됨. D-015-03 | **FAIL** |

## 3. 실행한 검증

실제 실행 디렉터리는 별도 PR 스냅샷이며 기존 미커밋 작업을 검증 대상으로 섞지 않았다. 기존 `node_modules`를 junction으로 재사용했고 루트와 PR의 `package-lock.json` Git blob 해시가 `fbcbb0dee2d52599f14528b06facaa15653863c4`로 같음을 확인했다.

| 명령/절차 | 실행 여부 | 결과 | 로그 |
|---|---|---|---|
| `npm.cmd run lint` | 실행 | PASS, 기존 `pokedex/StatFilter.tsx:16` 경고 1건, 모듈 경계 검사 통과 | [lint.log](evidence/TASK-015-pr48-206f47e/lint.log) |
| `npm.cmd run typecheck` | 실행 | PASS | [typecheck.log](evidence/TASK-015-pr48-206f47e/typecheck.log) |
| `npm.cmd test` | 실행 | PASS, 49개 파일·392/392. jsdom scrollTo 미구현 메시지 있음 | [vitest.log](evidence/TASK-015-pr48-206f47e/vitest.log) |
| `npm.cmd run build` | 실행 | PASS. 기존 메인 청크 500kB 초과 경고 있음 | [build.log](evidence/TASK-015-pr48-206f47e/build.log) |
| `CI=1 npm.cmd run test:e2e -- --workers=4` (PowerShell에서는 `$env:CI='1'` 설정) | 실행 | PASS, 72/72, 44.1초 | [playwright.log](evidence/TASK-015-pr48-206f47e/playwright.log) |
| `node .qa/pr48-206f47e/api-audit.mjs` (저장소 루트) | 실행 | PASS, 실제 API 11개 응답 저장·대조. 데이터 차이는 D-015-01로 별도 판정 | [api-audit.log](evidence/TASK-015-pr48-206f47e/api-audit.log), [api-results.json](evidence/TASK-015-pr48-206f47e/api-results.json), [data/](evidence/TASK-015-pr48-206f47e/data/) |
| `node .qa/pr48-206f47e/browser-qa.mjs` (저장소 루트) | 실행 | 최초 실행 exit 1: 10개 검사 완료, 390px 검사 2개는 QA 스크립트의 잘못된 “항상 스크롤 필요” 단정에서 실패. 제품 실패로 집계하지 않음. 제품 이상 동작은 관측값으로 저장함 | [browser-qa.log](evidence/TASK-015-pr48-206f47e/browser-qa.log), [browser-results.json](evidence/TASK-015-pr48-206f47e/browser-results.json) |
| `$env:QA_CASE='mobile-390'; $env:QA_REPORT='browser-mobile390-results.json'; node .qa/pr48-206f47e/browser-qa.mjs` | 실행 | QA 스크립트를 “넘치는 경우에만 스크롤”로 보정 후 해당 두 검사만 재실행, 2/2 PASS·exit 0 | [browser-mobile390.log](evidence/TASK-015-pr48-206f47e/browser-mobile390.log), [browser-mobile390-results.json](evidence/TASK-015-pr48-206f47e/browser-mobile390-results.json) |
| 화면 캡처·육안 검토 | 실행 | 320/390px·라이트/다크 증거 12장과 결함 증거 2장 저장. 320 라이트 레벨업, 320 다크 머신, 390 다크 가르침, 결함 2장 육안 검토 | [screenshots/](evidence/TASK-015-pr48-206f47e/screenshots/) |

실행 환경 관련 기록: 처음 `npm` 호출은 PowerShell의 `npm.ps1` 실행 정책으로 실행되지 않아 `npm.cmd`로 재실행했다. 실패한 초기 호출을 PASS로 집계하지 않았다. 최초 `git archive` tar 추출은 한글 DOCX 4개 이름에서 오류를 냈으며 QA 대상 소스·테스트·설정·문서는 추출되었다. 해당 PBL DOCX는 QA 범위 밖이다. 네트워크 제한으로 GitHub·PokéAPI 조회 및 실제 네트워크 E2E/브라우저 검증은 승인된 실행 환경을 사용했다.

## 4. 결함

| ID / 심각도 | 재현 절차 | 기대/실제 | 위치·근거 | 담당 |
|---|---|---|---|---|
| **D-015-01 / Major** — 선택 게임과 기술 수치 불일치 | 리자몽 상세 → 기술 게임을 레드·블루 → 레벨업 → Lv.46 화염방사 | 기대: 당시 위력 95. 실제: 90. 목록과 머신 번호는 버전별이나 기술 메타데이터는 최신 값만 사용함 | [model/moves.ts:94](https://github.com/semicolon213/pokefile/blob/206f47efc558169240cb8abebd6f67963a4f610c/src/features/pokemon-detail/model/moves.ts#L94), [build-moves.mjs:54](https://github.com/semicolon213/pokefile/blob/206f47efc558169240cb8abebd6f67963a4f610c/src/features/pokemon-detail/data/build-moves.mjs#L54); [화면](evidence/TASK-015-pr48-206f47e/screenshots/red-blue-flamethrower.png), [실제 API 응답](evidence/TASK-015-pr48-206f47e/data/move_flamethrower.json) `past_values`에 power 95 / 변경 경계 x-y, [관측값](evidence/TASK-015-pr48-206f47e/browser-results.json) `historicalFlamethrower` | 임지섭 |
| **D-015-02 / Major** — 내 게임 변경 후 기술 표가 이전 수동 선택에 남음 | `#/pokemon/6?game=red` → 기술 섹션 게임을 스칼렛·바이올렛으로 변경 → 상단 내 게임을 실드로 변경 | 기대: FR-26·TC-12에 따라 새 내 게임인 소드·실드 기술 표. 실제: 헤더·URL은 실드, 표는 SV(15 레벨업/61 머신). 안내만 “내 게임은 실드입니다.”로 바뀜 | [MovesSection.tsx:42](https://github.com/semicolon213/pokefile/blob/206f47efc558169240cb8abebd6f67963a4f610c/src/features/pokemon-detail/components/MovesSection.tsx#L42), 수동 `chosenGame`이 새 `initialGame`보다 계속 우선됨. [화면](evidence/TASK-015-pr48-206f47e/screenshots/my-game-stale-table.png), [관측값](evidence/TASK-015-pr48-206f47e/browser-results.json) `my-game-change-after-manual-game` | 임지섭 |
| **D-015-03 / Minor** — OQ-18을 잘못 갱신 | PR의 `docs/OPEN_QUESTIONS.md` 확인 | 기대: 기술 표 제안은 OQ-23에 연결하고 출현 장소 번역 OQ-18 내용은 유지. 실제: 기술 표 제안·ADR-020이 OQ-18의 상태에 삽입됐고 OQ-23은 OPEN 그대로 | [OPEN_QUESTIONS.md:24](https://github.com/semicolon213/pokefile/blob/206f47efc558169240cb8abebd6f67963a4f610c/docs/OPEN_QUESTIONS.md#L24), [OQ-23:29](https://github.com/semicolon213/pokefile/blob/206f47efc558169240cb8abebd6f67963a4f610c/docs/OPEN_QUESTIONS.md#L29); base→HEAD diff로 확인 | 임지섭, 문서 담당 |

수정 요청:

1. D-015-01: 기술 데이터에 게임별 이전 값을 보존하고 선택 게임에 적용한다. 화염방사(5세대 이전 95, 6세대 이후 90)·하이드로펌프(이전 120, 이후 110) 등 변경 경계 회귀 검증을 추가한다. 타입·명중·PP·과거 물리/특수 분류 역시 최신 값 하나만으로 이전 게임을 설명할 수 있는지 검토한다. 현재 구현의 수치를 최신 기준으로만 유지하려면 화면/요구사항에 대한 별도 팀 결정이 필요하며 QA 중 기준을 완화하지 않는다.
2. D-015-02: 내 게임 변경 시 이전 기술 표 수동 선택의 우선권을 해제하고 새 게임으로 동기화한다. 수동 선택을 유지하려는 제품 의도라면 FR-26·TC-12 및 ADR의 예외 정책을 팀에서 확정해야 한다. 수동 선택 → 상단 내 게임 변경 → 표·안내·새로고침 일치의 통합 검증을 추가한다.
3. D-015-03: OQ-18의 잘못된 수정 내용을 복원하고 OQ-23에 제안 적용 상태를 연결한다. 팀 승인 대기 상태를 승인 완료로 바꾸지 않는다.

## 5. 결론

- **FAIL 사유:** D-015-01·02가 게임별 정확성과 내 게임 연동 인수 조건을 충족하지 못한다. 자동 테스트 및 CI 통과만으로 QA PASS로 처리하지 않는다. D-015-03도 함께 수정 요청한다.
- 통과한 범위: 표본의 레벨업 정렬·TM/HM/TR·가르침·폼별 기술 목록, 내 게임 초기값·저장·공유·데이터 없는 폼 안내, 로딩/오류/재시도/빈 상태·요청 재사용, 320/390px·라이트/다크·표 내부 스크롤.
- 남은 위험/미검증: 1,025종·모든 폼·모든 게임·938개 기술의 게임 원본 대비 전수 검증은 하지 않았다. 이번 정확성 대조의 외부 기준은 검증 당일의 PokéAPI 실제 응답이며 해당 API 자체의 게임 데이터 완전성까지 보장하지 않는다. 실제 모바일 기기·터치·Safari/Firefox·배포 origin은 미검증. 생성 스크립트 전체 네트워크 재생성 및 `verify:api` 전체 실행은 하지 않았고 필요한 API 표본을 별도 대조했다. 정적 데이터 청크 다운로드 실패는 주입하지 않았다.
- 승인 관련: ADR-020/OQ-23의 범위·A안은 제안 상태이며 팀 확인이 남아 있다. QA는 이를 승인하지 않았다.
- 사람 승인자: 임지섭(기능 오너) 및 팀; 승인 미수행.
- 문서 갱신 별도 TASK: QA PASS 후 정책에 따라 별도 승인된 DOC-TASK에서 TASK/ADR 상태를 갱신한다. 이번 보고서로 TASK-015를 QA_PASS/MERGED/DONE 처리하지 않는다.
- 다음 검증: 구현 담당자가 D-015-01·02·03을 반영한 새 PR HEAD를 제공하면 해당 결함과 영향을 받는 테스트를 재검증한다.

- 보고서 PR 범위: 담당 성윤우(`yoonwoo2002`), 허용 경로 `docs/qa/QA_TASK-015_PR-48.md` 및 `docs/qa/evidence/TASK-015-pr48-206f47e/**`. 인수 조건은 검증 커밋·FAIL 판정·재현 절차·실행 로그·미검증 항목을 보존하고 모든 증거 링크가 저장소에서 열리는 것이다. 이번 문서 PR 생성은 사용자가 명시적으로 요청했다.


## 6. 수정 커밋 `5dc5046` 재검증 — 2026-11-25

- 대상: PR #48 `5dc5046b529388eb8e3d7f28e20a015ba5bc7ad2`, 구현 Claude Code / 독립 재검증 Codex.
- 결과: **FAIL — 원 재현 사례는 수정됐지만 D-015-01·02의 추가 사례가 남아 있다.** D-015-03은 PASS.
- 검증 환경: Windows, Node v24.19.0, 정확한 수정 커밋을 별도 사본 `.qa/pr48-5dc5046/source`에 추출해 실행함. 기존 미커밋 제품 코드는 검증에 섞거나 수정하지 않음.
- 보고서 인코딩: `ab34bd8`에서 마지막 범위 문장을 정상 한국어로 다시 작성한 것을 Git blob과 작업 파일에서 확인했다. 해당 수정은 PR #52를 통해 develop `28fa33a`에 이미 병합됐다. 깨진 문자열을 역변환하지 않았고, 이 재검증에서도 정상 문장을 그대로 보존한다.
- 위 §1~5 및 최초 증거는 `206f47e`의 역사적 FAIL 기록이다. 아래는 `5dc5046`에 대한 새 결과이며, 두 실행의 증거를 섞어 PASS로 처리하지 않는다.

### 6.1 결함별 결과

| 항목 | 재검증 결과 | 판정 |
|---|---|---|
| D-015-01 원 재현 — 레드·블루 화염방사 | 실제 브라우저 행이 `Lv.46 / 화염방사 / 불꽃 / 특수 / 95 / 100 / 15`로 수정됨. API의 `past_values`와 일치 | PASS(원 사례) |
| D-015-01 이전 값·타입 표본 | 화염방사 95→90, 하이드로펌프 120→110, 물기의 노말→악, 저주의 ???→고스트, 번개펀치의 3세대 특수→4세대 물리를 확인. 6개 기술의 저장된 `past_values`를 실제 API와 대조 | PASS(표본) |
| D-015-01-R1 — 6세대 물수리검 분류 | X·Y 개굴닌자의 물수리검이 **물리** 대신 **특수**로 표시됨. 최신 분류를 그대로 사용하며 4세대 이후 개별 기술의 분류 변경을 처리하지 않음 | **FAIL / Major** |
| D-015-02 원 재현 — 수동 SV 선택 후 내 게임 실드 | 새 내 게임 소드·실드로 표가 전환되고 `내 게임 실드 기준입니다.` 안내를 확인 | PASS(원 사례) |
| D-015-02-R1 — 내 게임 왕복 | 레드에서 수동 SV 선택 → 실드 → 다시 레드로 바꾸면 과거 SV 수동 선택이 되살아남. 헤더·URL은 레드, 기술 표는 SV | **FAIL / Major** |
| D-015-03 — OQ 기록 위치 | OQ-18은 `OPEN`으로 복원되고 기술 표의 ADR-020 제안은 OQ-23에 기록됨. 팀 확인 대기 상태 유지 | PASS |

### 6.2 남은 재현 사례와 근거

**D-015-01-R1 — 6세대 물수리검의 물리/특수 분류**

1. `#/pokemon/658?game=x`로 이동한다.
2. 기술 섹션의 X·Y 레벨업 표에서 `Lv.36 물수리검`을 확인한다.
3. 기대 분류는 **물리**, 실제 행은 `Lv.36 / 물수리검 / 물 / 특수 / 15 / 100 / 20`이다. Lv.75 행에도 같은 분류가 표시된다.

Pokémon Showdown의 [6세대 원본 데이터](https://github.com/smogon/pokemon-showdown/blob/master/data/mods/gen6/moves.ts)는 `watershuriken: { inherit: true, category: "Physical" }`로 해당 세대의 분류를 명시한다. 현재 PokéAPI `/move/water-shuriken`의 최신 분류는 `special`이며 `past_values`에는 분류 변경 필드가 없어, 이 배열만으로는 해당 이력을 복구할 수 없다.

위치: [moves.ts:111](https://github.com/semicolon213/pokefile/blob/5dc5046b529388eb8e3d7f28e20a015ba5bc7ad2/src/features/pokemon-detail/model/moves.ts#L111). 현재 로직은 3세대까지의 타입별 분류만 바꾸고 4세대 이후에는 최신 `damageClass`를 유지한다. 선택 게임별 분류 변경 이력의 처리 방법을 보완하고 6세대 물수리검을 회귀 사례에 포함해 주세요. 제품 수정은 구현 담당자에게 요청하며 QA가 직접 수정하지 않았다.

증거: [화면](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/screenshots/water-shuriken-xy.png), [UI 관측값](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/recheck-water-ui-results.json), [Showdown 조회 원문](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/data/showdown-gen6-moves.ts.txt), [PokéAPI 원문](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/data/water-shuriken.json).

**D-015-02-R1 — 내 게임을 이전 값으로 되돌릴 때 수동 선택 부활**

1. `#/pokemon/6?game=red`로 진입한다.
2. 기술 섹션에서 게임을 스칼렛·바이올렛으로 수동 변경한다.
3. 상단 내 게임을 실드로 바꾼다. 이 단계는 소드·실드로 정상 전환된다.
4. 상단 내 게임을 다시 레드로 바꾼다.
5. 기대: 레드·블루 표. 실제: 헤더는 레드, URL은 `?game=red`, 표는 스칼렛·바이올렛이며 안내는 `내 게임은 레드입니다.`다.

위치: [MovesSection.tsx:35~44](https://github.com/semicolon213/pokefile/blob/5dc5046b529388eb8e3d7f28e20a015ba5bc7ad2/src/features/pokemon-detail/components/MovesSection.tsx#L35). `chosen.myVersion`을 현재 값과 비교하지만 내 게임 전환 시 이전 `chosen` 자체를 해제하지 않으므로, 이전 버전으로 돌아오면 다시 유효해진다. 내 게임 변경 시 수동 선택의 유효성을 실제로 해제하거나 변경 회차별로 관리해 주세요. 왕복·선택 해제 후 재선택 검증을 추가하는 것이 좋다.

증거: [화면](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/screenshots/my-game-roundtrip.png), [관측값](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/recheck-results.json)의 `myGame.first` 및 `myGame.returned`.

### 6.3 실행한 검증

| 명령 | 결과 | 증거 |
|---|---|---|
| `npm.cmd run lint` | 종료 0. 기존 StatFilter 경고 1건, 모듈 경계 통과 | [lint.log](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/lint.log) |
| `npm.cmd run typecheck` | 종료 0 | [typecheck.log](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/typecheck.log) |
| `npm.cmd test` | 종료 0, 49개 파일 **398/398** 통과 | [vitest.log](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/vitest.log) |
| `npm.cmd run build` | 종료 0, 기존 청크 크기 경고 | [build.log](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/build.log) |
| `CI=1 npm.cmd run test:e2e -- --workers=4` | 종료 0, **72/72** 통과, 41.3초 | [playwright.log](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/playwright.log) |
| `node .qa/pr48-5dc5046/recheck.mjs` | 종료 1. 과거 값·원 화염방사·OQ 위치 3검사 통과, 물수리검 모델 분류·내 게임 왕복 실패. 물수리검 UI 검사는 같은 기술의 두 레벨 행이 잡혀 QA 선택자 오류로 실패 | [recheck.log](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/recheck.log), [관측 JSON](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/recheck-results.json) |
| `QA_CASE=browser-water-shuriken QA_REPORT=recheck-water-ui-results.json node .qa/pr48-5dc5046/recheck.mjs` | Lv.36 행으로 선택자를 보정하고 해당 UI 검사만 재실행. 종료 1, `특수` 표시가 확인되어 실제 분류 오류로 실패. 선택자 오류를 제품 결함으로 세지 않음 | [recheck-water-ui.log](evidence/TASK-015-pr48-206f47e/recheck-5dc5046/recheck-water-ui.log) |

스크린샷 3장(화염방사 수정 확인·남은 두 사례)을 저장하고 남은 두 사례 화면을 육안 검토했다. 이 회차에서는 이전 320·390px×테마 전체 행렬을 반복하지 않았으며 기존 E2E의 390px 검사는 통과했다. 모든 기술·게임 이력 전수 검증, 실기기·다른 브라우저·배포 origin·ADR-020 팀 확인은 여전히 미완료다.

### 6.4 결론

- **재검증 FAIL:** D-015-03과 D-015-01·02의 최초 재현은 해결됐으나, 같은 게임별 정확성·내 게임 동기화 요구에 해당하는 D-015-01-R1 및 D-015-02-R1이 남아 있다.
- 사람 승인·TASK 상태 변경·제품 코드 수정·PR #48 병합은 수행하지 않았다. 자동 테스트 통과와 기존 보고서 PR #52의 병합을 기능 QA PASS로 취급하지 않는다.
- 후속 수정 커밋에서 위 두 사례와 영향을 받는 테스트를 재검증해야 한다.
