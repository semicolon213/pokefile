# 독립 QA 보고서 — TASK-025 / C-01 추가 폼 (아르세우스 17·실버디 17·그우린차 걸작 1)

| 항목 | 값 |
|---|---|
| QA 수행 | Claude Code (Opus 5.5), 독립 QA 모드, 읽기 전용 |
| 구현 | Codex |
| 일시 | 2026-11-25 14:12 ~ 14:40 (KST) |
| 저장소 | `D:\claude\pokefile` (로컬 미커밋·미추적 파일 포함 작업 사본) |
| 브랜치 / HEAD | `feat/TASK-025-smogon-generations` / `0c616598ffa7412edc89430750753aaa37378af3` |
| 환경 | Windows 11, Node v24.19.0, Chromium(Playwright), 외부 네트워크 허용 |
| 관련 PR | #47 (원격 PR은 판정 근거로 쓰지 않음, `gh` 조회 안 함) |
| 산출물 | `test-results/task025-c01-independent-qa/claude-run/` |

---

## 1. 판정

| 대상 | 판정 | 근거 요약 |
|---|---|---|
| **C-01 담당 코드** | **FAIL (Minor 1건)** | 인덱스·생성기·상세·Smogon 매핑·캐시·E2E는 실데이터로 통과. 다만 **비교 화면에서 추가 폼 요청이 실패하면 A/B 카드에 기본 폼의 타입 배지(노말)가 정상 결과처럼 남는다** (F-01). 인수 조건 "폼 요청 실패 시 다른 폼으로 임의 대체 금지"와 이번 QA 필수 검증 2-5에 걸린다. 심각도는 낮고 결과 표에는 오류가 표시되므로, 사람이 예외로 승인하면 조건부 PASS로 바꿀 수 있다. |
| **TASK-025 전체 인수** | **FAIL** (F-01 수정 후에도 **BLOCKED**) | F-01에 더해 CR-025-SMOGON-SCOPE(공통 설정 다중 세대)가 승인 대기 상태다. 실제 앱은 gen6만 켜져 있고 다중 세대 E2E 3건은 SKIPPED이다. 공통·상세·비교 오너의 사람 승인과 최신 develop 통합도 아직 없다. |

---

## 2. 시작 상태와 변경 구분

- 시작 시 `git status`, `git diff`를 `claude-run/git-status.txt`, `claude-run/working-tree.diff`에 저장했다. **종료 시 status·diff가 시작과 바이트 단위로 같았다**(`STATUS_SAME`, `DIFF_SAME`). 제품 코드, 테스트, 설정, 정책 문서, 기존 QA 증거는 바꾸지 않았다.
- HEAD `0c61659` = TASK-025 초기 구현 + D-01(커밋됨). 아래는 모두 **미커밋**이다.

| 구분 | 파일 |
|---|---|
| **D-02~D-05** (선행) | `battle-tools/components/SmogonSetsSection.tsx`(D-02), `battle-tools/model/smogon.ts`(D-03·04·05), `pokemon-detail/model/forms.ts`(D-04), `pokemon-detail/pages/PokemonDetailPage.tsx`(D-04, C-01과 공유), `tests/integration/battle-tools/SmogonGenerations.test.tsx`, `tests/e2e/battle-tools/smogon-generations.spec.ts`, `tests/unit/battle-tools/forms.test.ts`(C-01과 공유), `tests/unit/pokemon-detail/maushold-forms.test.ts`, `tests/integration/pokemon-detail/MausholdForms.test.tsx` |
| **C-01** | `src/shared/models/pokemon.ts`, `src/shared/api/{index.ts,pokemon-forms.ts}`, `scripts/build-pokedex-index.mjs`, `scripts/lib/pokemon-form-extensions.{mjs,d.mts}`, `public/data/pokedex-index.json`, `pokemon-detail/hooks/useDetailQueries.ts`, `PokemonDetailPage.tsx`(공유), `compare/{api/pokemon.ts,hooks/useCompareStats.ts,pages/ComparePage.tsx}`, `tests/unit/shared/{forms,pokemon-form-extensions,pokemon-forms}.test.ts`, `tests/unit/battle-tools/additionalForms.test.ts`, `tests/integration/shared/additional-form-fixtures.ts`, `tests/integration/{pokemon-detail,compare}/AdditionalForms.test.tsx`, `tests/e2e/pokemon-detail/additional-forms.spec.ts` |
| 기록 | `src/features/battle-tools/TASK-025.md` |
| 범위 밖(변경 안 함 확인) | `.qa/`, `.worktrees/`, `pokefile/`, `task-011-integration/`, `task-017-checklist/` |

