# QA 보고서 — TASK-021

- 대상 TASK: TASK-021 타입 상성 — `/types` 화면 + 상세 `TypeMatchups` 섹션, 생성 데이터 `type-chart.json`
- 요구사항 ID: FR-24, DESIGN §2.2·§2.4.1, API_SPEC §5.4, TC-11
- PR/Commit: PR #21 (`6914b16`, 병합 `b5d333d`) / develop `7c469bc` 기준 검증
- 구현자 및 도구: Claude Code (semicolon213 지시)
- 독립 검증자 및 도구: Claude Code 독립 QA 세션 (구현 세션과 별도)
- 검증 일자: 2026-11-04
- 결과: **PASS**

## 1. 범위 확인
- [x] 허용 경로: 새 feature `src/features/type-chart/**`(김형균 소유, OWNERSHIP §1), `scripts/build-type-chart.mjs`, `package.json` script, `src/app/**`(라우트·메뉴)
- [~] 타인 소유 영역: `pokemon-detail/pages/PokemonDetailPage.tsx` +3줄(공개 컴포넌트 호출), 상세 테스트 로케이터 범위 조정. TASKS 교차 규칙대로 공개 API로 제공·PR에 확인 요청. **리뷰 0건, 동의 기록 없음**
- [x] 라우트 추가(`/types`)는 SRS §6·ADR-011 라우트 목록에 없음(DESIGN §2.4.1에만 있음) → 문서 정합성 비고

## 2. 요구사항별 결과
| 요구사항/인수 조건 | 증거 | 결과 |
|---|---|---|
| 상성표 데이터 정확성(1배 아닌 칸 120) | QA가 독자적으로 작성한 6세대 이후 상성표와 18행 전부 대조 → 불일치 0, 120칸. 화면 표: 324칸 중 0배 8·2배 51·½배 61·빈 칸 204 | PASS |
| 현재 PokéAPI와 일치 | verify-api "타입 상성표가 damage_relations와 일치" 통과, 사본 재생성 결과 바이트 동일 | PASS |
| 표 칸 표본 | 노말→고스트 0, 땅→비행 0, 드래곤→페어리 0, 독→강철 0, 불꽃→풀 2, 격투→노말 2, 페어리→드래곤 2, 강철→페어리 2, 물→물 ½ | PASS |
| 리자몽(불꽃·비행): 바위 ×4·땅 무효·풀/벌레 ×¼ | 상세 섹션 실화면: ×4 바위 / ×2 물·전기 / ×½ 불꽃·격투·강철·페어리 / ×¼ 풀·벌레 / ×0 땅 | PASS |
| 메가리자몽X는 불꽃·드래곤 기준(폼 타입) | `?form=mega-x`: ×2 땅·바위·드래곤 / ×½ 전기·벌레·강철 / ×¼ 불꽃·풀. 알로라 라이츄(전기·에스퍼)·워시로토무(전기·물)도 확인 | PASS |
| 방어 타입 1~2개 선택, 2개면 나머지 비활성, URL `?type=` 표준 순서, 3개 이상 URL은 2개로 | 2개 선택 시 비활성 16, `type=fire&type=flying`; `?type=flying,fire,water` → `불꽃·물` | PASS |
| 고른 열 강조·범례·숫자 항상 표기 | `TypeChartTable.tsx:21-26,47`, 강조 머리 칸 `불꽃`,`비행` | PASS |
| 상세 섹션 위치·`전체 상성표` 링크·안내 문구 | 섹션 순서 기본 정보→종족값→타입 상성→진화→출현→실전; 링크 `#/types?type=fire&type=flying` | PASS |
| 좁은 화면 페이지 가로 넘침 없음 | 390px `/types` overflow 0 | PASS |
| 다크 AA | QA_TASK-020 스캔에 `/types` 포함, 미달 0 | PASS |

## 3. 실행한 검증
| 명령/절차 | 실행 여부 | 결과 | 로그 |
|---|---|---|---|
| lint | 실행 | PASS | `lint.log` |
| typecheck | 실행 | PASS | `tsc.log` |
| test | 실행 | PASS — 245/245 (matchup 4, TypeChartPage 통합 3) | `vitest.log` |
| build | 실행 | PASS | `build.log` |
| E2E | 실행 | PASS — 41/41 (`type-chart.spec.ts` 2건) | `e2e.log` |
| verify-api | 실행 | PASS — 14/14 (상성표 일치 포함) | `verify-api.log` |
| 수동: `chart-check.mjs`(독자 상성표 대조), `probe4.mjs`·`probe5.mjs` | 실행 | §2 결과 | 스크래치 `qa/` |

## 4. 결함
| 심각도 | 재현 절차 | 기대/실제 | 담당 |
|---|---|---|---|
| 하 (D-021-01) | `#/pokemon/479?form=wash` → `전체 상성표` | 상세 문구는 폼 타입 순서 `전기·물`(`TypeMatchups.tsx:22`), 링크는 표준 순서 `type=water&type=electric`(`params.ts:15`)라 상성표 화면은 `물·전기 타입이 받는 피해`로 표기가 바뀜 | 김형균 |
| 하 (명세) | SRS §6, ADR-011 라우트 목록 | `/types` 라우트가 SRS·ADR에 없음(DESIGN에만) | 문서 작업 |
| 하 (절차) | PR #21 | 상세 연결부(임지섭) 확인 기록 없음 | 임지섭 |

## 5. 결론
- PASS/FAIL/BLOCKED 사유: 상성 데이터 120칸을 독자 표와 대조해 전부 일치하고, 상세·전체 화면 모두 폼 타입 기준으로 올바르게 계산·표시된다.
- 남은 위험/미검증 항목: 특성·테라스탈 미반영은 명세대로(안내 문구 있음). 화면 낭독기 실사용 미확인.
- 수정 요청: 없음(D-021-01 선택).
- 사람 승인자: 김형균(기능 오너), 상세 연결부 임지섭
- 문서 갱신 별도 TASK: SRS §6·ADR-011 라우트 목록에 `/types` 추가
