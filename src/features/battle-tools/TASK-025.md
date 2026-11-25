# TASK-025 — 실전 세팅 세대 탭·폼 매핑

## C-01 새 PR 제출 — 2026-11-25

- 사용자 지시: `새로운 pr 작성해서 올려줘`, `폼체인지 작업한거`, `C-01 구현 코드와 QA 결과를 함께 새 PR로 올리기`. C-01 구현·검증·QA 보고서 사본의 커밋·브랜치 푸시·새 PR 생성을 승인한 것으로 처리한다. 병합·배포는 포함하지 않는다.
- 별도 작업 사본 `.worktrees/task025-c01-pr`, 브랜치 `feat/TASK-025-c01-additional-forms`. 기준은 기존 PR #45의 최신 `1642cc2f04335bfab5b11993107c46cb81dff8c1`이며 최신 develop `4df19f1903d964efd935772d65d3a6c86a6703fa`를 포함한다. 원래 루트의 29개 미커밋 변경은 보존한다.
- 제출 범위는 아래 C-01 승인 경로 22개와 사용자 제공 QA 보고서의 원본 사본 `src/features/battle-tools/QA_TASK-025_C01.md` 1개, 총 23개다. 기존 PR #45의 D-02~04 코드·파밀리쥐 표시 예외 제거와 최신 상세·진화·이미지·종족값 인덱스 변경을 유지한다. 루트의 별도 D-02~05 수정은 이번 C-01 커밋에 덮어쓰지 않는다.
- C-01 이식 시 최신 상세의 `toFormDetail(raw, baseId)` 계약을 유지하고 pokemon-form 추가 폼에는 기본 이미지 대체를 사용하지 않는다. 인덱스는 최신 기준의 1,025종·종족값·지방 도감 등 모든 기존 필드를 유지한 채 #493·773·1013에 35폼만 병합했다. 최신 상세의 많은 폼 선택 상자에 맞춰 C-01 단위/통합·E2E의 선택 동작을 버튼에서 select로 조정했다. 제품의 폼 선택 UI 정책은 변경하지 않는다.
- 독립 QA 원본은 사용자가 제공한 `C:\Users\srsra\Downloads\QA_TASK-025_C01.md`다. 제출 사본은 바이트 단위 동일하며 SHA-256은 `b5b0873dfad041bb431534594a8edbad154768f0e1dbc0e12e6a3b9301b3e5f6`이다. **C-01 FAIL(F-01), 전체 TASK-025 FAIL(F-01 수정 후에도 BLOCKED)** 판정을 그대로 보존한다. F-01(비교의 폼 요청 실패/로딩 시 기본 타입 표시)은 이번 제출에서 수정하지 않았다.
- 이 QA는 원래 루트 `0c61659`와 미커밋 변경을 검사한 이력이다. 이번 최신 기준 이식본의 독립 QA PASS를 뜻하지 않는다. 특히 QA 원문의 선행 D-04 표시 동작은 현재 PR #45의 `1642cc2`에서 제거한 예외와 다르다. 아래 자체 재검증과 원본 QA의 461개 테스트·71개 E2E 결과를 구분한다.
- develop 대상 **초안 PR**로 제출한다. PR #45가 선행 의존성이므로 병합 전까지 develop 대비 전체 diff에는 선행 TASK-025 커밋이 함께 보인다. C-01 자체 변경은 `1642cc2..이 브랜치`로 검토하며, #45 병합 후 이 PR의 독립 변경 범위를 다시 확인해야 한다. 공통 계약·상세·비교 오너 확인, F-01 수정 및 독립 재QA, CR-025-SMOGON-SCOPE, 최종 사람 인수는 남긴다.

### 제출본 자체 검증

