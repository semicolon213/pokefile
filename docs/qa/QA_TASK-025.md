# QA 보고서 — TASK-025

- 대상 TASK: TASK-025 실전 세팅 세대 탭(9·8·7·6, 최신 기본)·리전폼/메가/최신 메가 매핑·메가레쿠쟈 규칙·변칙 포맷 제외 목록 확장
- 요구사항 ID: FR-17·18, DR-08, ADR-016(실전 세팅), TC-06·08·09
- PR/Commit: PR #45 (`0c61659`, 기준 `bf6c129`) — **최신 develop `0a56622`에 병합한 결과**(로컬 병합, 충돌 없음)로 검증
- 구현자 및 도구: 성윤우(yoonwoo2002) / Codex
- 독립 검증자 및 도구: Claude Code 독립 QA 세션(임지섭 요청). 구현 도구(Codex)와 다름. 앞선 Claude Cowork QA(`src/features/battle-tools/QA_TASK-025_independent.md`, 1차 FAIL → D-01 재검증 PASS)와도 별도로 처음부터 다시 검증했다
- 검증 일자: 2026-11-25
- 결과: **BLOCKED** — 담당 코드는 **PASS**, TASK 전체 인수는 공통 설정 변경(CR-025-SMOGON-SCOPE) 미적용으로 BLOCKED

## 1. 범위 확인
- [x] 허용 경로만 수정: 18개 파일 모두 `src/features/battle-tools/**`, `tests/{unit,integration,e2e}/battle-tools/**`
- [x] 타인 소유 영역 변경 없음. 상세 화면 연결부(`pokemon-detail/pages/PokemonDetailPage.tsx:165-172`)는 변경 없이 기존 `{ speciesName: species.name, formKey }` 계약 그대로 사용
- [x] SRS/DESIGN/공통 API 계약 변경 없음. 공통 설정 `src/shared/config/scope.json`·`scope.ts`는 **수정하지 않고** CR-025-SMOGON-SCOPE로 요청만 함(승인·이슈 기록 없음, develop의 `smogon`은 `{ "generation": 6 }` 그대로)
- 참고(하): QA 보고서 사본·작업 기록(`QA_TASK-025_independent.md`, `TASK-025.md`)이 `src/features/battle-tools/`에 있다. QA 보고서 위치 규칙(`docs/qa/`)과 다르며 제품 소스 폴더에 문서가 섞인다(빌드 산출물에는 포함되지 않음)

## 2. 요구사항별 결과
검증 기준: 2026-11-25 data.pkmn.cc `sets/gen{9,8,7,6}.json` 실데이터. 앱이 실제로 넘기는 값(PokéAPI `species.name` + 폼 키)으로 PR의 `model/smogon.ts`를 그대로 번들해 1025종·326개 폼 × 4세대를 전수 변환했다(`smogon-probe.log`). 화면은 **CR-025 변경안(`generations: [9, 8, 7, 6]`)을 QA 사본에만 임시 적용**한 빌드에 실제 네트워크로 확인했다(`smogon-screen.log`, 스크린샷). 이 모의 적용은 저장소에 반영하지 않았다.