- 모든 변경 파일은 TASK-025.md에 기록된 각 승인(D-02~05, C-01)의 허용 경로 안에 있다. 허용 경로를 벗어난 수정은 없었다.

---

## 3. 실행 명령과 결과 (이번 QA에서 직접 실행)

| # | 명령 | 종료 코드 | 결과 | 증거 |
|---|---|---|---|---|
| 1 | `npm.cmd run lint` | 0 | oxlint 경고 5건. 모두 `.worktrees/`·`.qa/` 사본의 `StatFilter.tsx:16`이고 이번 변경과 무관. 모듈 경계 통과 | `claude-run/logs/lint.log` |
| 2 | `npm.cmd run typecheck` | 0 | 오류 없음 | `logs/typecheck.log` |
| 3 | `npm.cmd test` (+json reporter) | 0 | **55파일 · 461/461 통과**, 실패·건너뜀 0. jsdom `scrollTo` 미구현 안내만 있음 | `logs/test.log`, `vitest-results.json` |
| 4 | `npm.cmd run build` | 0 | JS 752.95kB, 500kB 초과 청크 경고(기존) | `logs/build.log` |
| 5 | `git diff --check` | 0 | 공백 오류 없음 | `std-exit-codes.txt` |
| 6 | 관련 7파일 `npm.cmd test -- …` | 0 | **7파일 · 105/105 통과** | `logs/related-tests.log` |
| 7 | 전체 E2E: `CI=1 npx playwright test --config=claude-run/playwright.qa.config.ts --workers=2 --reporter=list` | 0 | **71 통과 · 3 SKIPPED · 0 실패**. SKIPPED 3건은 `smogon-generations.spec.ts`의 다중 세대 검사(CR-025-SMOGON-SCOPE 대기)이며 **PASS로 세지 않음** | `logs/e2e.log`, `playwright-results.json`, `e2e-output/` |
| 8 | `node claude-run/live-audit.mjs` (실제 PokéAPI·Smogon + Vite SSR 앱 모듈) | 0 | 35폼 계약 검사 전부 통과, PNG 35/35, `/pokemon/{폼}` 404 35/35, Smogon 152행 정확 일치, 캐시 불변 | `live-audit.json`, `live-network.json` |
| 9 | 34개 showdown GIF 상태 조회 | 0 | 34/34 HTTP 200 `image/gif`. 그우린차 걸작은 GIF 없음(404), PNG 사용 | `logs/gif-check.log` |
| 10 | `node claude-run/regen-and-regression.mjs` | 0 | `--extend-forms`를 메모리에서 재현: 파일과 일치, 멱등, 키 충돌 감지. D-03·D-04·D-05 실원본 통과 | `regen-and-regression.json` (1차 기대값 오류본 `*.v1.*`) |
| 11 | `node claude-run/browser-audit.mjs` (이번 빌드 preview :4391, 실제 API·이미지, **실제 설정 gen6**) | 1 | 13건 중 11건 통과. 실패 2건 중 1건은 **실제 결함(F-01)**, 1건은 QA 스크립트 선택자 오류(스크린샷으로 정상 확인) | `browser-audit.json`, `screenshots/` |
| 12 | `node claude-run/multigen-audit.mjs` (**검증용 다중 세대 mock** dev 서버 :4392) | 0 | 8/8 통과 (1차 실행은 QA 기대값 오류 2건, 아래 §7) | `multigen-audit.json`, `screenshots-multigen/` (1차 `*.v1.*`) |

