> 독립 QA 보고서의 PR 제출용 사본입니다. 원본은 `test-results/qa-task011-inline-media-recheck/qa-report.md`이며 아래 원문 판정은 수정하지 않았습니다.
> 검증 대상 제품 커밋은 `a6f7656`입니다. 보고서의 로그·스크린샷 상대 경로는 원본 산출물 폴더 기준이며, 해당 산출물은 이 Markdown과 함께 커밋하지 않았습니다.

---
# QA 재검증 보고서 — TASK-011 (FR-23) 대표 이미지 이로치 토글·이미지 아래 울음소리

- 대상 TASK: TASK-011 / 담당 성윤우 / 구현 Codex
- 요구사항 ID: FR-23, NFR-01·08 / TC-04·08·09·11
- PR/Commit: `feat/TASK-011-inline-shiny` @ `a6f7656321122cac1cd4a9e392a6d70f9f6eb7e6` (기반 develop `162a632`)
- 독립 검증자 및 도구: Claude Code (Claude Opus 5.5), 사용자 PC의 로컬 Windows 셸. 구현 세션과 분리된 독립 QA
- 검증 일자: 2026-11-06 18:36~18:47 KST
- 이전 보고서: `test-results/qa-task011-inline-media/qa-report.md` (원본·전체 회귀 BLOCKED). 이 보고서는 그 BLOCKED를 원본 Windows 실행 결과로 다시 판정한다. 이전 보고서는 수정하지 않았다.

## 0. 판정

| 구분 | 판정 | 근거 요약 |
|---|---|---|
| **TASK-011 기능** | **PASS** | 원본 폴더에서 lint·typecheck·test(324/324)·build 종료 0, 기능 E2E 10/10(종료 0), 독립 시나리오 44건 PASS(QA 스크립트 판정 오류로 처음 실패한 3건은 스크립트를 고친 뒤 재실행해 통과, §4.1). Blocker·Major·Minor 결함 없음. 상세 담당 확인과 사람 승인은 별도다(§8). |
| **전체 회귀** | **PASS (flaky 1건 별도 기록)** | 전체 E2E 67건: 첫 시도 66건 통과, 1건은 첫 시도 실패 후 재시도에서 통과(**flaky**). 종료 코드 0. flaky는 `tests/e2e/pokedex/list-return.spec.ts:17`(목록→상세 직후 `scrollY`)이다. HEAD에서 retry 없이 15회 반복하면 15/15 통과했다. 원인은 확정하지 못했고, TASK-011 관련성은 낮다고 **추정**한다(§3.3). |

이 판정만으로 TASK를 DONE으로 바꾸거나 PR을 승인·병합하지 않는다.

## 1. 검증 대상·환경

| 항목 | 값 |
|---|---|
| 실행 환경 확인 | 로컬 Windows 셸에서 직접 실행했다(Cowork 사본 아님). Git 소유권 경고는 없었다. 모든 git 명령에 `-c safe.directory=D:/claude/pokefile/task-011-integration`을 해당 명령에만 적용했고 전역 설정은 바꾸지 않았다. |
| 작업 폴더 | `D:\claude\pokefile\task-011-integration` (git worktree, git-dir `D:/claude/pokefile/pokefile/.git/worktrees/task-011-integration`) |
| 브랜치 / upstream | `feat/TASK-011-inline-shiny` / `origin/feat/TASK-011-inline-shiny` |
| HEAD | `a6f7656321122cac1cd4a9e392a6d70f9f6eb7e6`로 **예상과 같다**. merge-base(develop) = `162a632eb5b9…` |
| 미커밋 변경 | 추적 파일 변경 0, index 변경 0. 미추적 파일 1개: `Claude outputs/qa-report.md`(기존 파일, 보존). `test-results/`는 `.gitignore:17`로 무시된다. 실제 검증한 버전은 a6f7656의 작업 트리 그대로다. |
| OS | Windows 11 Home 10.0.26200, x64 |
| Node / npm | **v24.19.0** / 11.17.0. `.nvmrc`는 `22`, `package.json` engines는 `>=22`다. engines 조건은 충족하지만 `.nvmrc`와 메이저 버전이 다르다. Node 22에서는 실행하지 않았다. |
| Playwright | @playwright/test 1.64.1. 설치된 브라우저는 `chromium_headless_shell-1248`이고 실행 버전은 **156.0.8078.4**다(QA 스크립트 `browser.version()`). E2E 기본 설정(Desktop Chrome, headless)을 그대로 사용했다. |
| 4173 포트(실행 전) | LISTEN 없음(`logs/environment-before.txt`) |
| 도구 버전 | vitest 5.0.5, vite 8.3.5, oxlint 1.89.0(로그 기준) |

