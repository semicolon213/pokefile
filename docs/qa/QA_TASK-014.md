# QA 보고서 — TASK-014

- 대상 TASK: TASK-014 내 게임 선택 (URL `game` + localStorage `pokefile:my-game`), 출현 장소 필터 연동
- 요구사항 ID: FR-26, ADR-011(내 게임 항목)
- PR/Commit: PR #14 (`ba8ea3d`, 병합 `6ff8f18`) / develop `7c469bc` 기준 검증
- 구현자 및 도구: Claude Code (semicolon213 지시)
- 독립 검증자 및 도구: Claude Code 독립 QA 세션 (구현 세션과 별도)
- 검증 일자: 2026-11-04
- 결과: **FAIL** — 뒤로 가기만으로 사용자가 고른 내 게임이 이전 값으로 되돌아가고 저장값까지 바뀜(D-014-01, "선택 유지" 조건 위반)

## 1. 범위 확인
- [x] 허용 경로: `src/app/layout/MyGameSelect.tsx`·`RootLayout.tsx`, `src/shared/state/myGame.ts`, `global.css`, `vite.config.ts`, `tests/**` — 김형균 관리 영역
- [~] 타인 소유 영역: `pokemon-detail/components/EncountersSection.tsx`(+52 −24), `model/encounters.ts`, `PokemonDetailPage.css`(임지섭). PR 본문에 "연결부 확인 부탁" 명시. 변경량이 '최소 연결'보다 크고(문구·토글 UI 추가), **리뷰·코멘트 0건으로 동의 기록 없음**
- [x] 같은 PR에서 SRS·DESIGN·DECISIONS(ADR-011 내 게임 항목)·API_SPEC 변경 — 근거는 "팀 결정(semicolon213 전달)"

## 2. 요구사항별 결과
| 요구사항/인수 조건 | 증거 | 결과 |
|---|---|---|
| 상단 바에서 지원 범위 본편 게임 선택(세대별 묶음, 기본 `전체 게임`) | `MyGameSelect.tsx:51-67`, 38개 버전 optgroup | PASS |
| localStorage 저장·새로고침 후 유지 | `myGame.ts:35-45`, E2E `my-game.spec.ts` 통과, QA 프로브에서 `ls=red` 확인 | PASS |
| URL `game`으로 공유, 공유 링크가 저장값보다 우선 | `#/favorites?game=gold` 진입 시 저장값 gold로 바뀜(프로브) | PASS |
| 저장값이 있으면 모든 화면 주소에 `game`을 붙임(replace) | `MyGameSelect.tsx:25-33`; 상단 메뉴 `타입 상성` 이동 후 `#/types?game=red`(프로브) | PASS |
| 지원 범위 밖 값 무시 | `?game=foo` + 저장 gold → `game=gold`로 교체, `?game=champions` 무시(통합 테스트) | PASS |
| 저장소 차단 시 세션 메모리 유지 | `myGame.ts:28-33`, 단위 테스트 통과 | PASS |
| **선택이 같은 브라우저에서 유지(FR-26)** | 프로브: 목록 `game=x` → 카드 클릭 → 상세에서 `레드` 선택(저장 red) → 브라우저 뒤로 → 주소 `#/?game=x`, select=x, **저장값 x로 덮어씀**. `/types`에서도 동일(gold→red). 원인 `MyGameSelect.tsx:24` — 기록 항목의 옛 `game`을 "공유 링크"로 취급 | **FAIL** |
| 출현 장소가 내 게임 기준(FR-26) — 데이터 있는 게임 | E2E: 레드만 표시·`모든 게임 보기`로 펼침. `filterEncountersByGame`(`encounters.ts:61-63`) | PASS |
| 출현 장소 — 데이터 없는 게임·확장팩(ADR-016) | 피카츄 + 스칼렛/브릴리언트 다이아몬드: "…에서는 야생에서 만날 수 없습니다." 야돈 + 소드: 같은 문구(PokéAPI에는 `the-isle-of-armor-sword` 출현 있음). ADR-016은 이 처리를 TASK-024에 배정 | 범위 밖(D-014-02로 기록) |

