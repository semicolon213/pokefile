# QA 보고서 — TASK-013

- 대상 TASK: TASK-013 지원 범위 설정 일원화 (`src/shared/config/scope.json`·`scope.ts`)
- 요구사항 ID: ADR-015, DR-01~08
- PR/Commit: PR #12 (`0129d1d`, 병합 `3389920`) / develop `7c469bc` 기준 검증
- 구현자 및 도구: Claude Code (semicolon213 지시)
- 독립 검증자 및 도구: Claude Code 독립 QA 세션 (구현 세션과 별도)
- 검증 일자: 2026-11-04
- 결과: **PASS**

## 1. 범위 확인
- [x] 허용 경로 — `src/shared/config/**`, `src/shared/models/pokemon.ts`, `src/shared/ui/typeLabels.ts`, `scripts/**`, `tsconfig.app.json`(모두 김형균 관리 공통 영역)
- [~] 타인 소유 영역: `src/features/pokemon-detail/model/{detail,encounters}.ts`(임지섭), `src/features/battle-tools/api/{smogon,queryKeys}.ts`(성윤우) 수정. 상수를 설정값으로 바꾸는 최소 변경이며 PR #12 본문 "변경 파일과 소유권"에 확인 요청 명시. **단, PR 리뷰·코멘트 0건 — 소유자 동의 기록 없음**
- [x] SRS/DESIGN 변경: 같은 PR에서 SRS·DESIGN·DECISIONS·OWNERSHIP 문서 변경(ADR-015). 근거는 "팀 결정(semicolon213 전달)" 기록뿐

## 2. 요구사항별 결과
| 요구사항/인수 조건 | 증거 | 결과 |
|---|---|---|
| 세대 목록·최대 번호·게임 버전·도감 설명 버전·Smogon 세대를 한 파일로 | `scope.json` 키 `maxPokemonId`·`generations`·`gameVersions`·`flavorTextVersions`·`smogon`(+TASK-019 `pokedexes`), 타입은 `scope.ts:27-40` | PASS |
| 앱·인덱스 스크립트·verify-api가 같은 파일을 읽음 | `scope.ts:1`, `build-pokedex-index.mjs:15`, `verify-api.test.mjs:11` | PASS |
| 파생 값이 설정을 따름 | `MAX_POKEMON_ID`·`GENERATIONS`(`shared/models/pokemon.ts:5,51`), `ENCOUNTER_VERSIONS`(`encounters.ts:9`), `SMOGON_FORMAT_GEN`(`scope.ts:45`) | PASS |
| 설정과 인덱스 불일치 시 테스트 실패 | `tests/unit/shared/scope.test.ts` 4개 통과(인덱스 count·id 연속·세대 집합·지방 도감 키) | PASS |
| "설정 변경 + 인덱스 재생성으로 확장" 목표 | TASK-023에서 실제로 721→1025 확장에 사용됨. 남은 하드코딩 검색: 앱 코드에 721/1025·버전 그룹 상수 없음(`grep` 결과 주석뿐) | PASS |
| 메가 판별 버전 그룹 | TASK-013 당시 `megaVersionGroups`가 scope.json에 있었고 TASK-023에서 모든 메가 포함으로 삭제. verify-api만 `GEN6_MEGA_GROUPS`를 하드코딩(`verify-api.test.mjs:14`) | PASS(비고) |

## 3. 실행한 검증
| 명령/절차 | 실행 여부 | 결과 | 로그 |
|---|---|---|---|
| lint | 실행 | PASS | `lint.log` |
| typecheck (`npx tsc -b`) | 실행 | PASS | `tsc.log` |
| test (`npx vitest run`) | 실행 | PASS — 39 files / 245 tests (scope.test 4개 포함) | `vitest.log` |
| build | 실행 | PASS | `build.log` |
| E2E | 실행 | PASS — 41/41 | `e2e.log` |
| verify-api | 실행 | PASS — 14/14 | `verify-api.log` |
| 수동: 사본에서 scope.json으로 인덱스 재생성 → 커밋본과 동일 | 실행 | 동일 | `regen-index.log` |

## 4. 결함
| 심각도 | 재현 절차 | 기대/실제 | 담당 |
|---|---|---|---|
| 하 (D-013-01) | `scope.ts:16-19`의 `includes`·`hasEncounters` 사용처 검색 | 설정에는 있으나 앱에서 읽는 곳 없음(출현 장소가 확장팩 버전을 합치지 않고, 데이터 없는 게임을 구분하지 않음). 화면 영향은 QA_TASK-014 D-014-02 | 임지섭(TASK-024) |
| 하 (D-013-02) | `verify-api.test.mjs:14,218` | 범위 관련 값 일부가 scope.json 밖에 남음 | 김형균 |
| 하 (절차) | PR #12 리뷰 기록 | 타인 소유 파일 4개 수정에 대한 소유자 동의 기록 없음(ADR-014 필수 승인 0이라 병합 자체는 규칙 위반 아님, OWNERSHIP §3-2 "동의 없이 수정하지 않는다"와 긴장) | 김형균 → 임지섭·성윤우 확인 |

## 5. 결론
- PASS/FAIL/BLOCKED 사유: 지원 범위 값이 한 파일에 모였고 앱·스크립트·테스트가 같은 값을 읽는다. TASK-023 확장이 이 구조로 실제 수행되었고 재생성 결과가 커밋본과 같다.
- 남은 위험/미검증 항목: 설정 필드(`includes`·`hasEncounters`)가 소비되지 않아 "설정만 바꾸면 끝" 목표가 출현 장소에서는 아직 성립하지 않음.
- 수정 요청: 없음(D-013-01은 TASK-024에서 처리).
- 사람 승인자: 김형균(공통), 영향 확인 임지섭·성윤우
- 문서 갱신 별도 TASK: 없음
