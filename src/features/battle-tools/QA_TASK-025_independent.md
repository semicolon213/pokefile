# QA 보고서 — TASK-025 (실전 세팅 세대 탭·폼 매핑)

- 대상 TASK: TASK-025 / 요구사항: FR-17·18, DR-08, NFR-01~04·07~08 / 관련 테스트: TC-06·08·09 / 설계: ADR-016
- 브랜치: `feat/TASK-025-smogon-generations` (`.git/HEAD` 확인) / HEAD = 기준 커밋 `bf6c129518738f22ecd86d765130d808aa3cf005`
- 검증 대상: 커밋되지 않은 변경 17개(수정 10 + 미추적 신규 7)
- 구현자 및 도구: 성윤우 / Codex
- 독립 검증자 및 도구: Claude (Cowork, 독립 QA 세션) — 구현 세션과 별개
- 검증 일자: 2026-11-18 (KST)
- **판정 요약**
  - 담당 코드 검증(battle-tools 범위): **FAIL** — Major 결함 1건(D-01), Minor 2건, Trivial 다수
  - TASK-025 전체 인수: **FAIL (+ BLOCKED 항목 포함)** — D-01 수정 필요, 그리고 CR-025-SMOGON-SCOPE 승인·적용 전에는 실제 앱의 다중 세대 동작·다중 세대 E2E 3건이 검증 불가(BLOCKED)이므로 QA PASS 불가

> 판정 표기: PASS(증거로 확인) / FAIL(결함 확인) / BLOCKED(선행 조건·환경 때문에 확인 불가) / NOT RUN(실행 안 함) / SKIPPED(테스트가 건너뜀)

---

## 1. 검증 방법과 환경 (재현성에 영향하므로 먼저 기재)

| 항목 | 내용 |
|---|---|
| 사용자 PC 접근 | `D:\claude\pokefile` 폴더 읽기·쓰기 권한만 부여됨. **사용자 PC에서 셸(git·npm.cmd) 실행 수단이 없었다.** |
| 작업 트리 재구성 | GitHub `semicolon213/pokefile`을 클론해 `bf6c129` 체크아웃 → 사용자 PC의 `src/`·`tests/`·루트 설정 파일을 그대로 덮어씀 → `git status`/`git diff`로 변경 범위 확정 |
| 변경 범위 확인 근거 | ① 사용자 PC의 `.git/index`를 클론에 넣어 `git diff-index --cached HEAD` → 스테이징된 변경 없음(290개 항목 동일) ② index에 기록된 파일별 mtime과 PC의 실제 mtime 비교 → TASK-025 시각(1794976xxx) 이후 바뀐 파일은 아래 17개뿐 ③ 공통 설정·shared 파일은 내용까지 가져와 diff → 변경 없음 |
| 실행 환경 | Linux 6.18 컨테이너, Node v22.23.5(.nvmrc 22 충족), npm 10.9.9, `npm ci`(lockfile 기준, 159 패키지), TypeScript 6.0.3, Vitest 5.0.5, Playwright 1.64.1 + 사전 설치 Chrome for Testing 157(headless shell build 1243) |
| 명령 차이 | 지정된 `npm.cmd …`는 Windows 전용이므로 동일 스크립트를 `npm run …`으로 실행했다. **Windows에서의 재현은 하지 못했다(미검증).** |
| 외부 네트워크 | QA 샌드박스는 `data.pkmn.cc`·`pkmn.github.io` 접속이 차단됨. `raw.githubusercontent.com/pkmn/smogon/main/data/sets/gen{9,8,7,6}.json`은 접속 가능 → 같은 출처 저장소의 스냅샷을 보조 증거로 사용(키 수 656/624/830/728로 구현 기록과 일치, SHA256은 `scripts/data/SHA256SUMS`) |

## 2. 범위 확인

### 2.1 변경 파일 17개 (구현 기록과 일치)