- E2E 서버: 위 #4에서 만든 `dist/`를 `node node_modules/vite/bin/vite.js preview --port 4391 --strictPort --host 127.0.0.1`로 직접 띄웠다. 설정은 저장소 `playwright.config.ts`를 상속하고 baseURL, webServer, outputDir, reporter 경로만 바꿨다. 테스트 집합, chromium, `retries: 1`(CI), forbidOnly는 그대로 두었다. 끝난 뒤 **내가 띄운 PID 14644(4391)와 51788(4392)만 종료**했다. 기존 개발 서버 5173(PID 30232)은 그대로 실행 중임을 확인했다.
- 외부 API 차단은 없었다. 모든 외부 요청 기록은 `live-network.json`에 있다.

---

## 4. 발견 사항

### 확정 결함

#### F-01 [Minor · 확신도 높음] 비교 화면에서 추가 폼 요청이 실패(또는 로딩 중)하면 기본 폼 타입 배지가 정상처럼 표시됨
- **위치**: `src/features/compare/components/PokemonPicker.tsx:67` — `(stats?.types ?? summary.types)`. 연결 경로는 `src/features/compare/hooks/useCompareStats.ts:17-26`(폼 오류 시 `data` 없음), `ComparePage.tsx:34-35`.
- **재현**
  1. `npm run build` 후 preview를 띄운다.
  2. 브라우저에서 `https://pokeapi.co/api/v2/pokemon-form/arceus-fire` 요청만 HTTP 500으로 바꾼다(`browser-audit.mjs`의 `compare-form-500`).
  3. `#/compare?a=493&af=fire&b=773`에 접속한다.
- **기대**: 폼 조회에 실패하면 A 카드에 기본 아르세우스의 타입·이미지를 정상 결과처럼 보여 주지 않는다. 보여 준다면 선택한 폼의 타입(인덱스 `forms[].types` = 불꽃)이거나 오류·미표시여야 한다.
- **실제**: A 카드는 폼 선택 상자 "불꽃 타입" 옆에 **"노말" 배지**를 정상 모양으로 표시한다. 이미지는 비어 있다. 종족값 비교 영역에만 "종족값을 불러오지 못했습니다."가 나온다(스크린샷 `claude-run/screenshots/fail-compare-form-500.png`). 정상 네트워크에서도 폼 응답을 기다리는 동안 같은 "노말" 배지가 잠깐 보인다.
- **영향**: 사용자는 "아르세우스 불꽃 타입 = 노말"이라는 잘못된 정보를 볼 수 있다. 결과 표는 오류를 표시하므로 영향은 Minor다. 기존 메가·리전 폼에도 같은 대체 방식이 있었다. 하지만 C-01의 34개 타입 폼은 인덱스 종 타입(노말)과 폼 타입이 항상 달라서 이번 범위에서 체감 오류가 확실히 생긴다. 상세 화면은 같은 실패에서 오류만 표시해 문제가 없다(`fail-detail-form-500.png`).
- **최소 수정 방향**: 폼이 선택돼 있고 `stats`가 없으면 `summary.forms.find(f => f.key === selection.form)?.types`를 쓰거나 배지를 숨긴다. 비교 통합 테스트에 폼 요청 실패 사례를 추가한다. `PokemonPicker.tsx`는 C-01 허용 경로 밖이므로 비교 오너(김형균)의 범위 승인이 필요하다.

### 확인 필요(의심) · 경미 사항

