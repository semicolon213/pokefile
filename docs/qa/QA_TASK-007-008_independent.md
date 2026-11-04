# 독립 QA 보고서: TASK-007, TASK-008

- 대상: PR #3 `aaabf66`(공통 메가스톤 대응표), PR #4 `d59ae2c`·`804cd50`(실전 세팅·즐겨찾기) — `origin/develop...4750110` 기준 37개 파일
- 구현자 및 도구: 성윤우(`yoonwoo2002`) / Codex
- 독립 검증자 및 도구: Claude Code (Claude Opus 5.5), 읽기 전용 QA 모드 — 구현 도구와 달라 `WORKFLOW.md` §6 교차 QA 요건 충족
- 검증일: 2026-11-04
- 결과: **FAIL → 수정 후 재검증 PASS** (Major 1건은 통합 PR에서 해결, Minor 이하는 후속 과제)

## 1. 범위 확인
- 기능 변경은 `src/features/battle-tools/**`, `src/features/favorites/**`와 해당 테스트에 있음
- 다른 영역 수정은 최소 범위이며 근거가 PR에 기록됨
  - `src/features/pokedex/index.ts`(김형균): `PokemonCard`, `useSearchIndex` 공개 export 2줄
  - `src/features/pokemon-detail/pages/PokemonDetailPage.tsx`(임지섭): 실전 세팅 섹션 호출부 10줄
  - `src/shared/utils/megaStones.ts` 신규 + export(김형균): 기존 함수 변경 없음
- 사실상 영향: 즐겨찾기 버튼 접근성 라벨 변경이 김형균 소유 E2E를 깨뜨림(M-1)

## 2. 요구사항별 결과
| 요구사항 | 증거 | 결과 |
|---|---|---|
| FR-17 세팅 항목 표시 | `SmogonSetCard` 성격·특성·도구·노력치·개체값·기술, 실데이터 확인 | PASS |
| FR-18 데이터 없음과 요청 실패 구분 | Empty / Error+재시도 분리, E2E | PASS |
| FR-19~22 즐겨찾기 추가·해제·유지·목록 | 단위·통합·E2E, 새로고침 유지 | PASS |
| DR-04·08 이름·폼 매핑 | 실데이터(gen6.json 728종) 정규화 예외 0, 메가 47종 모두 세팅 1개 이상, 리자몽 X/Y 도구 분리, 기본 리자몽에 메가 세팅 미혼입 | PASS |
| ADR-009 변칙 포맷 제외·메가레쿠쟈 | `Rayquaza-Mega` 키는 hackmons 포맷뿐이라 제외, 기본 레쿠쟈로 채우지 않음 | PASS |
| ADR-012 저장 형식·종 단위 | 키·스키마·1~721 정수·중복 제거·순서 유지·손상 시 빈 목록+안내, 메가X 화면 저장 결과 `[25,6]` | PASS |
| DESIGN §5.1 버튼이 카드 이동을 일으키지 않음 | 버튼이 `<Link>` 밖 형제 + `stopPropagation` | PASS |
| TEST_PLAN §4 해당 자동 테스트 성공 | 1차: E2E 28/29 (M-1) → 수정 후 29/29 | 1차 FAIL → PASS |

## 3. 실행한 검증
| 명령 | 1차 (PR #4 head `804cd50`) | 재검증 (통합 브랜치, M-1 수정 후) |
|---|---|---|
| `npm run verify` | PASS — 25 files / 157 tests, build 청크 690 kB 경고 | PASS — 25 files / 157 tests |
| `npm run test:e2e` | **FAIL — 28 passed / 1 failed** (`tests/e2e/pokedex/search.spec.ts` 즐겨찾기 버튼 로케이터) | PASS — 29 passed |
| 실데이터 프로브 (`data.pkmn.cc/sets/gen6.json` + PR 정규화·선택 코드) | 위 §2 결과 | — |
| 모바일 실기기·스크린리더 | 미실행 | 미실행 |

## 4. 결함
| ID | 심각도 | 위치 | 내용 | 조치 |
|---|---|---|---|---|
| M-1 | **Major** | `favorites/components/FavoriteToggle.tsx:13` ↔ `tests/e2e/pokedex/search.spec.ts:26` | 라벨이 `#25 즐겨찾기` → `#0025 즐겨찾기 추가/해제`로 바뀌어 기존 E2E 타임아웃. 새 라벨이 DESIGN §3.4 문구와 맞으므로 테스트 쪽을 갱신 | **해결** — 소유자(김형균) 승인으로 spec 갱신, 추가→해제 상태 전환까지 단언 |
| m-1 | Minor | `FavoriteToggle.tsx:25` | 저장값 손상·저장소 차단 시 도감의 **모든 카드**에 "저장 정보 정리됨/저장 불가" 문구와 live region이 반복. 사용자가 한 번 저장하기 전까지 유지 | 후속 (성윤우) |
| m-2 | Minor | `FavoritesPage.tsx:86-88` | 즐겨찾기 해제 후 포커스가 BODY로 이동 (구현자 D-008-01) | 후속 (성윤우) |
| m-3 | Minor | `favorites/model/store.ts:61-64` | `version: 2` 데이터가 있을 때 저장하면 v1로 덮어써 기존 데이터 손실. ADR-012에 쓰기 정책 없음 | 정책 결정 필요 |
| m-4 | Minor | `battle-tools/model/smogon.ts:357-362` | ADR에 없는 정책 2건: 기본 폼에서 메가스톤 전용 세팅 제외(도구 혼합 세팅 27건은 스톤만 지우고 양쪽에 표시), 변칙 5종 외 모든 포맷 표시 | OQ-19와 함께 결정 |
| m-5 | Minor | `battle-tools/model/smogon.ts:266-333` | 정규화가 엄격해 원본 세팅 한 건만 형식이 어긋나도 전 포켓몬의 실전 세팅이 오류로 표시됨(현재 데이터는 통과) | 위험 기록 |
| T-1 | Trivial | `SmogonSetsSection.tsx:191` | 메가레쿠쟈 문구가 '정보 없음'이 아닌 "등록된 실전 세팅이 없습니다." | 후속 |
| T-2 | Trivial | `useSmogonSets.ts:6` | 오래된 주석 | 후속 |
| T-3 | Trivial | `PokemonDetailPage.tsx` → `SmogonSetsSection.tsx:178` | `identity`를 매 렌더 새 객체로 넘겨 `useMemo` 재계산 | 후속 |
| T-4 | Trivial | `FavoriteToggle.tsx` | `aria-description`(ARIA 1.3 초안) 사용 — 스크린리더 지원 제한 | 후속 |

## 5. 결론
- 기능 요구사항(FR-17~22, DR-04·06·07·08, ADR-009·012)은 코드·테스트·실데이터로 확인했다.
- 1차 FAIL 사유는 M-1(다른 영역 E2E 회귀) 하나였고, 통합 브랜치에서 해결 후 verify·E2E 전체를 다시 실행해 통과했다.
- 재발 방지: CI에 E2E 작업 추가 (PR #5).
- 사람 확인: 기능 오너 성윤우, 영향 담당자 임지섭(상세 호출부)·김형균(pokedex export, shared).
- 문서 갱신 필요: m-3(ADR-012 쓰기 정책), m-4(OQ-19) 결정 후 별도 문서 작업.