## 3. 실행한 검증
| 명령/절차 | 실행 여부 | 결과 | 로그 |
|---|---|---|---|
| lint | 실행 | PASS | `lint.log` |
| typecheck | 실행 | PASS | `tsc.log` |
| test | 실행 | PASS — 245/245 (myGame 4, my-game 통합 4, encounters-my-game 2 포함) | `vitest.log` |
| build | 실행 | PASS | `build.log` |
| E2E | 실행 | PASS — 41/41 (`my-game.spec.ts` 1건 포함) | `e2e.log` |
| 수동/API: Playwright 프로브(빌드본 `vite preview :4174`, 저장소 밖 스크립트 `probe2.mjs`·`probe5.mjs`) | 실행 | 위 §2 결과 | 스크래치 `qa/` |

## 4. 결함
| 심각도 | 재현 절차 | 기대/실제 | 담당 |
|---|---|---|---|
| **중 (D-014-01)** | 1) `#/` 에서 내 게임 `X` 선택 2) 카드 클릭해 상세 3) 상세에서 내 게임 `레드` 선택 4) 브라우저 뒤로 | 기대: 레드 유지(사용자의 마지막 선택). 실제: 목록 주소의 옛 `game=x`가 적용되어 select·localStorage가 X로 되돌아감. `MyGameSelect.tsx:24` `if (urlGame && urlGame !== stored) setMyGame(urlGame)`이 기록 이동(POP)도 공유 링크로 처리. 자동 테스트 없음 | 김형균 |
| 중 (D-014-02) | 내 게임 `스칼렛`(또는 BDSP·LEGENDS 아르세우스·바이올렛·Z-A) → `#/pokemon/25` 출현 정보 / 내 게임 `소드` → `#/pokemon/79` | 기대(ADR-016): "이 게임의 출현 장소 데이터가 없습니다", 확장팩 출현은 본편에 합침. 실제: "스칼렛에서는 야생에서 만날 수 없습니다." — **사실과 다른 안내**. `EncountersSection.tsx:42`, `encounters.ts:46`(`includes` 무시), `hasEncounters` 미사용. TASK-023이 해당 게임을 내 게임 목록에 노출했고 화면 처리는 TASK-024(BACKLOG) | 임지섭(TASK-024), 노출 시점 판단 김형균 |
| 하 (D-014-03) | `#/pokemon/906` | 빈 상태 문구 "6세대 이하 게임에서 야생 출현 정보가 없습니다."(`EncountersSection.tsx:25`) — 9세대 범위와 맞지 않음 | 임지섭 |
| 하 (절차) | PR #14 | 임지섭 소유 컴포넌트 UI 변경에 동의 기록 없음 | 김형균 → 임지섭 |

## 5. 결론
- PASS/FAIL/BLOCKED 사유: 저장·공유·범위 검사·출현 필터는 동작하지만, 흔한 조작(상세에서 게임 변경 후 뒤로 가기)으로 선택이 되돌아가 FR-26 "선택은 같은 브라우저에서 유지" 조건을 어긴다. ADR-011의 "공유 링크의 game이 저장값보다 우선"은 공유 링크 진입을 말하며 기록 이동까지 포함한다고 보기 어렵다. **팀이 "주소의 game이 언제나 우선"을 의도한 것이라면 명세 해석 문제이므로 사람 결정 후 재판정**한다.
- 남은 위험/미검증 항목: 기술 표 연동(FR-27)은 TASK-015 미구현으로 미검증. D-014-02는 TASK-024 완료 전까지 사용자에게 잘못된 정보를 보여 준다.
- 수정 요청: D-014-01 — 최초 진입(또는 PUSH가 아닌 외부 링크)만 URL 값을 저장하고, 기록 이동 시에는 저장값으로 주소를 교체하는 등. 회귀 테스트(뒤로 가기) 추가. D-014-02 — TASK-024 전까지 `hasEncounters:false` 게임에 최소한 "데이터 없음" 문구를 쓰거나 목록 노출 여부를 결정.
- 사람 승인자: 김형균(기능 오너), 영향 확인 임지섭
- 문서 갱신 별도 TASK: ADR-011 "공유 링크 우선"의 적용 범위(기록 이동 포함 여부) 명확화