- `npm.cmd run lint` → 종료 0, 모듈 경계 통과. 기존 StatFilter 경고 1개.
- `npm.cmd run typecheck` → 종료 0.
- `npm.cmd test -- --reporter=default --reporter=json --outputFile=.../vitest-final.json` → 종료 0, 55파일 **481/481 통과**. 기존 jsdom scrollTo 미구현 안내 있음. 최초 실행은 최신 FormTabs의 선택 상자를 버튼으로 찾은 테스트 1건이 실패했고, 테스트 선택 동작을 맞춘 뒤 전체 재실행했다. 최초 실패 결과도 별도 보존했다.
- `npm.cmd run build` → 종료 0, JS 792.36kB 청크 크기 경고 있음.
- CI=1·원래 Playwright 설정 상속·이번 빌드의 자체 관리 preview로 전체 E2E → 종료 0, **72개 통과·1개 flaky(재시도 통과)·3개 SKIPPED**. flaky는 기존 `pokedex/list-return.spec.ts:24`의 상세 진입 직후 스크롤 0 검사였으며, 제품·테스트 코드는 변경하지 않았다. SKIPPED는 CR-025-SMOGON-SCOPE 대기 중인 다중 세대 3건이다. 이를 최초 실행 전부 PASS 또는 다중 세대 PASS로 표현하지 않는다.
- `git diff --check` → 종료 0. QA 보고서 사본의 SHA-256 일치와 원래 루트의 추적 변경·C-01 미추적 파일 보존을 확인했다. 검증 생성물은 원래 루트 `test-results/task025-c01-pr/` 및 이 작업 사본의 `test-results/task025-c01-pr/`에 보존한다.

## C-01 추가 폼 지원 — 2026-11-25

- 사용자 승인: `c-01 추가 폼 진행해줘`, 범위 확인 후 `공통·상세·비교 포함`으로 명시 승인했다. TASK-025 / C-01, 구현 Codex. 기존 소유자: 성윤우(실전 세팅), 김형균(공통·인덱스·비교), 임지섭(상세). 소유권은 재배정하지 않는다.
- 요구사항: FR-10~12·17~18·24~25, DR-04·08 / TC-04·06·08·09·11. 지원 대상: 아르세우스 비노말 17타입, 실버디 비노말 17타입, 그우린차 걸작 1폼 = 35개. 기존 1,025종·326개 pokemon 변형을 유지하며 인덱스 폼은 361개가 된다. Arceus-Unknown은 현재 지원 18타입 밖이므로 이번 범위가 아니다.
- **CR-025-C01-COMMON / PR 설명용 변경 요청 본문**: PokéAPI의 이 35폼은 species.varieties의 별도 pokemon이 아니라 기본 pokemon의 forms가 참조하는 pokemon-form이다. 기존 인덱스는 varieties만 수집하므로 선택·매핑 경로가 없다. 일반 `/pokemon/arceus-fire`, `/pokemon/silvally-fairy`, `/pokemon/sinistcha-masterpiece`는 실측 HTTP 404였다. 인덱스의 선택적 `resource: { kind: 'pokemon-form', name }` 계약을 추가하고 생성 스크립트·상세·비교가 이를 함께 읽도록 한다. 스키마 version 2와 기존 326폼의 리소스 방식은 유지한다. 폼 타입·이미지는 pokemon-form, 종족값·키·몸무게·특성·울음소리는 연결된 기본 pokemon에서 가져오며 서로 다른 종의 응답은 병합하지 않는다. 공통 설정의 Smogon 활성 세대(CR-025)는 이번 변경과 별개다.
- 인수 조건: 35폼을 상세·비교에서 선택·URL 공유·새로고침 가능, 실제 타입·폼 이미지·기본 종족값 표시, 정확한 Smogon 키 연결, 세팅 부재/폼 요청 실패 시 다른 폼으로 임의 대체 금지, 기존 폼·파밀리쥐 동작 유지, 원본 캐시 비변형. 추가 폼 반영 시 기존 인덱스의 다른 종·필드를 보존한다.
- **허용 경로**: `src/shared/models/pokemon.ts`, `src/shared/api/{index.ts,pokemon-forms.ts}`, `scripts/{build-pokedex-index.mjs,lib/pokemon-form-extensions.mjs,lib/pokemon-form-extensions.d.mts}`, `public/data/pokedex-index.json`, `src/features/pokemon-detail/{hooks/useDetailQueries.ts,pages/PokemonDetailPage.tsx}`, `src/features/compare/{api/pokemon.ts,hooks/useCompareStats.ts,pages/ComparePage.tsx}`, `tests/unit/shared/{forms.test.ts,pokemon-form-extensions.test.ts,pokemon-forms.test.ts}`, `tests/unit/battle-tools/{forms.test.ts,additionalForms.test.ts}`, `tests/integration/shared/additional-form-fixtures.ts`, `tests/integration/pokemon-detail/AdditionalForms.test.tsx`, `tests/integration/compare/AdditionalForms.test.tsx`, `tests/e2e/pokemon-detail/additional-forms.spec.ts`, 이 기록. 검증용 생성물은 test-results에 둔다.
- **CR-025-C01-TEST**: 위 신규 회귀 검사·fixture와 기존 인덱스 수량 검사(326 기존 변형 + 35 추가 폼, other 138 + 35)를 이번 승인 범위에서 갱신한다. 외부 API 검증의 varieties 최소 326개 기준은 다른 집합이므로 유지한다. 정책 문서·테스트 계획·패키지/설정·app/라우터·다른 feature 파일은 수정하지 않는다.
- **로컬 E2E 검증 구성**: 이전 Windows 검증의 npm/cmd 서버 종료 지연을 피하기 위해, 이번 빌드의 vite preview를 직접 실행·종료하고 test-results/task025-c01의 임시 구성에서 원래 Playwright 설정을 상속한다. CI=1의 forbidOnly·재시도·브라우저 설정과 테스트 집합을 유지하고, 자체 관리 서버·검증용 포트·분리된 결과 경로만 사용한다. 저장소 Playwright/CI 설정은 바꾸지 않으며 기존 QA 생성물도 삭제하지 않는다.
- 착수 점검: git fetch origin develop 완료. 현재 루트의 선행 D-02~05 미커밋 수정을 유지한다. 두 별도 작업 사본은 점검 시 clean이었고 C-01 대상의 진행 중 변경은 없었다. 최신 develop과의 전체 통합·독립 QA·각 오너 사람 승인·정식 TASK/ADR 문서 갱신·커밋/푸시/병합은 별도 단계다.

