# PokeFile

> PokéAPI 기반 포켓몬 도감 검색 웹사이트  
> 고급웹프로그래밍 PBL · 팀 **오박사의 비밀**

<!-- 배포 후 링크/스크린샷 추가 -->
<!-- 🔗 배포 주소: https://... -->
<!-- ![PokeFile 메인 화면](docs/images/main.png) -->

## 프로젝트 소개
PokeFile은 **별도 백엔드 서버 없이 브라우저만으로 동작하는 React 포켓몬 도감**입니다.
한국어·영어 이름이나 도감 번호로 포켓몬을 찾고, 타입·세대 조건으로 목록을 탐색하며,
상세 화면에서 종족값·진화·출현 장소·실전 추천 세팅까지 한 번에 확인할 수 있습니다.

공개 API(PokéAPI, data.pkmn.cc)를 브라우저에서 직접 호출하고, 응답을 클라이언트에서 정규화·캐싱합니다.
즐겨찾기는 브라우저 localStorage에 저장하므로 회원가입 없이 바로 사용할 수 있습니다.

### 기획 배경
- PokéAPI는 **부분 문자열 검색과 한국어 이름 검색을 직접 지원하지 않음** → 클라이언트 검색 인덱스를 구성해 해결
- 기본 도감 정보와 **실전(Smogon) 세팅 정보가 서로 다른 사이트에 흩어져 있음** → 하나의 상세 화면으로 통합
- 과제 제약상 자체 서버가 없음 → **CORS가 허용되고 API 키가 필요 없는 데이터 출처**를 선정해 정적 사이트로 구현

## 주요 기능
| 구분 | 기능 | 설명 |
|---|---|---|
| 검색·목록 | 통합 검색 | 한국어 이름 · 영어 이름 · 도감 번호 검색 |
| | 필터·정렬 | 타입별 · 세대별 필터, 목록 정렬 |
| | 카드 목록 | 카드형 목록과 무한 스크롤, 결과 없음 안내 |
| 상세 | 기본 정보 | 일러스트, 분류 · 타입 · 특성, 도감 설명 |
| | 종족값 차트 | HP · 공격 · 방어 · 특공 · 특방 · 스피드 시각화 |
| | 진화 트리 | 진화 전후 관계 및 분기 진화 |
| | 출현 장소 | 세대 · 게임별 출현 장소 |
| | 실전 세팅 | Smogon 기준 성격 · 노력치 · 도구 · 기술 배치 |
| 즐겨찾기 | 저장·조회 | localStorage 기반 추가 · 해제, 새로고침 후에도 유지 |
| 선택 기능 | 부가 기능 | 이로치 이미지 · 울음소리, 타입 상성, 두 포켓몬 능력치 비교 |

## 기술 스택
| 분류 | 기술 |
|---|---|
| Language | TypeScript |
| Framework / Build | React, Vite |
| Routing | React Router |
| Server State / Cache | TanStack Query |
| Chart | Recharts |
| Data | PokéAPI, data.pkmn.cc (Smogon) |
| Storage | localStorage |
| Test | Vitest, Testing Library |
| Lint / CI | oxlint, 모듈 경계 검사 스크립트, GitHub Actions |

## 아키텍처
```text
사용자 (브라우저)
  └─ React UI / React Router
       ├─ 검색·필터·정렬 ── 클라이언트 검색 인덱스
       ├─ 상세 조회 ─────── TanStack Query ─┬─ PokéAPI
       │                                    └─ data.pkmn.cc
       ├─ 종족값 차트 ───── Recharts
       └─ 즐겨찾기 ─────── localStorage

정적 사이트 배포 · 자체 백엔드/DB 없음
```

### 기술적 포인트
- **기능 단위 모듈 구조** — `features/` 아래 기능별로 폴더를 나누고, 다른 기능은 공개 진입점(`index.ts`)으로만 사용합니다. 이 규칙은 lint 단계에서 자동 검사합니다.
- **API 응답 정규화** — 외부 응답을 UI에 그대로 넘기지 않고 adapter에서 내부 모델로 변환합니다. 404 · 네트워크 오류 · 파싱 오류를 구분해 처리합니다.
- **부분 실패 허용** — 상세 화면의 각 섹션(진화, 출현 장소, 실전 세팅 등)이 독립적으로 로딩 · 오류 · 데이터 없음 상태를 가지므로 일부 데이터가 없어도 나머지 정보는 정상 표시됩니다.
- **데이터 출처 간 매핑** — PokéAPI와 Smogon 데이터의 이름 · 폼 표기 차이를 매핑하고, 매핑에 실패하면 다른 포켓몬의 세팅으로 대체하지 않고 부재를 안내합니다.

## 팀원 및 역할
| 팀원 | 역할 | 담당 기능 |
|---|---|---|
| | | |
| | | |
| | | |

## 협업 방식
3명이 기능 단위로 작업 영역을 나누고, AI 코딩 도구(Codex / Claude Code)를 활용하는 **혼합형 개발 프로세스**로 진행합니다.