| 구분 | 파일 |
|---|---|
| 수정(10) | `src/features/battle-tools/api/queryKeys.ts`, `api/smogon.ts`, `components/SmogonSetsSection.css`, `components/SmogonSetsSection.tsx`, `hooks/useSmogonSets.ts`, `model/smogon.ts`, `tests/e2e/battle-tools/smogon.spec.ts`, `tests/integration/battle-tools/SmogonSetsSection.test.tsx`, `tests/integration/battle-tools/fixtures.ts`, `tests/unit/battle-tools/megaSets.test.ts` |
| 신규·미추적(7) | `src/features/battle-tools/TASK-025.md`, `model/generations.ts`, `tests/e2e/battle-tools/smogon-generations.spec.ts`, `tests/integration/battle-tools/SmogonGenerations.test.tsx`, `tests/integration/battle-tools/verify-live-smogon.mjs`, `tests/unit/battle-tools/forms.test.ts`, `tests/unit/battle-tools/generations.test.ts` |

증거: `logs/00-git-status-before.txt`, `logs/git-diff-stat.txt`, `logs/git-diff-tracked.patch`, `logs/untracked-files.txt`

| 점검 | 결과 | 증거 |
|---|---|---|
| 허용 경로(`src/features/battle-tools/**`, `tests/{unit,integration,e2e}/battle-tools/**`)만 변경 | PASS | 위 17개 모두 허용 경로 |
| 공통 설정 `src/shared/config/scope.json`·`scope.ts` 미변경 | PASS | PC 파일 내용 diff 없음, `smogon = {"generation": 6}` 유지 |
| 다른 feature·`src/shared/**`·`src/app/**`·`scripts/**`·`docs/**`·패키지/설정 변경 없음 | PASS | index mtime·내용 비교, `.github`·`PBL Report`도 index와 동일 |
| 루트의 `pokefile/`, `task-011-integration/`, `task-017-checklist/` | 조작하지 않음(목록만 확인). 이 QA의 재구성 트리에는 포함하지 않았다 | — |
| `git diff --check` | PASS (exit 0) | — |
| QA 작업이 제품 트리를 바꾸지 않았는지 | PASS — 실행 전후 `git status` 동일(QA 산출물 폴더 제외) | `logs/00-…`, `logs/99-git-status-after.txt` |
| 정식 TASK 상태(TASKS.md TASK-025 = BACKLOG)·정책 문서 | 변경 없음. 참고: 작업 기록상 진행 중이나 TASKS.md 상태는 BACKLOG 그대로(문서 갱신은 별도 승인 작업) | — |

## 3. 실행한 명령과 결과

| # | 명령 (QA 실행) | 종료 코드 | 결과 | 로그 |
|---|---|---|---|---|
| 1 | `npm run lint` | 0 | PASS — oxlint 경고·오류 없음, 모듈 경계 검사 통과 | `logs/lint.log` |
| 2 | `npm run typecheck` | 0 | PASS | `logs/typecheck.log` |
| 3 | `npm test` | 0 | PASS — **48개 파일, 370개 테스트 통과**(jsdom `scrollTo` 미구현 안내만 출력) | `logs/test.log` |
| 3a | `npx vitest run tests/unit/battle-tools tests/integration/battle-tools --reporter=verbose` | 0 | PASS — 13개 파일, 100개 테스트 | `logs/test-battle-tools-verbose.log` |
| 4 | `npm run build` | 0 | PASS — `index-DGcU_Wc-.js` 751.12 kB, **500 kB 초과 청크 경고**(기존과 동일) | `logs/build.log` |
| 5 | `node tests/integration/battle-tools/verify-live-smogon.mjs` | 1 | **BLOCKED** — `getaddrinfo ENOTFOUND data.pkmn.cc`(QA 샌드박스 egress 차단). 제품 결함 아님 | `logs/verify-live-smogon.log` |
| 6 | `npx playwright test tests/e2e/battle-tools/smogon.spec.ts tests/e2e/battle-tools/smogon-generations.spec.ts --workers=1 --reporter=list --output=…/e2e` (지정 명령 그대로) | 1 | 환경 실패 — 4개가 `chromium_headless_shell-1248` 실행 파일 없음으로 시작 불가, 3개 SKIPPED. 제품 결함 아님(브라우저 재설치 금지 환경) | `logs/e2e-01-required-command-env-fail.log` |
| 6b | 위와 동일 명령 + `-c scripts/playwright.qa.config.ts`(저장소 설정 그대로, 사전 설치 Chromium 경로만 지정, `reuseExistingServer:false`) | 0 | **기존 4개 PASS, 다중 세대 3개 SKIPPED** (`CR-025-SMOGON-SCOPE 승인 … 대기`) | `logs/e2e-02-qa-chromium.log`, 스크린샷 `e2e/…TC-08…/smogon-mobile.png` |
| 7 | QA 추가 Vitest `-c scripts/vitest.qa.config.ts` (3개 파일) | 0 | 16개 테스트 실행. 관찰형 테스트의 기록값은 §5·§6에 반영 | `logs/qa-vitest-all.log`, `logs/qa-live-mapping.log` |
| 8 | QA 추가 E2E `-c scripts/playwright.qa-own.config.ts` (실제 설정, 1280px·320px) | 0 | 2개 PASS | `logs/e2e-03-qa-own.log`, `screenshots/real-config-gen6-{desktop,mobile320}.png` |