### C-01 구현·자체 검증 결과

- 구현: 인덱스에 `pokemon-form` 리소스 계약을 선택적으로 추가하고 아르세우스 17·실버디 17·그우린차 걸작 1폼을 수집했다. 상세·비교는 기본 pokemon 요청·종족값을 공유하면서 선택 폼의 타입·이미지를 사용한다. URL·새로고침·기존 폼 경로를 유지하며 폼 조회 실패를 기본 폼으로 대체하지 않는다. Smogon 기존 정규화 규칙으로 35폼의 정확한 키를 연결했다.
- 변경 파일은 위 승인 경로의 **22개**다. 제품·생성기·데이터 12개: `src/shared/models/pokemon.ts`, `src/shared/api/{index.ts,pokemon-forms.ts}`, `scripts/{build-pokedex-index.mjs,lib/pokemon-form-extensions.mjs,lib/pokemon-form-extensions.d.mts}`, `public/data/pokedex-index.json`, `src/features/pokemon-detail/{hooks/useDetailQueries.ts,pages/PokemonDetailPage.tsx}`, `src/features/compare/{api/pokemon.ts,hooks/useCompareStats.ts,pages/ComparePage.tsx}`. 테스트·fixture 9개: `tests/unit/shared/{forms.test.ts,pokemon-form-extensions.test.ts,pokemon-forms.test.ts}`, `tests/unit/battle-tools/{forms.test.ts,additionalForms.test.ts}`, `tests/integration/shared/additional-form-fixtures.ts`, `tests/integration/pokemon-detail/AdditionalForms.test.tsx`, `tests/integration/compare/AdditionalForms.test.tsx`, `tests/e2e/pokemon-detail/additional-forms.spec.ts`. 나머지 1개는 이 기록이다. 앞선 D-02~05 수정도 유지했다.

| 명령·검증 | 결과 |
|---|---|
| `npm.cmd run build:index -- --extend-forms` | 종료 0, 1,025종·361폼. 기존 인덱스와 대조해 #493·773·1013의 forms와 generatedAt만 변경 확인 |
| `npm.cmd test` | 종료 0, 전체 55파일·461/461 통과. 기존 jsdom scrollTo 미구현 안내 있음 |
| `npm.cmd test -- tests/unit/shared/pokemon-form-extensions.test.ts tests/unit/shared/pokemon-forms.test.ts tests/unit/shared/forms.test.ts tests/unit/battle-tools/additionalForms.test.ts tests/unit/battle-tools/forms.test.ts tests/integration/pokemon-detail/AdditionalForms.test.tsx tests/integration/compare/AdditionalForms.test.tsx` | 최종 fixture의 Node 런타임 의존성 제거 후 종료 0, 7파일·105/105 통과 |
| `npm.cmd run typecheck` | 최종 재검증 종료 0 |
| `npm.cmd run lint` | 최종 재검증 종료 0, 모듈 경계 통과. 기존 QA·다른 작업 사본의 StatFilter 경고 4개 |
| `npm.cmd run build` | 종료 0, JS 752.95kB 청크 크기 경고 있음 |
| 실제 PokéAPI·Smogon 대조용 `node --input-type=module` 인라인 검증 | 종료 0, 35개 폼 응답·35개 PNG HTTP 200, 35폼 × 4세대 = 140개 조회·캐시 불변 확인 |
| CI=1·원래 설정 상속·이번 빌드의 별도 preview 서버로 전체 Playwright 실행 | 네트워크 허용 환경 재실행 종료 0, **71개 통과·3개 SKIPPED**. C-01 신규 4개 포함. 3개는 CR-025-SMOGON-SCOPE 대기 중인 다중 세대 검사이며 PASS로 세지 않음 |
| `node test-results/task025-c01/verify-browser.mjs` | 종료 0, 실제 폼 응답·이미지·Smogon 원본을 사용한 1280px·320px × 3종 = 6개 상세→비교 경로 통과. 타입·이미지·표·URL·폼 선택·가로 넘침 없음·페이지 JS 오류 없음 확인 |
| `git diff --check` | 종료 0 |
| `claude auth status` | 종료 1, `loggedIn: false`. 독립 QA 미실행 |

