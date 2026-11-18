# QA 보고서 — TASK-017

- 대상 TASK: TASK-017 도감 완성 체크리스트·세대별 완성률 — `/favorites?view=collection`, `src/features/favorites/collection/**`, 즐겨찾기 저장 구조 공용화(`model/savedIdsStore.ts`)
- 요구사항 ID: FR-29, TC-14, NFR-01·03·08, ADR-012(즐겨찾기 저장 스키마 재사용)
- PR/Commit: PR #32 (`5c6d492`, develop 병합 커밋 `95ec43f`, 병합 `162a632`) / develop `bf6c129` 기준 검증
- 구현자 및 도구: 성윤우(yoonwoo2002) / Codex (PR 본문). PR 내 QA 사본은 Claude(Cowork) 작성
- 독립 검증자 및 도구: Claude Code 독립 QA 세션 (구현 세션과 별도)
- 검증 일자: 2026-11-18
- 결과: **PASS**

## 1. 범위 확인
- [x] 허용 경로만 수정: `src/features/favorites/**`(신규 `collection/` 7파일, `model/store.ts` → `savedIdsStore.ts` 공용화, `FavoritesPage.tsx` 보기 전환, `index.ts`), `tests/unit|integration|e2e/favorites/**`. OWNERSHIP §1 "체크리스트는 favorites 또는 `src/features/collection/**`"에 부합
- [x] 타인 소유 영역 변경 없음(pokedex는 공개 API `PokemonCard`·`searchPokemon`·`useSearchIndex`만 사용)
- [~] 새 저장 키 `pokefile:collection`(값 `{"version":1,"ids":[...]}`)이 SRS DR·DECISIONS에 기록되지 않음. 즐겨찾기 키는 DR-07·ADR-012로 확정되어 있음 → §4 명세
- 리뷰 기록: 리뷰 0건. PR 본문의 사람 승인 체크 2개 모두 미체크 상태로 병합(semicolon213)

## 2. 요구사항별 결과
| 요구사항/인수 조건 | 증거 | 결과 |
|---|---|---|
| 체크·해제 | 화면(4175 preview): #0001 체크, `피카츄` 검색 후 체크, 9세대 필터 첫 카드(#0906)를 키보드 Space로 체크 → 저장값 `{"version":1,"ids":[1,25,906]}` | PASS |
| 새로고침 후 유지(TC-14) | 새로고침 후 `3 / 1025마리 · 0.3%`, 1세대 2/151·9세대 1/120 그대로. #0025 해제 후 새로고침 → `2 / 1025마리 · 0.2%`, 저장값 `[1,906]` | PASS |
| 세대별·전체 완성률 정확(TC-14) | 인덱스 1025종에서 종 단위 집계(`progress.ts:4-11`): 1세대 151·2세대 100·3세대 135·4세대 107·5세대 156·6세대 72·7세대 88·8세대 96·9세대 120 = 1025(공식 세대별 수와 일치). 병합 코드로 계산: [1,151,152,252,1025] → 전체 5/1025=0.5%, 1세대 2/151=1.3%, 2세대 1/100=1%, 3세대 1/135=0.7%, 9세대 1/120=0.8%. 1024종 → 99.9%(반올림 100% 방지), 1025종 → 100% | PASS |
| 즐겨찾기와 독립 | 체크해도 `pokefile:favorites` 변화 없음(null 유지) | PASS |
| 손상된 저장값 | `{broken` → "저장된 도감 기록 전체를 읽을 수 없어 … 원본은 보존됩니다" + `기록 초기화`, 체크박스 비활성, 원본 값 보존. `version:2`·유효 번호 없음도 같은 처리. 일부 잘못된 값 `[1,1,0,2000,"x",25]` → `[1,25]`로 표시하고 안내(knowledge partial) | PASS |
| 저장소 차단(NFR-03) | `localStorage` 접근 시 예외 → "브라우저 저장 공간을 사용할 수 없어 포획 기록을 변경할 수 없습니다", `포획 기록 다시 읽기`, 완성률 숨김, 체크박스 48개 비활성, 목록 1025마리는 계속 탐색 가능 | PASS |
| 즐겨찾기 구조 재사용 | 두 기능 모두 `createSavedIdsStore`(키·문구만 다름, `collection/store.ts:5-14`, `model/store.ts:7-14`) + 같은 인코딩 `encodeFavorites`. 다른 탭 변경 반영(storage 이벤트) | PASS |
| 차이점 | 즐겨찾기(ADR-012)는 손상 시 "빈 목록으로 시작", 체크리스트는 원본 보존·명시적 초기화. 구현 의도로 문서화(PR 본문)되었으나 명세 근거 없음 | 비고 |
| 320px·접근성 | 320px 문서 너비 320, 본문 288/288(넘침 없음). 체크박스 이름 `#0001 이상해씨 포획 완료`, 진행 막대 `n세대 도감 완성률` | PASS |
| 진입점 | 즐겨찾기 화면 상단 `즐겨찾기 목록 / 도감 체크리스트` | PASS |