**E2E 서버 출처 확인:** 6b·8 모두 실행 전 4173 포트가 비어 있었고 `pw:webserver` 로그에 `Starting WebServer process npm run build && npx vite preview …`와 이 트리의 빌드 출력이 찍혔다(`reuseExistingServer:false`로 강제). 즉 다른 폴더의 빌드를 재사용하지 않았다. 참고로 사용자 PC의 `dist/assets/index-DGcU_Wc-.js`(751,127 B, mtime이 구현자 E2E `.last-run.json` 7초 전)는 QA가 현재 소스로 만든 번들과 **해시 파일명·크기가 같다** → 구현자의 마지막 E2E 재실행도 현재 소스 빌드였을 가능성이 높다(정황 증거, 확신도 중).

### 3.1 구현자 기록과의 비교 (전달받은 기록은 비교용)

| 항목 | 구현자 기록 | QA 독립 재현 | 비고 |
|---|---|---|---|
| 단위·통합 | 48개 파일, 370개 통과 | 48개 파일, 370개 통과 | 일치 (Linux) |
| lint / typecheck / build | 성공 | 성공 | 일치, 청크 경고 동일 |
| 실제 API | 세대 파일 4개 정규화, 대표 폼 7건 성공 | 스크립트 BLOCKED. 대체로 GitHub raw 스냅샷에서 키 수 4개 일치, 대표 폼 7건 모두 결과 있음 확인 | data.pkmn.cc 자체·CORS·리다이렉트는 QA 미확인 |
| 관련 E2E | 기존 4 통과, 다중 세대 3 건너뜀 | 기존 4 통과, 다중 세대 3 건너뜀(브라우저 경로 지정 후) | 일치 |

## 4. 시나리오별 결과