| ID | 심각도 / 확신도 | 위치 | 내용 | 기대 / 실제 | 제안 |
|---|---|---|---|---|---|
| F-02 | Trivial / 높음 (명명 결정 필요) | `scripts/lib/pokemon-form-extensions.mjs:42-49` | PokéAPI에 아르세우스 17폼의 `form_names[ko]`가 없다(실측). 생성기는 `/type` 한국어 이름에 " 타입"을 붙여 "불꽃 타입"을 **규칙으로 생성**한다. 실버디는 API 공식명 "타입:페어리"를 쓴다. 기존 폼 이름 번역표(`scripts/data/form-names-ko.json`, OQ-26)는 거치지 않는다 | 기대: 폼 한국어명이 API 또는 승인된 번역표에서 와야 한다. 실제: 규칙으로 생성한 이름이고, 실버디와 표기 방식도 다르다 | 사람(공통 오너)이 명명 규칙을 확정한다. 필요하면 번역표 경로로 옮긴다 |
| F-03 | Trivial / 높음 | `pokemon-form-extensions.mjs:53` vs `build-pokedex-index.mjs:84` | `nameEn` 대체값이 다르다. 확장 경로는 `?? key`, 기존 경로는 `?? names[en] ?? titleCase(key)` | 현재 35폼은 모두 en `form_names`가 있어 영향 없음(실측) | 규칙을 통일한다 |
| F-04 | Trivial / 중간 | `src/features/compare/api/pokemon.ts:16` | 비교는 폼 소유 pokemon 검증에 `base.speciesName`(species 이름)을 쓴다. 상세는 기본 pokemon 이름(`base.name`)을 쓴다. 대상 3종은 둘이 같아 문제없다. 기본 pokemon 이름이 종 이름과 다른 종(예: deoxys→deoxys-normal)으로 확장하면 정상 응답도 "불일치" 오류가 된다 | 현재 범위에서는 정상 | 확장 전에 상세와 같은 기준으로 맞춘다 |
| F-05 | Minor / 낮음 (미검증, 기존 코드) | `PokemonPicker.tsx:47-58` | 비교 카드의 `imageIndex`는 선택이 바뀌어도 초기화되지 않는다. 앞선 이미지가 한 번 실패하면, URL이 1개뿐인 그우린차 걸작 같은 폼으로 바꿨을 때 이미지가 비어 보일 가능성이 있다 | 재현하지 않았다 | 비교 오너가 확인한다 |
| F-06 | 관찰 (기존 동작) | `PokemonDetailPage.tsx:49-58` | 인덱스 조회가 실패하면 `?form=fire`는 기본 폼으로 해석돼 기본 아르세우스가 표시된다. 잘못된 `?form=`을 기본 폼으로 보내는 기존 ADR-011 규칙이며 C-01이 추가한 동작은 아니다 | 브라우저로 재현하지 않았다 | 정책은 상세 오너가 판단한다 |
| T-01 | 테스트 공백 | `tests/e2e/pokemon-detail/additional-forms.spec.ts` | C-01 E2E 4건은 API·인덱스·Smogon·**이미지 전부 fixture**다(png/gif를 1px SVG로 대체). 실제 이미지·응답 검증은 E2E에 없다. 비교 화면의 폼 실패 테스트도 없다 | — | 실데이터 검증은 이 QA의 #8·#11로 보완. 비교 실패 테스트 추가 권장 |

---

## 5. 필수 검증 항목별 결과

### 5.1 인덱스·생성기
| 검증 | 결과 | 증거 |
|---|---|---|
| 35폼 식별자·타입·리소스·`battleOnly`가 실제 `/pokemon-form` 응답과 일치 | **PASS** 35/35 | `live-audit.json` `forms[].checks` |
| 한국어 이름 | **PASS**(값 일치), F-02(명명 출처) 확인 필요. 실버디·그우린차는 API ko, 아르세우스는 API ko가 없어 `/type` ko 기반 규칙 생성 | 같음 |
| `/pokemon/{폼명}`은 404 → `pokemon-form` 리소스가 필요 | **PASS** 35/35 404 | `live-network.json` |
| HEAD와 비교한 보존: 1,025종, 다른 종·필드·`regionalDexes`·`source`·`count`·`version` 불변, 바뀐 것은 #493·#773·#1013의 `forms`(0→17/17/1)와 `generatedAt`뿐 | **PASS** | `index-diff.json` |
| 폼 361개 (mega 97 / gmax 34 / regional 57 / other 173), 종 안 키 중복 없음 | **PASS** | 같음 |
| `--extend-forms` 재실행: 실제 API로 HEAD 인덱스와 현재 인덱스 양쪽에 다시 적용 → 파일과 동일(generatedAt 제외), 두 번 적용해도 같음, 기존 pokemon 변형과 키가 충돌하면 오류 | **PASS** | `regen-and-regression.json` `extend` |
| 기존 pokemon 변형 조회 방식 호환: `resource` 없는 326폼은 기존 `/pokemon/{species}-{key}` 경로를 그대로 쓴다(E2E 리자몽 X·리전폼·거다이맥스 통과) | **PASS** | `logs/e2e.log` |
| **전체 재생성(`npm run build:index`, main 경로)** | **미실행(NOT RUN)**. main에서 확장을 병합하는 코드(`build-pokedex-index.mjs:148-150`)는 읽어서 검토만 했다. 실행하면 `public/data`를 덮어쓰므로 QA 범위에서 제외했다 | — |