- 실제 세팅 보유 폼 수는 gen9 18/35·gen8 22/35·gen7 34/35·gen6 17/35였다(2026-11-25 원본 기준). 나머지는 부재로 처리하며 다른 폼으로 대체하지 않는다. 브라우저 확인에서는 **검증 브라우저에만** [9,8,7,6]을 주입해 아르세우스 불꽃·그우린차 걸작의 gen9, 실버디 페어리의 gen8 화면을 확인했다. 저장소의 실제 공통 설정은 여전히 gen6이므로 다중 세대 실제 설정의 인수 PASS를 뜻하지 않는다.
- 검증 산출물: `test-results/task025-c01/{live-report.json,live-fixtures.json,browser-report.json,verify-browser.mjs,e2e-network-run.json,e2e-network.log}` 및 PC·320px 상세/비교 스크린샷 12장. 대표 PC 아르세우스 상세·320px 실버디 상세·320px 그우린차 비교 화면도 직접 시각 검토했다. 관리 preview는 종료했고 기존 개발 서버 `http://127.0.0.1:5173/pokefile/` HTTP 200을 확인했다.
- 실패 이력: 최초 typecheck는 새 JS 생성기 선언 누락·E2E Buffer 타입 때문에 실패해 선언을 추가하고 SVG 문자열 fixture로 수정했다. 비교 통합 검사의 이미지 role 선택자 2건도 실제 빈 alt 이미지에 맞게 수정했다. 최초 E2E 로더는 fixture가 앱의 JSON 설정을 런타임 import해 실패했으며 fixture를 독립 데이터로 바꾼 뒤 재검증했다. 전체 E2E 첫 실행의 외부 PokéAPI 요청은 trace에서 status -1로 확인됐고 9건 실패했다. 네트워크 허용 환경에서 원래 테스트 집합을 그대로 재실행해 위 71/3 결과를 확보했다. 수동 브라우저 검증의 링크 선택자·정상 포맷 선택 안내를 로딩으로 오인한 대기 조건도 검증 스크립트에서 정정했다. 실패 실행을 PASS로 기록하지 않는다.
- 미검증: 1,025종 전체 인덱스의 원본 재생성은 실행하지 않았다(추가 폼 수집·보존 갱신 모드와 생성기 테스트는 통과). 최신 develop 전체 통합·배포 origin·다른 브라우저/스크린리더·Claude/다른 팀원의 독립 QA·공통/상세/비교 오너 사람 승인은 남아 있다. **구현·자체 검증 상태이며 QA_PASS/DONE이 아니다.** 정책 문서·공통 Smogon 설정·패키지/설정·다른 작업 사본은 수정하지 않았고 커밋·푸시·PR 갱신·병합·배포도 하지 않았다.


## 커밋·푸시·초안 PR 제출 준비 — 2026-11-18