| # | 시나리오 | 결과 | 증거 |
|---|---|---|---|
| S-01 | 세팅이 있는 9·8·7·6세대만 최신순 표시 | PASS(mock) / **BLOCKED(실제 앱)** | `SmogonGenerations.test.tsx` "실제 세팅이 있는 세대만…", 코드 `generations.ts` 정렬. 실제 설정은 `[6]`만(QA-CFG-01) |
| S-02 | 최초 표시·종/폼 변경 시 최신 세대 선택 | PASS(mock) / BLOCKED(실제 앱) | 섹션이 `pokemonId:species:formKey`로 key → 상태 초기화. 구현 테스트 "종·폼 변경 시…" |
| S-03 | 세대 전환 시 이전 포맷·세팅이 남지 않음 | PASS | `SmogonFormats key={generation}`; 구현 테스트·E2E 설계 확인 |
| S-04 | 늦은 최신 세대 응답이 사용자가 고른 세대를 덮어쓰지 않음 | 명시적 탭 선택: PASS / **탭을 누르지 않은 경우: FAIL(D-02, Minor)** | QA-UI-01: 8세대에서 포맷 선택 후 9세대 도착 → 탭 9세대로 바뀌고 포맷·표시 세팅 사라짐 |
| S-05 | 세대별 캐시 분리, 같은 파일 중복 요청 감소 | PASS | Query Key `['smogon','gen{N}']`; 구현 테스트 + QA-UI-03(두 섹션 동시 마운트 → 세대당 1회 요청) |
| S-06 | 로딩·정상 부재·HTTP 오류·스키마 오류 구분 | PASS(부재 vs 실패) / 관찰(HTTP·스키마는 UI 문구 동일) | QA-UI-04: 503·404·스키마 오류 모두 "N세대 … 불러오지 못했습니다." alert, 부재 문구 미표시. 데이터 계층은 `ApiError.kind`로 구분 |
| S-07 | 일부 세대 실패·재시도 중 성공 세대 사용 | PASS | 구현 테스트 "일부 세대 실패…" (재시도 대기 중 8세대 유지) |
| S-08 | 종·폼 전환 + 늦은 응답이 다른 포켓몬 세팅을 표시하지 않음 | PASS | QA-UI-02: 요청 대기 중 리자몽→알로라 라이츄 전환 후 응답 → 알로라 세팅만 표시 |
| S-09 | 리전폼·이름이 다른 폼 정확 연결, 실패 시 기본 폼 대체 금지 | 대체 금지: PASS / **정확 연결: FAIL(D-01, Major)** | QA 폼 감사(인덱스 폼 전체 × 4세대): 기본 폼 대체·교차 오염 없음. 단 네크로즈마 황혼/새벽, 오거폰 가면 3종 미연결 |
| S-10 | 메가 세팅 6·7세대 제한, 최신 메가 부재 처리 | PASS | QA-UI-05(9·8세대에 정확 메가 키가 있어도 요청·표시 안 함), 실데이터 감사에서 8·9세대 메가 결과 0건, Z-A 메가는 모든 세대 0건 |
| S-11 | 메가스톤 후보 + 정확한 메가 키 병합, 다른 폼·아이템 미혼입 | PASS | `megaSets.test.ts`; 실데이터 교차 오염 감사 — 코드 원인 0건(원본 파일 자체 중복 3건만, §6) |
| S-12 | 메가레쿠쟈 = anythinggoes + Dragon Ascent만, 기본 레쿠쟈와 분리 | 6·7세대: PASS / 8세대 National Dex AG: **의심(D-03, Minor, 사양 결정 필요)** | `logs/qa-rayquaza.json`: gen6/7 mega = anythinggoes 4세트씩, 기본 탭에서 제외. gen8 기본 탭에 `dlc1nationaldexag` 화룡점정 3세트 표시 |
| S-13 | 원본 응답·캐시 비변형 | PASS | 정규화 결과를 deep-freeze 후 인덱스 모든 폼×4세대 선택 → 예외·변경 없음 |
| S-14 | 변칙 포맷 9종 제외 | PASS | 전 결과에 나타난 포맷 목록(`logs/qa-formats-seen.txt`)에 9종 없음. 참고: gen9 `inheritance`(OM)는 ADR 목록 밖이라 표시됨(D-05) |
| S-15 | OQ-19 미확정 — 기존 포맷 선택 방식 유지 | PASS | 기본값 "포맷을 선택하세요"(빈 값), 자동 선택 없음. 실제 앱 E2E·스크린샷 |
| S-16 | 탭 키보드·포커스·ARIA·한국어·모바일 | jsdom·실제 앱 단일 탭: PASS / **다중 탭 실제 브라우저·320px: BLOCKED** | QA-UI-06(aria-controls=tabpanel id, aria-labelledby=선택 탭, roving tabindex, 방향키/Home/End는 구현 테스트), QA E2E 320px 가로 넘침 없음·Tab→포맷 선택 도달. 다중 세대 320px E2E는 SKIPPED |
| S-17 | 기존 공개 컴포넌트·상세 연결 유지 | PASS | `SmogonDetailConnection.test.tsx`, 기존 E2E 4개, `index.ts` 미변경 |
| S-18 | 실제 API 연결(data.pkmn.cc) | **BLOCKED** | §3 #5 |
| S-19 | 실제 앱 다중 세대 E2E 3건 | **SKIPPED → BLOCKED** (CR-025-SMOGON-SCOPE 승인 대기) | §3 #6b. QA는 설정을 임시 수정하지 않았다 |