### 5.2 상세·비교 (실제 API·이미지, 실제 설정 gen6, 1280·320px)
| 검증 | 결과 |
|---|---|
| 요청 경로: 폼 선택 시 `/pokemon-form/{name}` 요청, `/pokemon/{폼명}` 요청 0건, 기본 `/pokemon/{id}` 공유 | **PASS** (6/6 경로) |
| 폼 타입·이미지(아르세우스 불꽃·실버디 페어리 GIF, **그우린차 걸작 PNG `1013-masterpiece.png`**)가 실제로 로드됨(naturalWidth>0) | **PASS**. 스크린샷 직접 검토 |
| 기본 종족값·특성·키·몸무게 공유(아르세우스 120×6=720, 실버디 95×6=570, 그우린차 71/60/106/121/80/70=508) | **PASS** |
| 키보드 폼 선택(Tab 이동 + Enter), 선택 상태 `aria-pressed`, URL `?form=` | **PASS** |
| 새로고침 유지, 직접 URL 진입, 기본 폼 복귀 시 쿼리 제거·기본 이미지·노말 타입 복원(기본 폼 캐시 비변형) | **PASS** |
| 상세 "비교하기" → `a={id}&af={form}`, 비교 카드 이미지·타입·선택값 일치, 같은 종 B(기본 폼)와 표 비교 | **PASS** |
| 비교 폼 select 키보드(End) 변경 → URL `bf=` 반영 | **PASS** |
| 서로 다른 종 응답 병합 금지(아르세우스 폼 자리에 실버디 응답 / `pokemon.name` 변조) | **PASS** 상세 오류 표시, 기본 정보 미표시 (+ SSR로 `fetchPokemonFormOverride` 직접 호출해 parse 오류 확인) |
| 상세 폼 요청 500 | **PASS** 오류와 재시도 표시. 기본 아르세우스 이미지·노말·종족값 미표시. 선택 탭 유지 |
| 상세 이미지 실패(GIF·PNG 404) | **PASS** "이미지 정보 없음" 대체 표시, 기본 이미지로 바꾸지 않음, 타입 불꽃 유지. 자동 스크립트는 선택자 오류로 FAIL 기록 → 스크린샷 `fail-detail-image-fail.png`으로 정상 확인 |
| 비교 이미지 실패 | **PASS** 기본 이미지로 바꾸지 않음 |
| **비교 폼 요청 500** | **FAIL → F-01** |
| 가로 넘침·페이지 JS 오류 | **PASS** 12개 화면 모두 넘침 없음, pageerror 0 |