- 사용자 지시 `rp 푸시`를 PR 생성 및 브랜치 푸시 요청으로 해석해 현재 검증한 18개 파일을 커밋·푸시하고 develop 대상 초안 PR로 제출한다. 기존 커밋·푸시 미실행 기록은 이전 단계의 이력이며 이번 지시로 제출 작업이 승인됐다. 병합·배포·정식 TASK 상태 변경은 포함하지 않는다.
- 검증 기준은 `bf6c129`다. 제출 전 fetch에서 최신 origin/develop `65bb03f`가 9커밋 앞섰으며, 추가 변경 경로는 이번 18개와 겹치지 않는다. 검증 대상 제품·테스트 코드를 유지해 제출하고 최신 develop과의 통합은 PR CI에서 별도로 확인한다.
- PR에 D-01 독립 QA PASS, 담당 코드 조건부 PASS, 전체 TASK-025 BLOCKED, CR-025-SMOGON-SCOPE 승인 대기, D-02~D-05·C-01·C-02 오너 판단 대기 및 다중 세대 E2E 3개 SKIPPED를 명시한다. 공통 설정은 수정하지 않는다.

## 독립 QA 재검증 결과 반영 — 2026-11-18

- 사용자가 Claude Cowork의 재검증 결과와 현재 18개 파일 재스테이징·대상 밖 280개 파일의 기준 커밋 blob 비교 지시를 전달했다.
- 원문: `test-results/task025-independent-qa-recheck/QA_TASK-025_recheck.md`. 재검증은 Linux 사본에서 수행됐으며 Windows 직접 실행 기록이 아니다. 보고서·로그·QA 스크립트는 D:에 있고 스크린샷·브라우저 산출물은 세션 종료 시 사라지는 클라우드 임시 저장소에만 있다는 보고를 받았다. 보유하지 않은 이미지·산출물을 저장소에 보존했다고 표현하지 않는다.
- **D-01: 독립 QA PASS(수정 확인)**. 네크로즈마 2종·오거폰 가면 3종의 실데이터 포맷·세팅 일치, 기본·형제 폼 혼입 없음, 다중 세대 mock UI를 검증했다. 담당 코드 판정은 **조건부 PASS**이며 최종 PASS가 아니다.
- **TASK-025 전체 인수: BLOCKED(QA PASS 아님)**. CR-025-SMOGON-SCOPE 승인 대기로 실제 앱은 6세대만 활성이고 다중 세대 E2E 3건·실제 다중 탭 화면·320px 시각 확인은 미검증이다. 공통 설정은 수정하지 않았다.
- 독립 실행 결과: lint/typecheck/build 종료 0, 전체 48개 파일·382개 테스트 및 관련 13개 파일·112개 테스트 통과. 지정 API 검증은 QA 네트워크 차단으로 BLOCKED, 지정 E2E는 설치 브라우저 버전 불일치로 시작 불가. 설치된 Chromium을 지정한 별도 실행은 기존 4개 통과·다중 세대 3개 SKIPPED였다. 실제 API에 성공한 아래 Windows 구현자 기록과 독립 QA의 차단 결과를 구분한다.
- **남은 판단**: D-02~D-05는 기능 오너 결정 대기, D-06은 Trivial 유지. 새 결함 없음. C-01(Arceus·Silvally 타입 폼 및 Sinistcha-Masterpiece의 범위)·C-02(Zygarde Power Construct 매핑)는 사양 확인 사항으로 남긴다. 승인된 요구사항·ADR·공통 모델은 변경하지 않는다.
- 재검증 당시 제출된 18개 중 이번에는 이 작업 기록만 갱신한다. 제품·테스트·원본 FAIL 보고서·재검증 원문·이전 검증 manifest는 변경하지 않는다. 새 파일을 스테이징하지 않고 기존 18개를 유지한다.
- 직접 Git 검증 및 파일 목록은 `test-results/task025-post-recheck/`에 별도로 기록한다. 정식 TASK 상태·커밋·푸시·PR·병합·배포는 변경하지 않는다.

## 독립 QA FAIL 후 D-01 보완 — 2026-11-18