## 5. 결함

| ID | 심각도 | 확신도 | 위치 | 요약 |
|---|---|---|---|---|
| D-01 | **Major** | 높음 | `src/features/battle-tools/model/smogon.ts:103-121` (`FORM_NAMES`, `smogonFormName`) | PokéAPI 폼 이름과 Smogon 키가 다른 폼 일부가 매핑표에 없어, 실제 세팅이 있는데 "등록된 실전 세팅이 없습니다"(정상 부재)로 표시됨 |
| D-02 | Minor | 동작 높음 / 사양 해석 중 | `src/features/battle-tools/components/SmogonSetsSection.tsx:39-45` | 탭을 누르지 않은 사용자가 먼저 도착한 세대에서 포맷을 고른 뒤, 더 최신 세대가 늦게 도착하면 화면이 최신 세대로 바뀌고 선택한 포맷·세팅이 사라짐 |
| D-03 | Minor | 중 (사양 공백) | `model/smogon.ts:151-157` | 8세대 기본 레쿠쟈 탭에 메가가 허용되는 `dlc1nationaldexag`(National Dex AG)의 화룡점정 세팅이 표시됨 |
| D-04 | Trivial | 중 | `model/smogon.ts:103` (`FORM_NAMES`) | 일가족(Maushold) 기본 폼(PokéAPI family-of-four)에 Showdown `Maushold`(세 식구) 세팅이, `Maushold-Four` 세팅은 어디에도 연결 안 됨 |
| D-05 | Trivial / 질문 | 중 | `model/smogon.ts:26-29` | gen9 `inheritance`(변칙 OM)가 제외 목록 밖이라 표시됨 — ADR-016 목록에는 없으므로 코드가 아닌 사양 확인 사항 |
| D-06 | Trivial | 높음 | `SmogonSetsSection.tsx:55`, `api/smogon.ts:7` | 문구·분류 경미 사항 묶음 |

### D-01 (Major) — 이름이 다른 폼의 Smogon 키 미연결
- 재현 절차
  1. QA 실데이터 스냅샷(`scripts/data/gen*.json`)으로 `selectSmogonSets(data, { speciesName: 'necrozma', formKey: 'dusk' }, 7|8|9)` 호출 → `[]`.
  2. 같은 방식으로 `ogerpon` / `wellspring-mask`·`hearthflame-mask`·`cornerstone-mask`(gen9) → `[]`, `necrozma` / `dawn`(gen7·8) → `[]`.
  3. UI에서는 위가 정상 부재로 처리되어 `등록된 실전 세팅이 없습니다.`가 표시된다(CR 적용 후 실제 앱에서 발생; 현재 6세대 전용 앱에서는 해당 데이터가 원래 없음).