### 5.3 Smogon
| 검증 | 결과 |
|---|---|
| 35폼 + 기본 3종 × gen9·8·7·6 = 152행을 원본 키(`Arceus-Fire`, `Silvally-Fairy`, `Sinistcha-Masterpiece` 등)와 대조. 앱 `normalizeSmogonSets`·`selectSmogonSets`의 결과 포맷·세팅 이름이 원본과 정확히 일치 | **PASS** 152/152 |
| 세팅이 없을 때 기본·형제 폼으로 대체하지 않음(예: 그우린차 걸작 gen8·7·6, 아르세우스 비노말 gen8 일부, 실버디 gen6·9) | **PASS** 혼입 0 |
| 조회·필터링 뒤 원본 JSON과 정규화 데이터 불변 | **PASS** 4세대 모두 |
| **실제 공통 설정(gen6)** 화면: 아르세우스 불꽃 → 6세대 UBERS, 실버디 페어리·그우린차 걸작 → "등록된 실전 세팅이 없습니다." | **PASS** (`browser-audit.json`) |
| **검증용 다중 세대 mock**(메모리에서 scope에 `[9,8,7,6]` 주입, 저장소 무변경): 아르세우스 불꽃 탭 9·7·6 / 최신 9, 실버디 페어리 8·7 / 최신 8, 그우린차 걸작 9 / 최신 9. 포맷·세팅이 원본과 일치. 320px End 키, 넘침 없음 | **PASS (mock 한정)**. 실제 설정의 인수가 아니다 |
| 다중 세대 E2E 3건 | **SKIPPED. PASS 아님** |

### 5.4 선행 변경 회귀
| 항목 | 결과 | 근거 |
|---|---|---|
| D-02 최신 세대 확정 전 로딩 | **PASS (mock)** gen9 응답을 막아 둔 동안 탭 0개와 로딩 문구, 풀면 9세대 | `multigen-audit.json` |
| D-02 늦은 응답·재시도가 사용자 선택을 바꾸지 않음 | **PASS (mock)** gen9 503 → 다음 보유 세대 7세대(아르세우스 불꽃은 gen8 세팅 없음) → ubers 선택 → 9세대 재시도 성공 → 9세대 탭이 생겨도 7세대·ubers 유지(320px) | 같음 + 통합 테스트(461 중) |
| D-03 gen8 `dlc1nationaldexag`의 Dragon Ascent 후보 3개를 기본 레쿠쟈에서 제외, 일반 AG `Dynamax Sweeper`·Ubers 3개 유지, gen8 메가 탭 0, 캐시 불변 | **PASS** (실원본) | `regen-and-regression.json` `d03` |
| D-04 파밀리쥐: 첫 탭·초기 선택 "세 식구"(쿼리 없음, 10257 이미지), "네 식구" → `?form=default`, 925 이미지, 새로고침 유지, 복귀 시 쿼리 제거, 몸무게 2.3/2.8kg 구분. Smogon gen9: 세 식구 = `Maushold`, 네 식구 = `Maushold-Four` 정확 일치 | **PASS** (브라우저 실데이터 + 실원본) | `browser-audit.json`, `d04` |
| D-05 gen9 원본에서 inheritance를 가진 32종 → 정규화 후 0, 나머지 포맷 유지, 캐시 불변 | **PASS** (실원본) | `d05` |

---

## 6. 요구사항·테스트 ID 연결

| 요구사항 / TC | 검증 | 상태 |
|---|---|---|
| FR-10~12, TC-04 (상세·폼 전환·URL) | 5.2, E2E detail·additional-forms | PASS |
| FR-17~18, DR-08, TC-06 (세팅 정확 매핑·부재) | 5.3, 5.4 | PASS (실제 gen6 + mock 다중 세대). 다중 세대 E2E SKIPPED |
| FR-24 (타입 상성: 폼 타입 기준) | 상세 스크린샷의 "불꽃 타입이 받는 피해" | PASS |
| FR-25, TC-11 (비교) | 5.2 | **FAIL (F-01)** |
| TC-08 (1280·320·키보드) | 5.2, 5.3 | PASS |
| TC-09 (실패·부분 실패) | 상세 PASS, 비교 F-01 | **FAIL (부분)** |
| DR-04 (폼 키·인덱스 계약) | 5.1 | PASS |

---

