# QA 보고서 — TASK-011

- 대상 TASK: TASK-011 이로치 이미지 전환·울음소리 재생 — 상세 대표 이미지 영역의 공개 컴포넌트 `PokemonImageToggle`·`PokemonCry`(battle-tools)와 상세 연결부
- 요구사항 ID: FR-23, TC-11, NFR-01·07·08, ADR-013, DESIGN §3.3(움직임 줄이기·큰 GIF)
- PR/Commit: PR #31 (`d87a35d`, 병합 `5fe66b6`), PR #34 (`a6f7656`·`d9d21cb`, 병합 `428aae6`), 관련 PR #35 (`5f04767`, 병합 `418114b`) / develop `bf6c129` 기준 검증
- 구현자 및 도구: 성윤우(yoonwoo2002) / Codex (PR #31·#34 본문). PR #35는 김형균(semicolon213), 도구 기록 없음
- 독립 검증자 및 도구: Claude Code 독립 QA 세션 (구현 세션과 별도)
- 검증 일자: 2026-11-18
- 결과: **PASS**

## 1. 범위 확인
- [x] 허용 경로: PR #31은 `src/features/battle-tools/**`, `tests/**/battle-tools/**`만(15파일)
- [~] 타인 소유 영역: PR #34가 상세(임지섭 소유) 4파일 수정 — `pokemon-detail/api/pokeapi.ts`(선택 필드 타입), `model/detail.ts`(`shinyImageUrls`·`cryUrls`), `components/BasicInfoSection.tsx`(기존 `PokemonImage` → `PokemonImageToggle`), `tests/unit/pokemon-detail/detail.test.ts`. TASKS "연결부는 상세 담당(임지섭)이 확인"이 규칙이나 **PR #34 리뷰 0건, 코멘트 0건, 본문의 "상세 담당 연결부 확인" 체크 해제 상태로 병합**(병합자 semicolon213). 동의 기록 없음
- [~] PR #35(semicolon213)가 성윤우 소유 `PokemonImageToggle.tsx`·테스트와 `docs/DESIGN.md` §3.3을 수정. 리뷰 0건. DESIGN은 OWNERSHIP §2상 "3명 합의 후 변경"인데 합의 기록 없음
- [x] SRS 변경 없음. ADR-013(이로치 = `showdown.front_shiny`) 준수
- 참고: PR #34가 언급한 "독립 Windows QA 재검증" 문서는 `src/features/battle-tools/QA_TASK-011_inline_recheck.md`(Claude Code 로컬 세션, 2026-11-06, 커밋 `a6f7656` 대상, 기능 PASS). PR #35 이전 코드 기준이라 이 보고서의 판정 근거로 쓰지 않았다

## 2. 요구사항별 결과
화면 확인은 develop `bf6c129` 빌드를 `vite preview --port 4175`로 띄워 Playwright(Chromium headless)로 수행(`probe-shiny.mjs`, `probe-form.mjs`, `probe-form2.mjs`).

| 요구사항/인수 조건 | 증거 | 결과 |
|---|---|---|
| 이로치 전환(기본 폼) | 피카츄: 일반 `showdown/25.gif` → 토글 후 `showdown/shiny/25.gif`, alt `피카츄 이로치`, `aria-checked` false→true | PASS |
| 이로치 전환(폼) | 메가리자몽X `showdown/10034.gif` → `shiny/10034.gif`(alt `메가리자몽X 이로치`), 알로라 라이츄 `shiny/10100.gif`, 거다이맥스 리자몽 `shiny/10196.gif`. 폼 버튼으로 바꾸면 토글이 일반으로 초기화(E2E `tools.spec.ts:101` 의도된 동작) | PASS |
| 울음소리(PokéAPI `cries`) | `audio src=.../cries/pokemon/latest/25.ogg`, `preload="none"`, 이름 `피카츄 울음소리`. `play()` 후 `paused=false`, `currentTime 0.02`, duration 0.93s(스피커 청취는 미확인). 메가X `latest/10034.ogg`. 후보는 `latest`→`legacy`(`model/detail.ts:72`) | PASS |
| 재생 중 이로치 전환 유지, 화면 이동 시 중지 | 전환 후 `paused=false` 유지, 다른 포켓몬으로 이동 후 재생 중 audio 0개 | PASS |
| 이로치 이미지 없음 | 응답에서 shiny 필드 제거 → 이로치 모드 `이미지 정보 없음`(role=img, 이름 `… 이미지 없음`), 일반 이미지로 대체하지 않음(DESIGN 의도). 실제 데이터: 코라이돈 변신 모습 4·미라이돈 4·메가지가르데는 이로치 없음(84개 표본) → 같은 안내 | PASS |
| 이미지 로드 실패 | shiny GIF·PNG 404 → `이미지 정보 없음` | PASS |
| 울음소리 없음/실패 | `cries` null → `울음소리 정보 없음`. 음원 404 → 1단계 "다른 음원으로 전환" 안내 + 포커스 audio 유지 → 2단계 "재생할 수 없습니다" + `울음소리 다시 시도` 버튼으로 포커스 이동 | PASS |
| 키보드·포커스(NFR-08) | `role=switch` 버튼, Space/Enter로 전환, Tab 다음은 `피카츄 울음소리` audio, 키보드 포커스 시 `outline solid 2px` 표시 | PASS |
| 움직임 줄이기 | `reducedMotion: 'reduce'`: 일반 `25.png`, 이로치 `shiny/25.png`(PNG 먼저, GIF는 마지막 후보, `PokemonImageToggle.tsx:19`) — DESIGN §3.3 개정본과 일치 | PASS |
| 큰 GIF(PR #35) | 파이어 217px → 216px, 레쿠쟈 234px → 216px로 축소, GIF 유지 | PASS |
| 좁은 화면(NFR-01) | 320px 메가리자몽X: 대표 영역 216px, 문서 너비 320(넘침 없음) | PASS |
| 추가 API 호출 없음 | 상세가 받은 `/pokemon` 응답의 sprites·cries만 사용(`BasicInfoSection.tsx:24`) | PASS |

## 3. 실행한 검증
| 명령/절차 | 실행 여부 | 결과 | 로그 |
|---|---|---|---|
| lint (`npm run lint`) | 실행 | PASS — 종료 0, 모듈 경계 통과 | `qa2/lint.log` |
| typecheck (`npx tsc -b`) | 실행 | PASS — 종료 0 | `qa2/tsc.log` |
| test (`npx vitest run`) | 실행 | PASS — 45파일 342/342 (`PokemonImageToggle.test.tsx` 9, `PokemonToolsSection.test.tsx` 10, `tools.test.ts` 14, `toolsApi.test.ts` 4, `detail.test.ts` 21) | `qa2/vitest.log` |
| build (`npm run build`) | 실행 | PASS | `qa2/build.log` |
| E2E (`npx playwright test`, 1회) | 실행 | PASS — 67/67, 재시도 없음(13:18:31~13:19:06). `battle-tools/tools.spec.ts` 10건 포함 | `qa2/e2e.log` |
| verify-api | 실행 | PASS — 14/14 (showdown 이로치 GIF 항목 포함, `cries` 항목은 없음) | `qa2/verify-api.log` |
| 수동 브라우저·API 표본 | 실행 | §2 | `qa2/probe-shiny.log`, `probe-form*.log`, `media-probe.mjs` |

## 4. 결함
| 심각도 | 재현 절차 | 기대/실제 | 담당 |
|---|---|---|---|
| 하 (절차, D-011-01) | PR #34 | 상세(임지섭 소유) 4파일 변경에 상세 담당 확인 기록 없음(리뷰·코멘트 0, 체크박스 미체크로 병합) | 임지섭 확인 필요 |
| 하 (절차, D-011-02) | PR #35 | 김형균이 성윤우 소유 컴포넌트와 DESIGN §3.3을 리뷰·합의 기록 없이 변경 | 성윤우·팀 |
| 하 (D-011-03) | `#/pokemon/718?form=mega`, `#/pokemon/1007?form=limited-build` | 일반·이로치 모두 `이미지 정보 없음`. ADR-016의 대체 순서(HOME 일러스트·기본 폼 이미지)는 이 컴포넌트에 없음. #34 이전 `PokemonImage`도 같아서 회귀는 아니며 TASK-024(BACKLOG) 범위 | 임지섭(TASK-024)·성윤우 |
| 하 (D-011-04) | `battle-tools/index.ts:4-5` | 상세에서 쓰지 않는 `PokemonMediaSection`(+ `usePokemonTools` 조회)이 공개 API로 남음. 기능 영향 없음 | 성윤우 |
| 하 (문서) | `docs/TASKS.md` | PR #31·#34 병합 후에도 TASK-011이 READY. 작업 기록·QA 사본이 `src/features/battle-tools/*.md`에 있어 `docs/qa` 체계 밖 | 성윤우 |

## 5. 결론
- PASS/FAIL/BLOCKED 사유: 기본·메가·리전·거다이맥스 폼에서 이로치 이미지가 같은 폼 기준으로 전환되고, PokéAPI `cries` 음원이 재생되며, 데이터 없음·로드 실패·움직임 줄이기·키보드 조작이 모두 안내 또는 대체로 처리되었다. FR-23 인수 조건("지원 데이터가 있으면 이미지 전환 및 소리 재생")을 충족한다.
- 남은 위험/미검증 항목: 스피커 실제 청취, Chromium 외 브라우저·실기기·스크린리더 미확인. 실제 폼 전체(1,350개)의 이로치·음원 가용성은 84개 표본만 확인. 상세 연결부 담당 확인 미기록.
- 수정 요청: 없음(하 항목은 선택 또는 절차 보완).
- 사람 승인자: 성윤우(기능 오너), 상세 연결부 임지섭
- 문서 갱신 별도 TASK: TASKS 상태 정정, DESIGN §2.2 대표 이미지 영역(이로치 토글·울음소리 배치) 반영, PR #35의 DESIGN §3.3 변경 합의 기록