- 기대: 검증된 Smogon 이름으로 연결(AC-3, FR-17·DR-08) — `Necrozma-Dusk-Mane`, `Necrozma-Dawn-Wings`, `Ogerpon-Wellspring`, `Ogerpon-Hearthflame`, `Ogerpon-Cornerstone`.
- 실제: `Necrozma-Dusk`, `Ogerpon-Wellspring-Mask` 등으로 조회해 키를 찾지 못함. 놓치는 일반 포맷 세팅 수(스냅샷 기준): 네크로즈마 황혼의 갈기 gen9 7·gen8 16·gen7 11, 새벽의 날개 gen8 1·gen7 2, 오거폰 우물/화덕/주춧돌 gen9 19·12·11.
- 영향: 상위권 인기 폼의 세팅이 "정보 없음"으로 잘못 안내됨(FR-18의 부재 안내가 사실과 다름). 다른 포켓몬 세팅을 보여 주지는 않음.
- 근거 파일: `logs/qa-form-mapping-misses.txt`, `logs/qa-form-mapping-audit.tsv`(인덱스 326개 폼 × 4세대 결과)
- 최소 수정 제안: `FORM_NAMES`에 `necrozmadusk: 'Necrozma-Dusk-Mane'`, `necrozmadawn: 'Necrozma-Dawn-Wings'`, `ogerponwellspringmask: 'Ogerpon-Wellspring'`, `ogerponhearthflamemask: 'Ogerpon-Hearthflame'`, `ogerponcornerstonemask: 'Ogerpon-Cornerstone'` 추가(+ D-04 결정 반영). 회귀 방지로 인덱스의 전체 폼 키를 Showdown pokedex 키와 대조하는 단위 테스트(고정 fixture) 추가 권장.
- 담당: 성윤우(구현 Codex)

### D-02 (Minor) — 늦은 최신 세대 도착 시 화면 전환·포맷 초기화
- 재현 절차(QA-UI-01): 다중 세대 mock 설정에서 9세대 요청만 지연 → 8세대 탭이 기본으로 표시됨 → 포맷 `ou` 선택, 8세대 세팅 표시 확인 → 9세대 응답 도착.
- 기대: 사용자가 이미 보고 조작 중인 세대·포맷을 늦은 응답이 덮어쓰지 않거나, 최신 세대가 확정되기 전에는 탭을 확정하지 않음.
- 실제: `9세대:true 8세대:false | combobox: "" | 8세대·9세대 세팅 모두 미표시` — 읽던 세팅이 사라짐. 명시적으로 탭을 누른 경우는 유지됨(구현 테스트와 일치).
- 영향: 느린 네트워크(TC-09)에서 화면이 갑자기 바뀌고 입력이 사라짐. 스크린리더 사용자는 맥락 상실. 구현 테스트 "일부 세대 실패…재시도"는 재시도 성공 시 이 전환을 의도된 동작으로 기대하고 있어 **사양 해석 확인이 필요**.
- 최소 수정 제안: 포맷을 고르거나 표시가 확정되는 시점에 `setSelectedGeneration(selected.generation)`으로 고정하거나, 더 최신 세대가 `isPending`인 동안은 기본 선택을 확정하지 않음(재시도 성공 시 자동 전환 여부는 기능 오너 결정).

### D-03 (Minor, 사양 공백) — 8세대 기본 레쿠쟈에 National Dex AG 화룡점정 세팅
- 재현: 스냅샷 gen8 `Rayquaza.dlc1nationaldexag`(Setup Sweeper·Mixed Life Orb·Choice Band, 모두 Dragon Ascent) → 기본 폼 8세대 탭에 표시(QA-UI-07, `logs/qa-rayquaza.json`).
- 판단: ADR-016은 메가를 6·7세대 탭으로, 메가레쿠쟈 규칙을 `anythinggoes`로 한정하므로 코드는 ADR 문구와 일치한다. 다만 National Dex AG는 메가진화가 허용되는 포맷이라 이 세팅들은 사실상 메가레쿠쟈용일 가능성이 높아 "기본 레쿠쟈와 분리" 취지와 충돌할 수 있다.
- 조치: 기능 오너가 ADR 해석을 결정(8세대 natdex AG 화룡점정 세팅을 기본에서 제외할지). 결정 전에는 코드 수정 요구 아님.

### D-04 (Trivial) — 일가족 폼 이름 반대 매핑
- PokéAPI 기본 폼은 `maushold-family-of-four`, Showdown `Maushold`는 세 식구, `Maushold-Four`가 네 식구. 현재 기본 탭에 세 식구 세팅, `family-of-three` 탭은 부재, `Maushold-Four`(gen9 ru·1v1) 미연결. 능력치가 같아 실사용 영향은 작음. 매핑을 바꿀지 기능 오너 결정.