162a632→a6f7656 변경은 16개 파일이다(+420/−308). battle-tools 소스·기록 9개, battle-tools 테스트 3개, 상세 연결 4개(`api/pokeapi.ts`, `model/detail.ts`, `components/BasicInfoSection.tsx`, `tests/unit/pokemon-detail/detail.test.ts`). `TASK-011.md`에 적힌 CR-011-PORTRAIT-INTEGRATION·CR-011-INLINE-CRY 범위와 일치한다. 공통(app/shared)·패키지·CI 설정 변경은 없다.

## 2. 명령 실행 결과 (원본 폴더, 순차 실행)

로그 경로: `test-results/qa-task011-inline-media-recheck/logs/` (`<n>.stdout.log`, `<n>.stderr.log`, `<n>.exitcode.txt`)

| # | 명령 | 종료 | 결과 | 시간 |
|---|---|---|---|---|
| 1 | `npm.cmd run lint` | 0 | oxlint와 `모듈 경계 검사 통과` | 0.7초 |
| 2 | `npm.cmd run typecheck` | 0 | 오류 없음 | 4.1초 |
| 3 | `npm.cmd test` | 0 | **파일 45개, 테스트 324개 통과**, 실패 0. stderr에는 jsdom `scrollTo()` 미구현 경고만 있다(기존과 같음). | 19.2초 |
| 4 | `npm.cmd run build` | 0 | JS 736.63 kB, CSS 44.87 kB. 500 kB 청크 경고는 기존과 같다. | 4.9초 |
| 5 | `npm.cmd run test:e2e -- tests/e2e/battle-tools/tools.spec.ts --workers=1 --reporter=line --output=…/feature` | 0 | **10 통과**, 실패·flaky 0 | 21.1초 |
| 6 | `npm.cmd run test:e2e -- --workers=1 --reporter=line --output=…/full` | 0 | **67건: 66 통과 + 1 flaky**(재시도 1회 후 통과), 실패 0 | 57.5초 |
| 보조 7 | `… tests/e2e/pokedex/list-return.spec.ts --grep "브라우저 뒤로 가기" --repeat-each=15 --retries=0` | 0 | 15/15 통과(기본 실행과 분리한 보조 실행) | — |

- 5·6번은 **실행할 때만** 해당 PowerShell 프로세스에 `CI=1`을 설정했고, 실행 후 원래 값(빈 값)으로 되돌렸다(`exitcode.txt`의 `CI after=[]`). 그래서 `playwright.config.ts`가 `reuseExistingServer=false`, `retries=1`, `forbidOnly=true`, `trace=on-first-retry`로 적용됐다. flaky 테스트의 재시도 trace는 `full/…-chromium-retry1/trace.zip`에 있다.
- 설정 파일·테스트·해상도·skip·CSS는 바꾸지 않았다. 다른 브라우저나 설정도 쓰지 않았다.

### 2.1 서버 재사용 방지 근거
1. 각 E2E 실행 직전 4173에 LISTEN이 없었다(`5-e2e-feature.exitcode.txt`의 `port4173_before: []`). 6번 직전에는 5번 실행에서 남은 TIME_WAIT만 있었다.
2. `CI=1`이라 `reuseExistingServer=false`다. 이 상태에서 포트가 점유돼 있었다면 Playwright는 재사용하지 않고 오류로 종료한다.
3. 실행 중 3초 간격으로 4173의 LISTEN 프로세스를 기록했다(`logs/5-e2e-feature.port-monitor.txt`, `logs/6-e2e-full.port-monitor.txt`). 기록된 프로세스는 모두 `D:\claude\pokefile\task-011-integration\node_modules\…\vite.js preview --port 4173 --strictPort`(부모 `cmd.exe … vite preview`)였다. stderr에서도 `[WebServer]` 빌드 출력이 확인된다. 실행 후 4173 LISTEN은 없다.