| 요구사항/인수 조건 | 증거 | 결과 |
|---|---|---|
| 세팅 있는 세대만 최신순 탭, 최신 기본 | 모의 적용 화면: #6 리자몽 `[9,8,7,6]` 선택 9세대, 알로라 라이츄 `[9,8,7]`, 오거폰(우물가면) `[9]`, 복숭악동 `[9]` | PASS(모의) |
| 커버리지(ADR-016 실측과 대조) | 기본 폼 세팅 있음 **911종 / 없음 114종** — ADR-016 "911종 커버, 114종 정보 없음"과 일치 | PASS |
| 세팅 없음 안내(FR-18) | 캐터피 #10, 메가라이츄X: 탭 없이 `등록된 실전 세팅이 없습니다.` | PASS |
| 세대별 요청·캐시 분리·공유 | 화면 요청 gen 6·7·8·9 각 1회, 메가 폼은 gen 6·7만 요청. E2E `smogon-generations.spec.ts:21` 요청 목록 `[6,7,8,9]` | PASS(모의) |
| 부분 실패·재시도(TC-09) | E2E `smogon-generations.spec.ts:45`: 9세대 503 → `9세대 실전 세팅을 불러오지 못했습니다.` + 8세대 선택, 재시도 후 9세대 선택·오류 0. 기존 단일 세대 오류 E2E도 `6세대 …` 문구로 통과 | PASS(모의) |
| 리전폼·기타 폼 매핑(DR-08) | 다른 종 세팅이 섞인 경우 0건. 알로라 라이츄 9·8·7, 팔데아 켄타로스(블레이즈종) 9, 네크로즈마(황혼의 갈기) 9·8·7, 오거폰 가면 9, 우라오스 연격 9·8, 블랙큐레무 9~6, 워시로토무 9~6, 니드런♀(`nidoran-f`)·마임맨(`mr-mime`) 정상 | PASS |
| 메가는 6·7세대 탭만 | 메가리자몽X `[7,6]`, 메가레쿠쟈 `[7,6]`. 최신 메가(메가라이츄X)는 부재 처리, 다른 폼으로 대체 없음 | PASS |
| 메가레쿠쟈 규칙 | 6·7세대 메가: `anythinggoes`만(각 4세트, 화룡점정). 7세대 기본: `vgc2019`·`ubers`만(화룡점정 AG 세트 제외) | PASS(8세대는 D-03) |
| 변칙 포맷 9종 제외 | 원본에 있는 `almostanyability balancedhackmons camomons cap godlygift mixandmega partnersincrime purehackmons stabmons` 모두 제외. `inheritance`는 남음(D-05) | PASS |
| 키보드·모바일(TC-08) | 320px: 탭 줄바꿈, 가로 넘침 없음, `End`→6세대 선택·포커스, `→` 순환. E2E `smogon-generations.spec.ts:62` 통과 | PASS(모의) |
| 실제 앱(develop 설정) | 설정이 6세대만이라 탭은 6세대 하나. 다중 세대 기능은 실제 앱에서 **동작하지 않음** | **BLOCKED** |

## 3. 실행한 검증
PR 헤드를 최신 develop(`0a56622`)에 병합한 QA 사본에서 실행했다. 로그는 QA 세션 scratchpad `qa025-logs/`.

| 명령/절차 | 실행 여부 | 결과 | 로그 |
|---|---|---|---|
| lint (`npm run lint`) | 실행 | PASS — 종료 0. 경고 1건은 타 영역(`pokedex/components/StatFilter.tsx:16`) | `lint.log` |
| typecheck (`npx tsc -b`) | 실행 | PASS — 종료 0 | `tsc.log` |
| test (`npx vitest run`) | 실행 | PASS — 50파일 406/406 | `vitest.log` |
| build (`npm run build`) | 실행 | PASS — 기존 청크 크기 경고만 | `build.log` |
| E2E (`npx playwright test`, 실제 설정) | 실행 | PASS — 69 통과, **다중 세대 3개 SKIPPED**(설정 대기) | `e2e.log` |
| 실데이터 (`node tests/integration/battle-tools/verify-live-smogon.mjs`) | 실행 | PASS — 4개 세대 정규화, 폼 매핑 15건, 326폼 × 4세대 캐시 불변 | `verify-live.log` |
| 모의 적용 후 typecheck·관련 테스트·battle-tools E2E(`CI=1`, 새 빌드) | 실행 | PASS — tsc 0, 관련 112/112, E2E 17/17(**다중 세대 3개 포함, SKIP 0**) | `sim-*.log` |
| 수동: 전수 매핑(`smogon-probe.mjs`), 모의 적용 화면 12케이스(1280·320px) | 실행 | §2·§4 | `smogon-probe.log`, `smogon-screen.log`, `shots/` |