- 사용자가 독립 QA 보고서와 `17 target files plus the docs` 스테이징 지시를 전달했다. 같은 TASK-025 허용 경로 안에서 D-01 수정·반례 테스트·Windows 재검증을 수행하고 대상 파일과 QA 문서를 스테이징한다. 커밋·푸시·병합·배포 승인은 포함하지 않는다.
- Claude Cowork 독립 QA는 수정 전 17개 파일에 대해 **담당 코드 FAIL / 전체 인수 FAIL + 일부 BLOCKED**로 판정했다. 원본 `test-results/task025-independent-qa/QA_TASK-025.md`를 수정하지 않고 `QA_TASK-025_independent.md`에 제출용 사본을 보존했다. 두 보고서 SHA-256: `18a55362365f7269edb0824a94dc2832cf4a0926d561a56c94979f7334a747f4`.
- **D-01 보완**: 네크로즈마 dusk→Dusk-Mane·dawn→Dawn-Wings, 오거폰 가면 3종→Wellspring·Hearthflame·Cornerstone의 검증된 이름 5개를 추가했다. 대상은 `model/smogon.ts`의 매핑표뿐이며 다른 폼으로 대체하는 동작은 추가하지 않았다.
- 반례 테스트를 먼저 추가해 6건 실패를 재현했다. 수정 후 5종 매핑·인덱스의 실제 5종 선택·기본/형제 폼 혼입 방지를 검증했다. 인덱스 전체 326개 폼 × 4세대에서 세팅 부재 시 기본·알 수 없는 폼으로 대체하지 않는 검사를 추가했다. 통합 테스트에는 실제 ID와 폼을 전달하는 UI 회귀 5건을 추가했다. 신규 자동 테스트는 총 12건이다.
- 실데이터 검증은 기존 7건에 D-01의 실제 세대별 세팅 8건을 더해 총 15건으로 늘렸다. 전체 326개 폼 × 4세대 조회 후 캐시 불변도 검사한다. 이는 모든 폼의 의미적 매핑을 완전히 검수했다는 뜻은 아니다.
- **D-02~D-05는 오너 판단 대기**: 늦은 최신 세대 도착 시 포맷 선택 유지 정책, 8세대 National Dex AG 레쿠쟈 해석, Maushold 가족 폼, inheritance 제외 여부를 임의로 확정하지 않았다. D-06의 경미 사항도 이번 D-01 보완에서 수정하지 않았다.
- **CR-025-SMOGON-SCOPE는 여전히 승인 대기**이며 공통 설정은 수정하지 않았다. 실제 앱은 6세대만 활성화한다. 독립 QA 원본의 FAIL을 자체 검증 결과로 PASS로 바꾸지 않는다. 수정분의 독립 QA 재검증·전체 인수·사람 승인은 남아 있다.

### Windows 재검증 결과

| 명령 | 결과 |
|---|---|
| `npm.cmd test -- tests/unit/battle-tools/forms.test.ts` (수정 전 반례) | 종료 1, 6개 실패·18개 통과로 D-01 재현 |
| `npm.cmd test -- tests/unit/battle-tools tests/integration/battle-tools` (수정 후) | 종료 0, 13개 파일·112개 통과 |
| `npm.cmd run lint` | 종료 0, oxlint·모듈 경계 통과 |
| `npm.cmd run typecheck` | 종료 0 |
| `npm.cmd test` | 종료 0, 전체 48개 파일·382개 통과. 기존 jsdom scrollTo 안내 발생 |
| `npm.cmd run build` | 종료 0, 751.32KB 청크 크기 경고 있음 |
| `node tests/integration/battle-tools/verify-live-smogon.mjs` | 종료 0, 4개 세대 정규화·실제 폼 매핑 15건·326개 폼 × 4세대 조회·캐시 불변 |
| `CI=1`로 기존 관련 E2E 명령 실행, output=`test-results/task025-followup/e2e` | 종료 0, 4개 통과·다중 세대 3개 SKIPPED. 새 빌드 및 서버 재사용 금지. 전체 E2E·다중 세대 E2E PASS가 아님 |
| `git diff --check` | 종료 0 |

- 재실행 로그: `test-results/task025-followup/logs/`. 실데이터 4개 파일의 SHA-256은 독립 QA가 보존한 스냅샷과 모두 일치했다. QA에서 차단됐던 API의 Windows 자체 재실행 성공이며, Claude가 직접 재검증했다고 표현하지 않는다.
- 작업 사본: D:의 여유 공간 0으로 기준 커밋 내보내기가 실패해 이번 작업의 미완성 `base.tar` 1개만 제거했다. C:의 임시 폴더에 기준 커밋 `bf6c129518738f22ecd86d765130d808aa3cf005`를 내보내고 현재 PC의 대상 파일을 덮어쓴다. 실제 경로·정합성 결과와 파일별 해시는 `test-results/task025-followup/verification.json`·`overlay-manifest.json`에 기록한다. 원본 QA 39개 파일의 보존 해시도 확인한다.
- 제출 범위는 기존 17개 파일 + 독립 QA 보고서 사본 1개 = **18개**다. 정책 문서·공통 설정·다른 작업 폴더와 QA 원본 39개 파일은 스테이징 대상에 포함하지 않는다.