- **소유권 기반 분업** — 기능 폴더별 담당자를 지정하고 CODEOWNERS로 리뷰를 강제합니다.
- **TASK 단위 작업** — 작업마다 요구사항 ID, 허용 경로, 완료 조건을 명시합니다.
- **독립 QA** — 구현한 AI와 다른 AI 또는 다른 팀원이 읽기 전용으로 검증한 뒤 사람이 병합을 승인합니다.
- **자동 검증** — PR마다 lint → typecheck → test → build를 CI에서 실행합니다.

```text
TASK 할당 → feature 브랜치 구현 → 자동 검사 → 독립 QA → 담당자 리뷰 → main 병합
```

## 시작하기
Node 22 이상 (`.nvmrc`).
```bash
npm install
npm run dev        # 개발 서버
npm run verify     # lint(oxlint + 모듈 경계 검사) → typecheck → test → build
```

## 프로젝트 구조
```text
src/
  app/            공통: Router 조립, QueryClient Provider, Layout
  shared/         공통: api(fetchJson·ApiError), models, ui, utils
  features/
    pokedex/        검색·목록·필터·정렬·무한 스크롤
    pokemon-detail/ 상세·종족값·진화·출현 장소
    battle-tools/   실전 세팅·선택 기능
    favorites/      즐겨찾기
tests/{unit,integration,e2e}/<feature>/
```
각 feature 폴더는 `index.ts`(public API), `routes.tsx`, `pages/ components/ hooks/ api/ model/`로 구성합니다.

- **라우트는 각 feature의 `routes.tsx`에서 관리**합니다. `src/app/router/routes.tsx`는 feature 추가/삭제 때만 수정합니다.
- **Query Key는 각 feature의 `api/queryKeys.ts`에서 관리**합니다.
- **다른 feature는 `@/features/<name>`(index.ts)로만 import**합니다. 내부 경로 import, `shared → features/app`, `features → app` import는 `npm run lint`에서 실패합니다 (`scripts/check-boundaries.mjs`).
- 담당자가 바뀌어도 코드는 수정하지 않고 `docs/OWNERSHIP.md`와 `.github/CODEOWNERS`만 갱신합니다.

---

## 팀 내부용: 개발 하네스

> 상태: **초안 / 팀 승인 전**. 기반: PBL 1주차 보고서 및 SRS v1.0.  
> 원칙: **사람이 범위·설계·병합을 승인하고, Codex 또는 Claude가 담당 기능을 구현하며, 독립 QA와 자동 검증을 거친다.**

### 빠른 시작
1. `docs/OPEN_QUESTIONS.md`의 미결정 사항을 팀에서 확정한다.
2. `docs/OWNERSHIP.md`의 **임시 담당 배정**을 실제 합의로 교체한다.
3. `docs/DESIGN.md`의 공통 인터페이스를 승인한다.
4. GitHub 저장소에 팀원 계정과 브랜치 보호/리뷰 설정을 적용한다.
5. `docs/TASKS.md`에서 작업을 할당하고 각자 feature 브랜치에서 진행한다.
6. Codex는 `AGENTS.md`, Claude Code는 `CLAUDE.md`를 진입점으로 사용한다.
7. PR 생성 → 자동 검사 → 독립 QA → 담당자 리뷰 → 병합 순서로 진행한다.

### 문서 읽기 순서
`docs/SRS.md` → `docs/DESIGN.md` → `docs/OWNERSHIP.md` → `docs/TASKS.md` → `docs/TEST_PLAN.md` → `docs/API_SPEC.md`

### 문서 인덱스
- `docs/SRS.md`: 요구사항의 기준 문서 (기존 SRS 초안)
- `docs/DESIGN.md`: 구조, 모듈 경계, 인터페이스
- `docs/OWNERSHIP.md`: 담당자와 변경 승인
- `docs/TASKS.md`: 작업 백로그와 완료 조건
- `docs/TEST_PLAN.md`: 테스트 전략 및 수용 기준
- `docs/API_SPEC.md`: 외부 데이터 계약/검증 항목
- `docs/WORKFLOW.md`: 작업·PR·QA·승인 흐름
- `docs/DECISIONS.md`: 설계 결정 기록
- `docs/OPEN_QUESTIONS.md`: 팀 확인이 필요한 사항
- `docs/qa/QA_TEMPLATE.md`: 독립 QA 보고서 양식
- `AGENTS.md`, `CLAUDE.md`: AI 도구별 진입점
- `.github/CODEOWNERS`: GitHub 리뷰어 예시 (계정 치환 필요)
- `.github/pull_request_template.md`: PR 양식
- `.github/workflows/ci.yml`: CI (lint/typecheck/test/build)
- `scripts/verify.sh`: 공통 검증 스크립트

### 미확정 사항
`CODEOWNERS`의 GitHub 사용자명, 배포 플랫폼, 작업 담당은 확정되지 않았다.
테스트 도구는 `scripts/verify.sh` 실행을 위해 Vitest + Testing Library를 **임시 채택**했으며 OQ-11에서 확정한다. E2E 도구는 미도입.