## 4. 결함 및 확인 사항
| 심각도 | 재현 절차 | 기대/실제 | 담당 |
|---|---|---|---|
| **차단** (CR-025-SMOGON-SCOPE) | develop에서 `#/pokemon/6` | 기대: 9·8·7·6세대 탭. 실제: 공통 설정이 6세대뿐이라 6세대 탭만. 공통 설정 변경(`scope.json`에 `generations: [9, 8, 7, 6]`, `scope.ts` 타입) 승인·적용 전에는 TASK-025 인수 불가 | 김형균(공통) 승인 → 성윤우 |
| 하 (D-02, 기존) | 다중 세대, 탭을 누르지 않고 먼저 온 세대에서 포맷 선택 후 더 최신 세대가 늦게 도착 | 탭이 최신 세대로 바뀌고 고른 포맷이 초기화됨(`SmogonSetsSection.tsx:39-45,87`). 이전 QA 지적 그대로, 오너 결정 대기 | 성윤우 |
| 하 (D-03, 기존·재확인) | 8세대 기본 레쿠쟈 | `dlc1nationaldexag` 세트 3개와 `anythinggoes: Dynamax Sweeper`가 기본 탭에 표시. 메가레쿠쟈 분리 규칙이 6·7세대에만 적용(`model/smogon.ts:179`) | 성윤우(사양 결정) |
| 하 (D-04, 기존) | 일가족 #925 | `family-of-three` 폼은 어느 세대에도 연결 안 됨 | 성윤우 |
| 하 (D-05, 기존·재확인) | 9세대 포맷 목록 | `inheritance`(변칙 OM)가 ADR-016 제외 목록 밖이라 표시됨 | 성윤우·팀(사양) |
| 확인 (C-01, 기존·재확인) | 실데이터 미도달 키 | 아르세우스 타입 17종(9·7·6세대), 실버디 타입(8·7세대), `Sinistcha-Masterpiece`는 인덱스에 폼이 없어 표시 안 됨 | 성윤우·김형균(인덱스 범위) |
| 확인 (신규) | 실데이터 미도달 키 | 8·9세대 National Dex의 **메가 세트**(9세대: 독침붕·피죤투·캥카·쁘사이저·프테라·강철톤·핫삼-Mega·마기라스-Mega·입치트·보스로라·썬더볼트·샤크니아·폭타-Mega·다크펫·앱솔·이어롭 16키, 8세대: 전룡·헬가·폭타 3키)는 ADR-016 "메가는 6·7세대 탭" 규칙대로 표시되지 않는다. 코드는 사양과 일치하나 데이터상 8·9세대에도 메가 세트가 있다는 점을 오너가 알고 결정할 필요 | 성윤우(사양 확인) |
| 하 (테스트) | `verify-live-smogon.mjs:42` | 실데이터 전수 검사가 앱이 넘기는 `species.name`(예: `nidoran-f`, `mr-mime`)이 아니라 인덱스 `nameEn`으로 조회한다. 이번 QA에서 `species.name`으로 다시 돌려 결과가 같음을 확인했으므로 영향은 없음 | 성윤우 |
| 하 (문서 위치) | `src/features/battle-tools/QA_TASK-025_independent.md`, `TASK-025.md` | QA 보고서·작업 기록이 제품 소스 폴더에 있음. `docs/qa/`로 옮기거나 PR 설명으로 대체 권장 | 성윤우 |
| 하 (D-06, 기존) | — | 문구·분류 경미 사항, 이전 QA 보고서 그대로 | 성윤우 |

새로 발견한 기능 결함은 없다. 이전 QA의 D-01(네크로즈마·오거폰 매핑 누락)은 실데이터로 해결을 다시 확인했다.

## 5. 결론
- PASS/FAIL/BLOCKED 사유: PR #45의 코드는 최신 develop과 병합해도 모든 자동 검증을 통과하고, CR-025 설정을 임시로 적용하면 세대 탭·캐시·부분 실패·폼 매핑·메가 규칙·키보드·320px가 모두 기대대로 동작한다(**담당 코드 PASS**). 그러나 공통 설정 변경이 승인·적용되지 않아 develop의 실제 앱에서는 다중 세대가 동작하지 않으므로 TASK-025 전체는 **BLOCKED**.
- 남은 위험/미검증 항목: 데이터는 data.pkmn.cc 실시간 파일이라 세대 파일이 바뀌면 커버리지가 달라진다. 다크 모드·스크린리더·배포 origin(GitHub Pages) CORS는 확인하지 않았다. 화면 확인은 모의 설정 빌드 기준이다.
- 수정 요청: (1) 김형균: CR-025-SMOGON-SCOPE 승인 여부 결정·적용(이슈 또는 공통 PR). (2) 성윤우: D-02~D-05·C-01과 8·9세대 National Dex 메가 세트 처리 결정. (3) 선택: QA·작업 기록 문서 위치 정리.
- 병합 판단 참고: PR #45를 지금 병합해도 실제 앱 동작은 기존(6세대)과 같다(기존 E2E 통과, 다중 세대 E2E는 설정 적용 시 자동 활성). 병합 시점은 기능 오너(성윤우)가 정한다.
- 재검증 조건: CR-025 적용 후 develop에서 다중 세대 E2E 3건이 SKIP 없이 통과하고, 실제 앱 화면에서 §2의 "모의" 항목을 다시 확인하면 PASS로 바꿀 수 있다.
- 사람 승인자: 성윤우(기능 오너), CR-025는 김형균(공통)
- 문서 갱신 별도 TASK: 8·9세대 메가 세트·National Dex AG 레쿠쟈·`inheritance` 결정을 ADR-016에 보완