## 기존 작업 카드·초기 구현 기록

- 사용자 승인: `25 진행해줘` (2026-11-18).
- 담당: 성윤우 / 구현: Codex / 기준: develop `bf6c129`.
- 요구사항: FR-17·18, DR-08, NFR-01~04·07~08 / ADR-016.
- 검증: TC-06·08·09, 관련 단위·통합·E2E, lint/typecheck/test/build.
- 허용 경로: `src/features/battle-tools/**`, `tests/unit/battle-tools/**`, `tests/integration/battle-tools/**`, `tests/e2e/battle-tools/**`.
- 금지 경로: 다른 feature, app, shared, scripts, 정책 문서, 패키지·설정. 아래 공통 변경 요청은 별도 승인 후에만 적용한다.
- 독립 QA: Claude 또는 다른 팀원 / 최종 사람 승인: 기능 오너. 자체 검증만으로 QA PASS·DONE 처리하지 않는다.

## 인수 조건

1. 세팅이 있는 9·8·7·6세대 탭만 최신순으로 표시하고, 최초 조회 및 종·폼 변경 시 가장 최신 세대를 연다.
2. 세대별 요청·캐시를 분리하며 재방문·폼 변경 시 같은 세대 파일을 공유한다. 일부 세대 실패는 부재와 구분하고 재시도할 수 있다.
3. 리전폼·기타 폼은 검증한 Smogon 이름으로 정확히 연결한다. 미지원·최신 메가의 세팅이 없으면 다른 폼으로 대체하지 않는다. 메가 세팅은 ADR-016의 6·7세대 범위에서만 제공한다.
4. 메가레쿠쟈는 anythinggoes 중 Dragon Ascent 기술이 있는 세팅만 표시하고, 기본 레쿠쟈와 분리한다.
5. ADR-016의 변칙 포맷 9종을 제외한다. 기본 대전 포맷·번역 정책(OQ-19)은 기존 사용자 선택 방식을 유지한다.
6. 한국어 상태 안내·키보드·모바일·기존 공개 컴포넌트 연결을 유지한다.

## CR-025-TEST — 관련 테스트

사용자 승인 TASK-025의 위 테스트 경로 안에서 세대 선택·캐시·부분 실패·폼 매핑 회귀를 검증한다. 다른 담당 테스트와 공통 테스트 기준은 변경하지 않는다.

## CR-025-SMOGON-SCOPE — 공통 설정 변경 요청 (승인 대기)

- 이유: TASK-013의 지원 범위 단일 원본 규칙을 지키면서 여러 Smogon 세대를 지원해야 한다.
- 대상: `src/shared/config/scope.json`, `src/shared/config/scope.ts` 두 파일.
- 변경안: JSON의 `smogon`에 `"generations": [9, 8, 7, 6]`을 추가하고 Scope의 smogon 타입에 `generations: readonly number[]`을 추가한다.
- 기존 `generation: 6`과 `SMOGON_FORMAT_GEN`은 유지해 기존 소비자와 테스트의 호환성을 보존한다. 새 기능만 generations를 읽는다.
- 영향: battle-tools의 새 세대별 요청·탭. 검색 인덱스·포켓몬 범위·게임 버전·기존 공개 API에는 변경 없음.
- 공통 책임자: 김형균. 적용 전 명시적 범위 승인 필요(OWNERSHIP §3·4, WORKFLOW §3·7).

## 실행 기록

- 브랜치: `feat/TASK-025-smogon-generations`. 시작 시 `git pull --ff-only origin develop` 성공(이미 최신).
- 다중 세대 API·Query Key·캐시 공유, 지원 데이터가 있는 세대 탭·최신 기본 선택·키보드 이동, 부분 실패·개별 재시도, 리전폼 이름 차이·최신 메가 정확 일치·메가레쿠쟈 분리·변칙 포맷 제외를 구현했다.
- **공통 설정 요청은 승인 대기이며 두 공통 파일은 수정하지 않았다. 실제 앱의 활성 세대는 여전히 6세대다.** 새 기능은 다중 세대 설정과 기존 단일 세대 설정을 모두 읽는다. 단위·통합 검증에서는 공통 설정 mock으로 9·8·7·6세대를 검증했다.
- 변경 파일(17개):
  - 기능·기록 8개: `api/queryKeys.ts`, `api/smogon.ts`, `hooks/useSmogonSets.ts`, `model/smogon.ts`, `model/generations.ts`, `components/SmogonSetsSection.tsx`, `components/SmogonSetsSection.css`, 이 기록.
  - 단위 3개: `tests/unit/battle-tools/{megaSets,forms,generations}.test.ts`.
  - 통합 4개: `tests/integration/battle-tools/fixtures.ts`, `SmogonSetsSection.test.tsx`, `SmogonGenerations.test.tsx`, `verify-live-smogon.mjs`.
  - E2E 2개: `tests/e2e/battle-tools/{smogon,smogon-generations}.spec.ts`.