### D-05 (Trivial/질문) — `inheritance` 포맷
- gen9 `inheritance`는 다른 포켓몬의 특성·기술을 빌리는 변칙 룰이지만 ADR-016 제외 9종에 없다. 코드는 ADR대로. 제외 목록 확장 여부는 사양 결정 사항.

### D-06 (Trivial) — 경미 사항 묶음
- 표시할 세대가 아직 없고 다른 세대가 실패한 상태에서 `다른 세대의 실전 세팅을 불러오는 중입니다.`가 나온다(QA-UI-08). "다른"이 가리키는 대상이 없어 어색함.
- 재시도 중에도 실패 문구가 그대로 남고 진행 표시가 없다(`isError` 유지, `isPending` false). 버튼 반복 클릭 가능.
- HTTP 오류와 스키마 오류의 UI 문구가 같다(데이터 계층 `ApiError.kind`는 구분). FR-18의 "부재 vs 실패" 구분은 충족.
- `fetchSmogonSets`의 잘못된 세대 값이 `ApiError('parse')`로 분류됨(스키마 오류와 의미가 섞임).
- Mega Rayquaza 표시 시 화룡점정이 있는 기술 슬롯의 다른 후보를 지운다(`smogon.ts:162-165`). 현재 실데이터에서는 해당 슬롯이 모두 단일 기술이라 영향 없음. ADR에 없는 변환이므로 기록만 함.

## 6. 결함이 아닌 확인 사항
- 교차 오염 감사에서 나온 3건(gen8 Thundurus/therian `nationaldex` Nasty Plot, Zarude/dada `uu` 2건)은 **원본 파일이 기본 키와 폼 키 양쪽에 같은 세팅을 담고 있는 데이터 중복**이며 코드 원인이 아니다(`logs/qa-cross-contamination.txt`, SOURCE-DUPLICATE).
- 9·8세대 National Dex 데이터에 있는 메가 키(`Alakazam-Mega` 등)·메가스톤 세팅은 메가 탭(6·7 한정)과 기본 탭 어디에도 표시되지 않는다. ADR-016대로.
- Z-A 이후 메가(예: `garchomp-mega-z`)는 어느 세대에도 세팅이 없고 기본·다른 메가로 대체되지 않는다.

## 7. 선행 조건·환경 제약 (결함과 구분)

| ID | 구분 | 내용 | 영향 | 필요한 조치 |
|---|---|---|---|---|
| P-01 | **선행 조건(승인 대기)** | CR-025-SMOGON-SCOPE 미승인 → `scope.json`은 6세대만. 실제 앱은 6세대 탭 하나만 표시(QA-CFG-01, QA E2E 스크린샷) | S-01·02·16·19의 실제 앱 검증 BLOCKED, 다중 세대 E2E 3건 SKIPPED | 공통 책임자(김형균) 승인·적용 후 다중 세대 E2E 3건 + 320px 시각 확인 + 본 보고서 S-01·02·04·16 재검증 |
| P-02 | 환경 | QA 샌드박스에서 data.pkmn.cc 차단 → 실제 API 스크립트 BLOCKED | 실제 URL·리다이렉트·CORS 미확인(QA) | 네트워크가 되는 PC에서 `node tests/integration/battle-tools/verify-live-smogon.mjs` 재실행 기록 첨부 |
| P-03 | 환경 | 지정 E2E 명령이 브라우저 빌드 불일치(1248 필요, 1243 설치)로 시작 불가 → 경로 지정 설정으로 재실행 | 결과에는 영향 없음 | — |
| P-04 | 환경 | 사용자 PC 셸 없음 → Windows `npm.cmd` 실행·`git status` 직접 확인 불가, Linux에서 재현 | Windows 고유 문제는 미검증 | 필요 시 PC에서 동일 명령 재실행 |
| P-05 | 위험(프로세스) | `playwright.config.ts`의 `reuseExistingServer: !CI` — 로컬에서 4173 포트에 다른 폴더(예: 루트의 `pokefile/` 클론)의 `vite preview`가 떠 있으면 그 빌드를 재사용 | 다른 빌드로 E2E가 통과·실패할 수 있음 | 로컬 E2E 전 4173 포트 비어 있는지 확인(또는 `CI=1`로 실행). 공통 설정 변경은 별도 CR |

