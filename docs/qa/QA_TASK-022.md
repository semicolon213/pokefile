# QA 보고서 — TASK-022

- 대상 TASK: TASK-022 두 포켓몬 능력치 비교 `/compare` + 상세 `비교하기` 링크
- 요구사항 ID: FR-25, DESIGN §2.4.2, TC-11
- PR/Commit: PR #25 (`0900cd9`, 병합 `7c469bc`) / develop `7c469bc`
- 구현자 및 도구: Claude Code (semicolon213 지시)
- 독립 검증자 및 도구: Claude Code 독립 QA 세션 (구현 세션과 별도)
- 검증 일자: 2026-11-04
- 결과: **PASS**

## 1. 범위 확인
- [x] 허용 경로: 새 feature `src/features/compare/**`(김형균), `src/app/**`(라우트·메뉴·768~1279px 상단 바 2줄 배치), `src/shared/{ui,utils}`(`SwapIcon`, `comparePath`), `src/features/pokedex/**`(`searchPokemon` export·검색창 폭)
- [~] 타인 소유 영역: `pokemon-detail/pages/PokemonDetailPage.tsx`(+8 −2, 머리글 링크)·`.css`(+24). PR에 확인 요청 명시, **리뷰 0건**
- [x] 라우트 `/compare`는 SRS §6·ADR-011 목록에 없음(DESIGN만) → 문서 비고

## 2. 요구사항별 결과
| 요구사항/인수 조건 | 증거 | 결과 |
|---|---|---|
| 리자몽 534 vs 거북왕 530(리자몽 +4) | 실화면 `#/compare?a=6&b=9`: 합계 534 / 530 `리자몽 +4`. 행별 HP 78/79 거북왕 +1, 공격 84/83, 방어 78/100, 특공 109/85, 특방 85/105, 스피드 100/78 — 공식 종족값과 일치 | PASS |
| 메가리자몽X 공격 130(+47) | `?a=6&af=mega-x&b=9`: 공격 130/83 `메가리자몽X +47`, 합계 634/530 `+104` | PASS |
| A↔B 바꾸기·URL 순서 a·af·b·bf | 바꾸기 후 `?a=9&b=6&bf=mega-x`, 합계 530/634 | PASS |
| 잘못된 폼 값은 기본 폼, 조회 안 함 | `?a=6&af=bogus&b=6` → 기본 리자몽끼리 `같음`, `/pokemon/charizard-bogus` 요청 0건 | PASS |
| 범위 밖 id 무시 | `?a=0&b=1026` → "비교할 포켓몬 두 마리를 고르세요." | PASS |
| 폼 선택(폼 전체 이름) | `?a=128&af=paldea-blaze-breed&b=892&bf=rapid-strike-gmax` → 범례 `켄타로스 (팔데아의 모습·블레이즈종)` / `우라오스 (거다이맥스·연격의 태세)`, 합계 490/550 | PASS |
| 상세 `비교하기`가 지금 폼을 A로 | `#/pokemon/6?form=mega-x` → `#/compare?a=6&af=mega-x`; E2E에서 기본 폼 | PASS |
| 검색 콤보박스(한·영·번호, 후보 8, ↑↓·Enter·Esc) | `PokemonPicker.tsx:95-118`; 키보드 `피카`+↓+Enter → `?b=25`, `25` → `#0025 피카츄` | PASS |
| 높은 값 굵게(색으로 승패 표시 안 함), 767px 이하 차이 열 숨김 | `data-win` 속성, 390px에서 차이 열 비표시·페이지 넘침 0 | PASS |
| 비교 색 토큰·다크 AA | `Compare.css:5-19`, QA_TASK-020 대비 스캔에 비교 화면 포함 미달 0 | PASS |

## 3. 실행한 검증
| 명령/절차 | 실행 여부 | 결과 | 로그 |
|---|---|---|---|
| lint | 실행 | PASS | `lint.log` |
| typecheck | 실행 | PASS | `tsc.log` |
| test | 실행 | PASS — 245/245 (compare 단위 3, 통합 3) | `vitest.log` |
| build | 실행 | PASS | `build.log` |
| E2E | 실행 | PASS — 41/41 (`compare.spec.ts` 2건) | `e2e.log` |
| 수동: Playwright `probe4.mjs`(실 PokéAPI) | 실행 | §2 결과 | 스크래치 `qa/` |

## 4. 결함
| 심각도 | 재현 절차 | 기대/실제 | 담당 |
|---|---|---|---|
| 하 (D-022-01, 코드 검토·미재현) | GIF가 없는 기본 폼(예: #1017 오거폰)을 고른 뒤 폼 select로 다른 폼 변경 | `Selected`의 `imageIndex`(`PokemonPicker.tsx:48`)가 폼이 바뀌어도 초기화되지 않아 새 폼에 GIF가 있어도 PNG(또는 그다음 후보)로 시작할 수 있음 | 김형균 |
| 하 (D-022-02) | `?a=1007&af=sprinting-build` | 이미지가 전혀 없는 폼(코라이돈·미라이돈 변신 8개)은 원판이 빈 채로 표시. ADR-016은 "기본 모습 이미지"로 대체(상세는 TASK-024) | 김형균 |
| 하 (명세) | SRS §6·ADR-011 | `/compare` 라우트 미기재 | 문서 작업 |

## 5. 결론
- PASS/FAIL/BLOCKED 사유: TC-11의 수치(534/530 +4, 공격 130 +47)와 폼·바꾸기·URL·잘못된 폼 처리 조건을 실데이터로 확인했다. 합계·차이 계산(`compare.ts:51-58`, `CompareTable.tsx:52-74`)이 정확하다.
- 남은 위험/미검증 항목: 자동 테스트의 수치 검증은 fixture 기반(통합)과 E2E 합계 문자열 포함 여부 수준이며, 행별 차이 문구는 QA 프로브로만 확인.
- 수정 요청: 없음(하 결함 선택).
- 사람 승인자: 김형균(기능 오너), 상세 머리글 링크 임지섭
- 문서 갱신 별도 TASK: SRS §6·ADR-011 라우트 목록에 `/compare` 추가