## 3. 실행한 검증
| 명령/절차 | 실행 여부 | 결과 | 로그 |
|---|---|---|---|
| lint (`npm run lint`) | 실행 | PASS — 종료 0 | `qa2/lint.log` |
| typecheck (`npx tsc -b`) | 실행 | PASS — 종료 0 | `qa2/tsc.log` |
| test (`npx vitest run`) | 실행 | PASS — 45파일 342/342 (`collection.test.ts` 22, `CollectionChecklist.test.tsx` 13, `store.test.ts` 10, `storage.test.ts` 9) | `qa2/vitest.log` |
| build (`npm run build`) | 실행 | PASS | `qa2/build.log` |
| E2E (`npx playwright test`, 1회) | 실행 | PASS — 67/67, 재시도 없음(13:18:31~13:19:06). `favorites/collection.spec.ts` 9건 포함. PR 당시 실패하던 320px 공통 셸 검사(`collection.spec.ts:193`)도 현재 통과 | `qa2/e2e.log` |
| 수동: 병합 코드로 세대별 집계·디코드 검사, 브라우저 체크·새로고침·손상·차단·320px | 실행 | §2 | `qa2/probe-collection*.log` |

## 4. 결함
| 심각도 | 재현 절차 | 기대/실제 | 담당 |
|---|---|---|---|
| 하 (명세, D-017-01) | `collection/storage.ts:5` | 저장 키 `pokefile:collection`과 스키마, "손상 시 원본 보존·명시적 초기화" 정책이 SRS DR/ADR에 없음(즐겨찾기는 DR-07·ADR-012). 문서 추가 필요 | 성윤우(문서는 별도 승인) |
| 하 (절차) | PR #32 | 리뷰 0건, 본문 사람 승인 체크 미체크 상태로 병합. QA 사본·작업 기록이 `src/features/favorites/*.md`에 있음 | 성윤우 |
| 하 (문서) | `docs/TASKS.md` | 병합 후에도 TASK-017이 BACKLOG | 성윤우 |

## 5. 결론
- PASS/FAIL/BLOCKED 사유: 체크·해제가 새로고침 후 유지되고, 전체·세대별 완성률이 1025종·9세대 기준으로 정확하며, 손상·차단된 저장소에서도 기록을 덮어쓰지 않고 안내한다. FR-29·TC-14 충족.
- 남은 위험/미검증 항목: Chromium 외 브라우저·실기기·스크린리더, 배포 origin(GitHub Pages)에서의 저장 미확인. 상세·목록 카드에 포획 토글 연결은 없음(명세 요구 아님).
- 수정 요청: 없음.
- 사람 승인자: 성윤우(기능 오너)
- 문서 갱신 별도 TASK: SRS DR(또는 ADR)에 `pokefile:collection` 스키마·손상 처리 추가, TASKS 상태 정정