## 8. 미검증 범위
- 실제 앱(다중 세대 설정)에서의 탭 표시·전환·메가 6/7 탭·부분 실패 E2E, PC·320px 시각 확인(P-01).
- data.pkmn.cc 실제 호출, 배포 origin(GitHub Pages) CORS, 요청량 제한(P-02).
- 실제 스크린리더, Chromium 외 브라우저, Windows 환경 재현.
- 리전폼 실데이터 연결은 영문 종 이름(`nameEn`)으로 감사했다. 앱은 PokéAPI `species.name`을 쓰며, 둘 다 `toShowdownId`로 정규화되므로 결과는 같다고 판단(확신도 높음). 특수 문자 종(Flabébé 등)은 폼 세팅 데이터가 없어 영향 없음.

## 9. 판정

| 대상 | 판정 | 사유 |
|---|---|---|
| 담당 코드(battle-tools) 검증 | **FAIL** | D-01(Major): AC-3 "리전폼·기타 폼은 검증한 Smogon 이름으로 정확히 연결" 미충족. 나머지 자동 검증(lint·typecheck·370 테스트·build·기존 E2E 4)은 PASS |
| TASK-025 전체 인수 | **FAIL / 일부 BLOCKED** | D-01 수정 필요 + P-01(공통 설정 승인 대기)로 실제 앱 다중 세대 동작과 E2E 3건 미검증. 승인 전에는 PASS 불가 |

## 10. 담당자에게 필요한 조치
1. **성윤우(Codex)**: D-01 수정과 회귀 테스트 추가. D-02는 기능 오너 결정에 따라 수정. 수정 후 lint·typecheck·test·build·관련 E2E 재실행 기록.
2. **기능 오너(성윤우)**: D-02 동작 기대, D-03(natdex AG 화룡점정), D-04(일가족), D-05(`inheritance`) 결정. 필요 시 ADR-016 보완은 별도 승인 문서 작업.
3. **공통 책임자(김형균)**: CR-025-SMOGON-SCOPE 승인 여부 결정. 적용 후 다중 세대 E2E 3건과 S-01·02·04·16 재검증 요청.
4. 네트워크가 되는 환경에서 실제 API 스크립트 재실행 결과 첨부(P-02).
5. 커밋·푸시·PR·TASK 상태 변경은 QA가 수행하지 않았다. 사람 승인 단계로 넘긴다.

## 11. 산출물 목록 (`test-results/task025-independent-qa/`)
- `QA_TASK-025.md` — 이 보고서
- `logs/` — 명령별 로그, git 상태·diff, 폼 매핑 감사(`qa-form-mapping-audit.tsv`, `qa-form-mapping-misses.txt`), `qa-cross-contamination.txt`, `qa-formats-seen.txt`, `qa-rayquaza.json`
- `scripts/` — QA 전용 Vitest/Playwright 설정, 추가 검증 테스트(`live-mapping.qa.test.ts`, `ui-counter.qa.test.tsx`, `ui-realconfig.qa.test.tsx`, `real-app.qa.spec.ts`), 실데이터 스냅샷 `data/gen*.json`과 `SHA256SUMS`
- `screenshots/real-config-gen6-desktop.png`, `screenshots/real-config-gen6-mobile320.png`
- `e2e/` — 지정 E2E 재실행 산출물(`smogon-mobile.png`)

재실행 방법(저장소 루트): `npx vitest run -c test-results/task025-independent-qa/scripts/vitest.qa.config.ts` / `QA_CHROMIUM=<chromium 경로> npx playwright test -c test-results/task025-independent-qa/scripts/playwright.qa-own.config.ts`