## 7. QA 스크립트 자체 오류 (제품 결함 아님, PASS로 덮지 않음)
1. `browser-audit.mjs`의 `detail-image-fail`은 대체 요소 클래스를 잘못 가정해 FAIL로 기록됐다. 스크린샷으로 "이미지 정보 없음" 정상 표시를 확인했다. 원본 결과는 `browser-audit.json`에 FAIL 그대로 남겼다.
2. `regen-and-regression.mjs` 1차 실행은 기대값에서 기존 제외 포맷 9종(godlygift 등)을 빼지 않아 D-04·D-05가 FAIL이었다. 기대값을 고친 2차 실행은 PASS다. 1차 결과는 `*.v1.*`로 보존했다.
3. `multigen-audit.mjs` 1차 실행에서 (a) 오래된 세대 탭이 다 불러와지기 전에 표본을 떠서 1280px 아르세우스 탭이 9·7로 기록됐고, (b) 아르세우스 불꽃의 대체 세대를 8로 잘못 기대했다(실제 원본 gen8에 세팅 없음). 고친 2차 실행은 8/8 PASS다. 1차 결과는 `*.v1.*`로 보존했다.

## 8. 미검증 항목
- 전체 인덱스 재생성(`npm run build:index` main 경로): 미실행. 코드 검토만 했다.
- 실제 공통 설정의 다중 세대 동작과 다중 세대 E2E 3건: CR-025-SMOGON-SCOPE 대기로 미검증(mock으로만 확인).
- 35폼 중 브라우저 화면 확인은 3폼(불꽃·페어리·걸작)만. 나머지 32폼은 데이터·매핑·이미지 HTTP 수준으로만 확인했다.
- F-05, F-06은 재현하지 않았다. 다른 브라우저·스크린리더·배포 origin(GitHub Pages) CORS·최신 develop과의 통합은 미검증이다.
- PR #47 원격 상태는 조회하지 않았다(로컬 작업 사본 기준).

## 9. 사람 승인 대기
1. **F-01 처리 방식**: 수정할지, 예외로 승인할지. 수정 시 `PokemonPicker.tsx`는 C-01 허용 경로 밖이므로 비교 오너 **김형균**의 범위 승인이 필요하다.
2. **CR-025-C01-COMMON**: 공통 데이터 모델(`PokemonForm.resource`), 공통 API, `scripts/`, `public/data`가 바뀐다. WORKFLOW §7(공통 데이터 모델)에 따라 공통 관리 책임자 **김형균**의 승인이 필요하다.
3. 상세 연결부(`useDetailQueries.ts`, `PokemonDetailPage.tsx`)는 상세 오너 **임지섭**의 교차 확인이 필요하다.
4. **F-02** 아르세우스 한국어 폼명("불꽃 타입")을 규칙으로 만들지 번역표로 관리할지 결정이 필요하다.
5. CR-025-SMOGON-SCOPE 승인과 적용, 이후 다중 세대 E2E 재검증이 필요하다.
6. 기능 오너 **성윤우**의 최종 인수가 필요하다.

## 10. 수정 필요 사항과 담당 (직접 수정하지 않음)

| 순위 | 항목 | 담당 영역 | 비고 |
|---|---|---|---|
| 1 | F-01: 비교 카드가 폼 조회 실패·로딩 중에 기본 종 타입을 표시하지 않도록 수정하고, 비교 폼 실패 통합 테스트 추가 | 비교(김형균) | 범위 승인이 먼저 필요 |
| 2 | F-02: 아르세우스 한국어 폼명의 출처·규칙 확정 | 공통·인덱스(김형균) | 사람 결정 |
| 3 | F-03: `nameEn` 대체 규칙 통일 | 공통·scripts(김형균) | Trivial |
| 4 | F-04: 비교의 소유 pokemon 검증 기준을 기본 pokemon 이름으로 통일 | 비교(김형균) | 확장 대비, Trivial |
| 5 | F-05 확인 | 비교(김형균) | 기존 코드, 의심 |
| 6 | 전체 인덱스 재생성 1회 실행·검증(원하면) | 공통(김형균) | 미실행 기록 |