| 명령 | 결과 |
|---|---|
| `npm.cmd ci --no-audit --no-fund` | 성공, 기존 lockfile 기준 의존성 복구(156개). 패키지·lockfile 변경 없음 |
| `npm.cmd run lint` | 성공, oxlint·모듈 경계 검사 통과 |
| `npm.cmd run typecheck` | 성공 |
| `npm.cmd test -- tests/unit/battle-tools tests/integration/battle-tools` | 성공, 13개 파일·100개 테스트 통과 |
| `npm.cmd test` | 성공, 전체 48개 파일·370개 테스트 통과. 기존 jsdom scrollTo 미구현 안내 발생 |
| `npm.cmd run build` | 성공, 751KB 청크의 500KB 초과 경고 있음 |
| `node tests/integration/battle-tools/verify-live-smogon.mjs` | 성공, 실제 API 4개 세대 파일 정규화·대표 폼 매핑 7건 |
| `npm.cmd run test:e2e -- tests/e2e/battle-tools/smogon.spec.ts tests/e2e/battle-tools/smogon-generations.spec.ts --workers=1 --reporter=list --output=test-results/task025-e2e-recheck` | 종료 0, 기존 4개 통과·새 다중 세대 3개 건너뜀(공통 설정 승인 대기). 전체 E2E 통과 또는 다중 세대 E2E PASS가 아님 |
| `git diff --check` | 성공 |

초기 typecheck는 누락된 Playwright/user-event 의존성으로 실패했고 기존 lockfile 기준 npm ci 후 통과했다. 초기 폼 테스트는 최신 메가 이름 별칭 미적용 1건이 실패했고 정확한 별칭을 적용한 뒤 관련·전체 테스트가 통과했다. 첫 E2E 시도는 JSON import 속성 누락으로 실패했으며 import를 수정했다. 다음 샌드박스 실행은 종료가 지연되어 중단했으므로 PASS로 세지 않는다. 샌드박스 밖 재실행에서 위 종료 0의 결과를 확보했다. API 검증의 최초 네트워크 차단도 별도 권한 실행 후 해소했다.

### 실제 API 근거 (2026-11-18)

- 출처·스키마: [pkmn/smogon](https://github.com/pkmn/smogon), 기존 승인 출처 `https://data.pkmn.cc/sets/gen{N}.json`의 응답을 새 코드로 직접 정규화했다.
- 최종 응답은 `https://pkmn.github.io/smogon/data/sets/gen{N}.json`, 4개 모두 HTTP 200·CORS `*`. 키 수는 gen9 656 / gen8 624 / gen7 830 / gen6 728이다. 배포 origin 브라우저의 CORS 검증은 별도다.
- 실제 세팅을 확인한 폼: gen9 알로라 라이츄·팔데아 켄타로스 블레이즈종·암컷 에써르, gen8 가라르 불비달마, gen7 메가리자몽X·메가레쿠쟈, gen6 메가리자몽Y.
- 이름 예외는 [Pokémon Showdown data/pokedex.ts](https://github.com/smogon/pokemon-showdown/blob/master/data/pokedex.ts)의 정식 키와 대조했다. 새 메가의 특정 세대 세팅 존재를 보장하지 않는다. 데이터가 없으면 부재로 처리한다.

### 남은 검증·승인

1. CR-025-SMOGON-SCOPE의 두 파일 변경 승인·적용 후 다중 세대 E2E 3건과 필요한 회귀 검증.
2. 다중 세대 실제 화면의 PC·320px 모바일 시각 확인, 실제 스크린리더·다른 브라우저·배포 origin은 미검증.
3. Claude/다른 팀원의 독립 QA, 기능 오너 사람 승인. 정식 TASK 상태·정책 문서는 변경하지 않았다.
4. 커밋·푸시·PR·병합·배포는 수행하지 않았다. 기존 다른 작업 폴더·미커밋 파일은 유지했다.