## 3. 회귀 결과 상세

### 3.1 기능 E2E (tools.spec.ts) — 10/10 통과
D-2 161·201 크기와 PNG 대체, 모바일 키보드 조작, 울음소리 대체·재시도, 페이지 전체 너비 검사(PC·320px)를 포함한다. 이전 QA에서 공통 메뉴 넘침으로 실패하던 전체 너비 검사 2건도 이번 기반에서 통과했다.

### 3.2 전체 E2E — 66 통과 + 1 flaky
detail·type-chart·compare·my-game 등 실제 PokéAPI를 쓰는 spec이 모두 통과했다. 클라우드에서 403으로 실패한 9건은 실제 네트워크에서 모두 통과했다. 과거의 실패 2·4·9건 결과는 이번 판정에 쓰지 않았다.

### 3.3 flaky: `pokedex/list-return.spec.ts:17` "브라우저 뒤로 가기: 필터·펼친 카드·스크롤 위치가 유지된다"
- 첫 시도: `list-return.spec.ts:24` `expect(await page.evaluate(() => window.scrollY)).toBe(0)`에서 실패. 기대 0, 실제 **2075**. 재시도(retry #1)에서는 통과했다.
- 해당 단언은 상세 URL로 바뀐 직후 `scrollY`를 polling 없이 한 번만 읽는다. 상세에서 맨 위로 스크롤하는 동작은 앱 공통 `src/app/layout/AppScrollRestoration.tsx`(react-router `ScrollRestoration`)가 맡고, 이 파일은 TASK-011 변경 범위 밖이다.
- HEAD에서 retry 없이 15회 반복한 결과 15/15 통과했다(`logs/7-flaky-head-repeat15.*`).
- 판단: URL 변경과 스크롤 초기화 사이의 타이밍 경쟁으로 **추정**한다. 확신도는 중간이다. TASK-011이 상세 기본 정보의 렌더를 바꿨으므로 렌더 타이밍 영향을 완전히 배제하지는 못한다. 기반 162a632에서의 발생률은 측정하지 않았다. 구현 기록에도 이전 브랜치 상태에서 같은 "목록→상세 scrollY 초기화" 실패가 1회 있었다(구현 측 증거이며 채택하지 않음).
- 제안(테스트 소유자 김형균 판단): 해당 단언을 `expect.poll(() => scrollY).toBe(0)`처럼 대기형으로 바꿀지 검토한다. QA는 수정하지 않았다.

## 4. 독립 브라우저 시나리오

스크립트: `qa-scenarios.mjs`(QA 작성). 결과: `qa-scenarios-results.json`(1차, 44건), `qa-scenarios-results-S3.json`(S3 재실행). 로그: `logs/qa-scenarios-run1.log`, `logs/qa-scenarios-run2-S3.log`.
대상: 이 폴더에서 E2E가 만든 `dist`를 `vite preview --port 4181`로 띄워 실행했다. 4181 서버는 실행 전 비어 있음을 확인했고, 종료 후 명령줄로 본인 프로세스임을 확인한 뒤 종료했다. 브라우저는 Chromium headless shell 156.0.8078.4다.

증거 구분:
- **API-R**: 실제 PokéAPI 응답
- **API-O**: 실제 응답을 받은 뒤 특정 필드만 QA가 변경
- **API-D**: 실제 응답에 지연만 주입
- **IMG-R / IMG-S / IMG-404**: 실제 GitHub 이미지 / QA SVG 바이트 주입 / 404 주입
- **AUD-R / AUD-W / AUD-404**: 실제 GitHub ogg / QA가 만든 10초 440Hz WAV 바이트 주입 / 404 주입
- 스피커 청취는 하지 않았다. 재생 여부는 `paused=false`와 `currentTime` 증가로만 확인했다.

| ID | 시나리오 | 결과 | 증거 | 핵심 측정값 |
|---|---|---|---|---|
| S1-1 | 기본 일반 이미지, switch `aria-checked=false`, 대표 이미지 1장 | PASS | API-R·IMG-R | `showdown/6.gif` 133×140, alt `리자몽`, `.pokemon-portrait` 1개 |
| S1-2 | 클릭·Space·Enter·Enter로 true/false/true/false 전환. 같은 위치에서 src·alt 변경, 일반으로 복귀 | PASS | API-R·IMG-R | 좌표 차이 dx·dy 모두 0, alt `리자몽 이로치`↔`리자몽` |
| S1-3 | 중복 이미지·일반/이로치 버튼·미디어 창·열기/접기 0, switch 1. 전환 중 PokéAPI 요청 0, 음원 요청 0 | PASS | API-R·IMG-R | 대표 이미지 밖의 리자몽 이미지는 진화 트리(`detail-evolution-title`)뿐이다. 진화 트리는 별도 기능이며 중복 미디어가 아니다. |
| S2-{1280,390,320}-{light,dark} | audio 1개가 대표 이미지 영역 안·이미지 바로 아래(간격 12px)·폭 216px 안에 있다. 울음 제목·버튼·안내 문구 0, 실전 세팅 뒤 audio·울음 영역 0, `scrollWidth`=viewport, 조작 전 음원 요청 0 | **6/6 PASS** | API-R·IMG-R·AUD-W | `screenshots/page-*.png` |
| S2-…-focus | Tab으로 토글 도달(`:focus-visible`, outline 2px solid: 라이트 `rgb(37,99,235)`, 다크 `rgb(110,168,254)`). 다음 Tab은 `audio:리자몽 울음소리`이고 같은 outline이 보인다. | **6/6 PASS** | 같음 | `screenshots/portrait-*-focus-{toggle,audio}.png` |
| S3-1 | `preload=none`, autoplay 속성·상태 없음, paused, 조작 전 음원 요청 0 | PASS | API-R·AUD-W | |
| S3-2 | audio에 포커스 후 실제 Space 키로 재생, currentTime 증가 | PASS | API-R·AUD-W | t=0.31초 |
| S3-3 | 재생 중 이로치를 클릭해도 같은 audio 요소가 계속 재생 | PASS | API-R·AUD-W | 같은 요소, 0.31→1.04초 |
| S3-4 | 메가X 탭 → 이전 audio paused·DOM 분리·이후 600ms 동안 시간 정지. 토글은 일반으로 초기화, 새 audio(10034.ogg)는 정지 상태 | PASS (재실행) | API-R·IMG-R·AUD-W | 정지까지 ≤103ms, 조작 후 추가 재생 0.031초 |
| S3-5 | 메가X 재생 중 메가Y 탭 → 이전 audio 중지 | PASS (재실행) | API-R·AUD-W | **메가Y는 실제 API 데이터**(이전 QA는 합성). ≤110ms |
| S3-6 | 재생 중(이로치 ON) 다른 포켓몬(#25)으로 이동 → 이전 audio 중지, 토글 초기화, 25.gif·25.ogg | PASS | API-R·IMG-R·AUD-W | 6ms |
| S3-7 | 재생 중 `도감 목록으로` → audio 중지·DOM 제거, 페이지에 audio 0 | PASS (재실행) | API-R·AUD-W | ≤103ms |
| S3R-1 | 실제 GitHub 일반·이로치 showdown GIF 로드 | PASS | API-R·IMG-R | 둘 다 133×140 |
| S3R-2 | 실제 `latest/6.ogg`를 키보드로 재생 | PASS | API-R·**AUD-R** | HTTP 206, duration 1.005초, t=0.36초. `screenshots/real-media-1280-shiny-playing.png` |
| S4-1 | latest 404 → legacy로 전환. 자동 재생 없음(paused, t=0), 포커스가 새 audio로 이동, 전환 안내 표시 | PASS | API-R·AUD-404·AUD-W | |
| S4-2 | 전환된 legacy를 Space로 재생 | PASS | API-R·AUD-W | |
| S4-3 | latest를 사용자가 재생해 실패 → legacy(사용자 재생 전 legacy 요청 0) → legacy를 사용자가 Space로 재생해 실패 → 재시도 버튼에 포커스, `울음소리를 재생할 수 없습니다.` 표시. 이미지·토글(전환 동작)·종족값·실전 세팅 유지 | PASS | API-R·IMG-R·AUD-404 | `screenshots/cry-all-failed-retry.png` |
| S4-4 | 재시도 버튼에서 Enter → 새 latest audio에 포커스, paused·t=0, 이후 800ms 동안 음원 요청 0 | PASS | API-R·AUD-404 | |
| S4-5 | 응답이 1.5초 지연되는 동안 Shift+Tab으로 토글에 포커스 이동 → latest→legacy 교체와 전체 실패 때 모두 포커스가 토글에 남음 | PASS | API-R·AUD-404(지연) | |
| S4-6·7 | cries가 null이거나 필드가 없으면 audio 0, `울음소리 정보 없음`, 재시도 0, 음원 요청 0(URL을 추정하지 않음), 이미지 유지 | PASS | API-O·IMG-R | `screenshots/cry-missing-portrait.png` |
| S5-1 | 이로치 GIF 404 → 이로치 PNG(`shiny/6.png`, 96→192). 일반 이미지로 대체하지 않음 | PASS | API-R·IMG-404 | |
| S5-2 | 이로치 GIF·PNG 모두 404 → `리자몽 이로치 이미지 없음`, 일반으로 돌아오면 일반 GIF | PASS | API-R·IMG-404 | |
| S5-3 | 일반 GIF 404 → 일반 PNG. 일반 GIF·PNG 404 → `리자몽 이미지 없음`. 이로치는 정상 | PASS | API-R·IMG-404 | |
| S5-4 | 이로치 데이터 null → 정보 없음, 일반 모드로 복귀 가능 | PASS | API-O·IMG-R | |
| S5-size ×4 | 161×107·201×166을 1280·320px에서 원본 1배로 표시하고 이로치 전환도 같은 크기. 로드 후 `.pokemon-portrait` 폭을 120px로 줄이면 이로치 PNG(96px)로 대체되고 이미지·audio(120px)가 영역 안에 있으며 문서 넘침 없음 | **4/4 PASS** | API-R·IMG-S·DOM 폭 축소 **시뮬레이션** | `screenshots/size-*-shrunk.png` |
| S5-size-viewport200 | (보조) viewport를 320→200px로 실제로 줄이면 대표 영역이 134px가 되고 201px 이로치 GIF가 이로치 PNG로 바뀜 | PASS | API-R·IMG-S | |
| S5-rm | 움직임 줄이기(reduce)에서 일반 `6.png`, 이로치 `shiny/6.png` | PASS | API-R·IMG-R | |
| S6-1 | 이로치 ON → 메가X: 토글 false, 10034.gif·10034.ogg / 기본: 6.ogg / 이로치 ON → #25: 토글 false, 25.gif·25.ogg | PASS | API-R·IMG-R | |
| S6-2 | 메가X `/pokemon` 응답을 2.5초 지연시킨 채 메가Y 선택 → 3.5초 뒤에도 URL `form=mega-y`, 메가Y 탭 선택, 10035.gif·10035.ogg, `메가리자몽Y`, 토글 false | PASS | **API-D**(실제 응답 + 지연)·IMG-R | `screenshots/form-late-response-final.png` |
| S6-3 | 리자몽 `/pokemon/6`을 2.5초 지연시킨 채 #25로 이동 → 피카츄 화면·25.gif·25.ogg·alt `피카츄` 유지 | PASS | API-D·IMG-R | |

### 4.1 QA 스크립트 오류와 재실행
- 1차 실행에서 S3-4·S3-5·S3-7이 FAIL이었다(1차 결과 41/44). 원인은 **QA 스크립트 판정 오류**다. 탭·링크를 클릭한 직후, React가 다시 렌더하기 전에 첫 상태를 읽었다. 1차 로그에서도 600ms 뒤 상태는 이미 `paused=true`·`connected=false`였고, 그 사이 재생 증가는 0.016초였다.
- 수정 내용: 조작 시점의 재생 시간을 기록하고, paused가 될 때까지 최대 2초 기다린 뒤 600ms 동안 시간이 늘지 않는지 확인한다(스크립트 주석에 기록). S3 그룹을 재실행한 결과 **9/9 PASS**다. 1차 결과·로그는 보존했다. 제품 코드는 바꾸지 않았다.

### 4.2 렌더 결과 기준 확인
`PokemonMediaSection`(=`PokemonToolsSection`, 제목 `울음소리`·열기/접기 버튼)은 `index.ts`에서 계속 export된다. 그러나 실제 상세 화면에는 `.pokemon-tools`, `section[aria-label="울음소리"]`, 열기/접기 버튼이 모두 0개였다(S1-3, S2 6건). 공개 소스가 남아 있다는 이유로 결함으로 판단하지 않는다.

## 5. 결함·관찰

Blocker·Major·Minor 결함은 **없다**.

| ID | 심각도 | 확신도 | 위치 | 재현 / 근거 | 기대 / 실제 | 수정 제안 |
|---|---|---|---|---|---|---|
| T-1 (재확인) | Trivial | 높음 | `src/features/pokemon-detail/pages/PokemonDetailPage.css:204-214, 495-498` (`.detail-basic__image`) | `grep -rn detail-basic__image src tests` 결과가 CSS 3곳뿐이다. 대표 이미지가 `PokemonImageToggle`로 바뀌어 이 클래스를 쓰는 요소가 없다. | 기대: 사용하지 않는 규칙이 없다. 실제: 사용하지 않는 규칙이 남아 있다. **화면 영향 없음**을 확인했다. 모바일 중앙 정렬은 `.pokemon-portrait`가 직접 처리한다(390px: 87~303 → 중심 195, 320px: 52~268 → 중심 160). | 상세 담당 임지섭이 정리 여부를 결정. TASK-011 병합을 막지 않는다. |
| T-2 (재확인) | Trivial | 불일치 존재: 높음 / 실제 영향: 낮음(**추정**) | `src/features/pokemon-detail/model/detail.ts:72-73` | battle-tools 모델 `model/tools.ts:17-21`은 미디어 URL을 `new URL(v).protocol === 'https:'`로 검증한다. 상세 adapter의 `shinyImageUrls`·`cryUrls`는 truthy 여부만 본다. 같은 파일의 기존 `imageUrls`(71행)도 같은 방식이므로 상세 adapter의 기존 관례를 따른 것이다. | 실제 PokéAPI 응답(#6, 10034, 10035, #25)의 이미지·음원 URL은 모두 https였다. 비 https 또는 잘못된 문자열이 오는 경우의 영향은 확인하지 않았다(추정: 브라우저 mixed-content 처리 후 기존 대체/오류 경로를 탄다). | `TASK-011.md`의 "응답에 실제 제공된 HTTPS URL만 사용" 원칙과 맞추려면 상세 adapter에도 https 검증을 둘지 임지섭이 판단. |
| O-1 (관찰) | — | 낮음(코드 확인, 실행 미검증) | `PokemonImageToggle.tsx:18` | `prefersReducedMotion()`을 렌더할 때 읽는다. 페이지를 연 채로 OS 설정을 바꾸면 다음 렌더 전까지 반영되지 않을 수 있다(**추정**). 처음 연 상태의 동작은 S5-rm에서 PASS다. | 결함으로 분류하지 않음 | 필요하면 matchMedia 구독을 검토 |
| O-2 (관찰) | — | 중간(코드 기반 추정, 실측 안 함) | `BasicInfoSection.tsx` | 기존 `PokemonImage box=192`가 `PokemonImageToggle`(최대 216, `fitSprite`)로 바뀌었다. 원본이 109~192px 사이인 sprite는 예전과 같은 1배다. 97~108px인 sprite는 192 상자에서 1배였지만 216 상자에서는 2배가 될 수 있다(**추정**). 리자몽 133px는 양쪽 모두 1배이고, PNG 96px는 양쪽 모두 192px다. | 의도된 변경인지 확인 필요 | 임지섭 확인 항목(§8) |

## 6. 환경 문제·미검증·원인 미확정

- 환경: Node 24.19.0으로 실행했다(`.nvmrc` 22와 다름. engines `>=22`는 충족). Node 22 결과는 미검증이다.
- 원인 미확정: §3.3의 flaky 1건(타이밍 경쟁 추정, TASK-011 관련성 낮음 추정, 기반 162a632 발생률 미측정).
- 미검증 항목:
  - 실제 스피커 청취
  - Chromium headless shell 외 브라우저(Firefox·Safari·headed Chrome), 실제 모바일 기기, 스크린리더 낭독, Windows 고배율 DPI
  - GitHub Pages 배포 origin
  - 거다이맥스·리전폼 등 메가 외 폼의 이로치·울음소리. 탭은 보이지만 시나리오를 수행하지 않았다.
  - 전체 1025종·전 폼의 실제 미디어 가용성
  - 열린 페이지에서 움직임 줄이기 설정을 바꾸는 경우(O-1)
  - 이미지 영역 축소 4건은 DOM 폭을 바꾼 시뮬레이션이다. 실제 viewport 축소는 201px 이로치 1건만 보조로 확인했다.
- 구현 담당의 보충 로그 `test-results/qa-task011-inline-media/windows-codex-20261106/`에는 종료 코드 기록이 없고 E2E 로그도 없다. 그래서 **판정 근거로 채택하지 않았다.** 구현 담당 자체 결과(324·67 통과)도 재사용하지 않고 직접 실행했다.

## 7. 종료 전후 git 상태·소스 보존

| 시점 | HEAD | `git status --porcelain=v1 --untracked-files=all` | 추적 변경 | index |
|---|---|---|---|---|
| 시작(18:36) | a6f7656 | `?? "Claude outputs/qa-report.md"` | 없음 | 없음 |
| 종료(18:47) | a6f7656 | `?? "Claude outputs/qa-report.md"` | 없음 | 없음 |

- 새로 쓴 파일은 `test-results/qa-task011-inline-media-recheck/` 아래뿐이다(무시 경로). 그 외에는 빌드·테스트의 정상 산출물인 `dist/`와 Playwright의 `test-results/.last-run.json`이 바뀌었다.
- 이전 QA 보고서·로그·보충 로그(41개 파일)와 기존 미추적 파일은 그대로 보존했다.
- checkout·reset·stash·커밋·스테이징·푸시·PR 변경·병합·배포·TASK 상태 변경은 하지 않았다.
- 실행 중 띄운 4181 preview 서버는 종료했다. 4173·4181 모두 LISTEN 없음(`logs/environment-after.txt`).

## 8. 사람 확인 필요

1. **임지섭(상세 담당)**: 상세 연결 4개 파일 확인. CR-011-PORTRAIT-INTEGRATION·CR-011-INLINE-CRY와 대조한 결과, 변경은 기록된 범위와 일치한다.
   - `api/pokeapi.ts`: `RawPokemon.sprites.front_shiny?`, `other.showdown.front_shiny?`, `cries?` 타입 추가(모두 optional)
   - `model/detail.ts`: `PokemonFormDetail`에 필수 필드 `shinyImageUrls`·`cryUrls` 추가. 이로치는 같은 폼의 GIF→PNG만 쓰고 일반 이미지로 채우지 않으며, 음원은 latest·legacy 중복을 제거한다.
   - `BasicInfoSection.tsx`: `PokemonImage(box 192)`를 battle-tools 공개 `PokemonImageToggle(최대 216)`로 교체하고 `key=form.resourceName`으로 연결
   - `detail.test.ts`: 단위 테스트 2건 추가(전체 324건에 포함되어 통과)
   - 판단 요청: T-1 정리 여부, T-2 https 검증 정책, O-2 작은 sprite 표시 배율 변화, 상세 소유 영역 수정에 대한 동의 기록(이전 TASK QA들과 같은 절차 항목)
2. **김형균(공통·도감 테스트)**: §3.3 flaky 테스트 단언의 대기 방식 검토
3. **성윤우 / 팀**: Node 22 실행 여부, 미검증 항목(스피커·다른 브라우저·실기기·메가 외 폼)의 수동 확인 여부
4. **최종 사람 승인**: 이 QA 결과만으로 TASK를 DONE으로 바꾸거나 PR을 승인·병합하지 않는다. 문서·TASK 상태 갱신은 별도로 승인된 문서 작업으로 한다.
