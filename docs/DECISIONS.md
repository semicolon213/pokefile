# 아키텍처 결정 기록 (ADR)

## ADR-001: 서버 없는 정적 React 앱
- 상태: **1주차 보고서에서 확정**
- 결정: React + Vite로 빌드하고 자체 백엔드 없이 브라우저에서 외부 공개 API 호출
- 이유: 과제 제약, API 키 및 CORS 문제를 회피할 수 있는 데이터 출처 선택
- 결과: API 가용성/데이터 누락을 프론트에서 처리해야 함

## ADR-002: 데이터 및 저장소
- 상태: **1주차 보고서에서 확정**
- 결정: PokéAPI + data.pkmn.cc, localStorage 즐겨찾기
- 결과: 한국어 이름 인덱스, 폼 매핑, 출현 데이터 누락 처리 필요

## ADR-003: UI 라이브러리와 캐시
- 상태: **1주차 보고서에서 확정**
- 결정: React Router, TanStack Query, Recharts

## ADR-004: 기능별 소유권 + 혼합형 AI 워크플로
- 상태: **승인** (OQ-01, OQ-02)
- 결정: 사람 3명이 기능을 소유하고 Codex/Claude 구현을 위임, 독립 QA 후 사람이 병합 승인
- 기능 분담: `OWNERSHIP.md` §1 배정을 확정한다.
- 공통 영역(`src/shared/**`, `src/app/**`, 설정, `.github/**`, `scripts/**`) 관리자: **김형균**
- 공통 영역 리뷰: 사전 리뷰 없이 병합하고, **병합 후 충돌·영향이 발견되면 이슈로 대응**한다.
- 근거: 동시 작업 충돌 및 AI의 작업 범위 이탈 위험 감소, 3인 소규모 팀의 리뷰 대기 시간 최소화
- 관련: `OWNERSHIP.md`, `WORKFLOW.md`
- 승인자/일자: 팀 결정(semicolon213 전달) / 2026-10-28

## ADR-005: 배포 플랫폼
- 상태: **승인** (OQ-04)
- 결정: **GitHub Pages + GitHub Actions CI/CD**
  - PR: lint · typecheck · test · build 실행
  - `main` 반영 시: 빌드 후 GitHub Pages 배포(`actions/deploy-pages`)
  - 라우터: **`HashRouter`** (`/#/pokemon/25` 형태)
  - fallback: 빌드 시 `index.html`을 `404.html`로 복사 (HashRouter 미적용 경로 대비 보조 수단)
  - Vite `base`: 저장소 경로(`/pokefile/`) — 저장소 이름 변경 시 함께 수정
- 이유: 무료·저장소 일체형 배포, 서버 rewrite 설정이 불가능한 Pages에서 새로고침 404 방지
- 승인자/일자: 팀 결정(semicolon213 전달) / 2026-10-28

## ADR-006: TypeScript 사용
- 상태: **승인** (DESIGN §7.1 모델 전제)
- 결정: Vite **`react-ts`** 템플릿으로 시작한다. `npm run typecheck`를 검증 단계에 포함한다.
- 승인자/일자: 팀 결정(semicolon213 전달) / 2026-10-28

## ADR-007: 테스트 프레임워크와 npm scripts
- 상태: **승인** (OQ-11)
- 결정: **Vitest + React Testing Library(jsdom) + Playwright**, 린트는 **oxlint + 모듈 경계 검사**(`scripts/check-boundaries.mjs`)
  - 2026-10-28 개정: 처음에 ESLint로 기록했으나, 저장소에 이미 구성된 oxlint를 그대로 쓴다.
- npm scripts (TASK-001에서 구성 완료):

| script | 명령 | 용도 |
|---|---|---|
| `dev` | `vite` | 개발 서버 (`http://localhost:5173/pokefile/`) |
| `build` | `tsc -b && vite build` | 정적 빌드 |
| `preview` | `vite preview` | 빌드 결과 확인 |
| `lint` | `oxlint && node scripts/check-boundaries.mjs` | 린트 + feature 간 import 경계 검사 |
| `typecheck` | `tsc -b` | 타입 검사 (tsconfig가 `noEmit`) |
| `test` | `vitest run` | Unit/Integration 1회 실행 |
| `test:watch` | `vitest` | 개발 중 감시 모드 |
| `test:e2e` | `playwright test` | E2E (빌드 후 `vite preview`로 `/pokefile/`에서 실행) |
| `verify` | `bash scripts/verify.sh` | lint · typecheck · test · build 일괄 실행 (CI와 동일) |
| `verify:api` | `node --test scripts/verify-api/verify-api.test.mjs` | 외부 API 계약 검증(네트워크 필요, CI 미포함) |
| `build:index` | `node scripts/build-pokedex-index.mjs` | 정적 검색 인덱스 생성(ADR-010) — **TASK-003에서 추가** |

- 승인자/일자: 팀 결정(semicolon213 전달) / 2026-10-28

## ADR-008: 지원 범위 — 6세대까지, 6세대 메가진화 포함
- 상태: **승인** (OQ-05, OQ-09) — 2026-10-28 개정: 5세대 → 6세대 확장, 메가진화 포함
- 결정:
  - 지원 포켓몬: 전국도감 **#1~#721** (1~6세대)의 기본 폼
  - **메가진화: 6세대(X·Y, 오메가루비·알파사파이어)에 도입된 48종만 포함.** 판별 기준은 `pokemon-form.is_mega === true` 이고 `version_group`이 `x-y` 또는 `omega-ruby-alpha-sapphire`인 것이다. PokéAPI에 있는 이후 세대 메가(`mega-dimension` 그룹 49종)는 제외한다.
  - **리전폼 제외.** 원시회귀(가이오가·그란돈)는 메가진화가 아니므로 제외하고, 다른 대체 폼과 함께 OQ-15에서 다룬다.
  - 출현 장소: 6세대 이하 게임 버전만 표시 — `red, blue, yellow, gold, silver, crystal, ruby, sapphire, emerald, firered, leafgreen, diamond, pearl, platinum, heartgold, soulsilver, black, white, black-2, white-2, x, y, omega-ruby, alpha-sapphire`
  - 진화 트리: #722 이후 진화형(실측 17종, 예: 킹갬브릿 #983)은 표시하지 않는다.
  - 타입: 6세대 기준이므로 **PokéAPI 현재 타입을 그대로 사용**한다. 실측 결과 `past_types` 변경은 모두 5세대 이전이고 6세대 이후에 바뀐 타입은 없다.
- 남은 사항: 데오키시스·로토무·킬가르도 등 **대체 폼**과 원시회귀 → OQ-15, 도감 설명 버전 → OQ-17
- 승인자/일자: 팀 결정(semicolon213 전달) / 2026-10-28

## ADR-009: 내부 식별자와 공통 모델
- 상태: **승인** (OQ-05, DESIGN §7.1) — 2026-10-28 개정: 메가 폼 키 추가
- 결정:
  - `PokemonId` = **전국도감 번호(1~721)** = PokéAPI species id = 기본 폼 pokemon id
  - `FormKey` = `'default' | 'mega' | 'mega-x' | 'mega-y'`. 메가는 독립 포켓몬이 아니라 **기본 포켓몬의 폼**으로 다룬다.
  - 상세 데이터: 기본 폼은 `/pokemon/{id}`, 메가는 `/pokemon/{species-name}-{formKey}`(예: `charizard-mega-x`)로 조회하고, 종 정보는 `/pokemon-species/{id}`로 조회한다.
  - 메가 한국어 이름: `pokemon-form/{name}`의 `form_names[ko]` (예: `메가이상해꽃`). 48종 모두 있음.
  - data.pkmn.cc 매핑(`toId` = 소문자 영숫자만 남김):
    - 기본 폼: `toId(species.name) === toId(세팅 키)` (예: `mr-mime` ↔ `Mr. Mime`)
    - 메가: ① 기본 종 세팅 중 `item`이 해당 **메가스톤**인 세팅(예: 리자몽 세팅 중 `Charizardite X`) **+** ② `toId(pokemon.name) === toId(세팅 키)`인 세팅(예: `Venusaur-Mega`). 메가스톤 ↔ 메가 폼 대응표는 `shared/utils`에서 관리한다. 실제 메가 세팅은 대부분 ①에 있다.
    - 변칙 룰 포맷(`balancedhackmons`, `purehackmons`, `almostanyability`, `stabmons`, `cap`)은 실제 게임과 다른 조합이므로 **표시하지 않는다.** 메가 키 세팅 중 20종은 이런 포맷에만 있다.
    - **메가레쿠쟈**는 메가스톤이 없어 위 규칙으로 세팅을 찾을 수 없으므로 실전 세팅을 **'정보 없음'**으로 표시한다. 레쿠쟈 기본 폼 세팅으로 대신 채우지 않는다(OQ-21).
  - 매핑 실패 시 `empty`를 반환하고 다른 포켓몬·폼 세팅으로 대체하지 않는다.
  - 공통 모델은 DESIGN §7.1 `PokemonId`, `PokemonSummary`, `Loadable<T>`에 `FormKey`를 더해 확정한다.
- 근거: `scripts/verify-api` 실측. 기본 폼 이름이 species와 다른 19종(`deoxys-normal`, `aegislash-shield` 등)이 있어 species 이름 기준 매핑이 안전하다. gen6 세팅에서 메가 세팅의 절반은 `X-Mega` 키, 나머지는 기본 종 아래에 메가스톤 아이템으로 저장되어 있다.
- 승인자/일자: 팀 결정(semicolon213 전달) / 2026-10-28

## ADR-010: 한국어 검색 인덱스 — 정적 JSON
- 상태: **승인** (OQ-07)
- 결정: `scripts/build-pokedex-index.mjs`가 PokéAPI에서 #1~#721 정보를 수집해 `public/data/pokedex-index.json`을 생성하고, 생성 결과를 **저장소에 커밋**한다. 앱은 이 파일 하나로 검색·필터·정렬을 처리한다.
- 항목(제안): `id`, `nameEn`, `nameKo`, `types`, `generation`, `megaForms`(해당 종의 6세대 메가 `FormKey` 목록, 상세 탭 표시용)
- 메가는 목록·검색 결과에 **별도 카드로 넣지 않는다**(ADR-011).
- 근거: 실측상 721종 모두 한국어 이름 보유. 런타임에 species를 721번 요청하지 않아도 된다.
- 갱신: 데이터 변경이 필요할 때 수동으로 `npm run build:index` 실행 후 커밋(CI에서 매번 생성하지 않음)
- 승인자/일자: 팀 결정(semicolon213 전달) / 2026-10-28

## ADR-011: 목록 탐색 UX
- 상태: **승인** (OQ-06, OQ-14)
- 결정:
  - 라우트: `/`, `/pokemon/:id`, `/favorites` (HashRouter이므로 실제 URL은 `/#/...`)
  - 메가진화: 목록에는 기본 포켓몬 카드만 표시한다. 상세 화면에서 `[기본] [메가X] [메가Y]` 탭으로 전환하고 URL은 `/#/pokemon/6?form=mega-x` 형태다. `form`이 없거나 잘못된 값이면 기본 폼을 보여준다.
  - 검색: **검색 버튼(또는 Enter) 제출 시 조회**. 입력 중에는 조회하지 않는다.
  - 정렬: **도감 번호순(기본), 이름순** 2종
  - 필터 조합: 검색어 AND 타입 AND 세대
  - 추가 로딩: **무한 스크롤** — 목록 끝 도달 시 자동 추가(버튼 없음). 실패 시 재시도 안내.
  - **URL 쿼리 동기화**: `/#/?q=피카츄&type=electric&gen=1&sort=name`. 검색어는 제출 시점에 반영한다. 뒤로 가기·새로고침·링크 공유 시 상태가 복원된다.
- 승인자/일자: 팀 결정(semicolon213 전달) / 2026-10-28

## ADR-012: 즐겨찾기 저장 스키마
- 상태: **승인** (DR-07)
- 결정:
  - 키: `pokefile:favorites`
  - 값: `{"version":1,"ids":[25,133]}` (`PokemonId` 배열, 추가 순서 유지, 중복 불가)
  - 즐겨찾기는 종 단위다(메가 폼은 따로 저장하지 않음). 읽을 때 1~721 정수가 아닌 값은 버린다. JSON 파싱 실패·버전 불일치 시 빈 목록으로 시작하고 안내한다.
  - localStorage 접근 불가 시 저장 기능만 비활성화한다(DESIGN §10).
- 승인자/일자: 팀 결정(semicolon213 전달) / 2026-10-28

## ADR-013: 포켓몬 이미지 — PokéAPI showdown 애니메이션 GIF
- 상태: **승인** — 2026-10-28 개정: 6세대 확장에 따라 BW GIF에서 showdown GIF로 변경
- 결정: `sprites.other.showdown.front_default` GIF를 기본 이미지로 **전 범위에 통일**해 사용한다. 이로치(FR-23)는 `sprites.other.showdown.front_shiny`를 사용한다. 메가 폼은 해당 메가 pokemon(`/pokemon/charizard-mega-x`)의 같은 필드를 사용한다.
- 대체 순서: GIF 실패 → `sprites.front_default`(PNG) → 공통 대체 아이콘
- 근거: 실측 결과 BW GIF는 #650~#721 중 18종, 6세대 메가 48종 중 24종에 없다. showdown GIF는 721종과 메가 48종 모두에 있고(이로치 포함), `image/gif` 200 응답을 확인했다.
- 주의: 이미지 원본은 GitHub raw(`raw.githubusercontent.com/PokeAPI/sprites`)에서 제공된다. 저작권 고지 여부는 DESIGN §11에 따라 검토한다.
- 승인자/일자: 팀 결정(semicolon213 전달) / 2026-10-28

## ADR-014: 저장소 보호·QA·병합 권한
- 상태: **승인** (OQ-03, OQ-12)
- 결정:
  - `main` 보호: 직접 push 금지, PR 필수, CI(lint·typecheck·test·build) 통과 필수, force push·삭제 금지
  - 필수 승인 리뷰 수: **0** (ADR-004의 병합 후 대응 방식과 일치). 리뷰 요청은 CODEOWNERS로 자동 발송한다.
  - CODEOWNERS: `OWNERSHIP.md` §1·§2 경로 기준으로 작성한다. 공통 영역은 `@semicolon213`, pokedex는 `@semicolon213`, pokemon-detail은 `@MianShang`, battle-tools·favorites는 `@yoonwoo2002`가 소유자다.
  - QA 교차 배정: 구현 AI와 다른 AI가 QA 보고서를 작성하고, 다음 팀원이 확인한다 — 김형균 → 임지섭 → 성윤우 → 김형균
  - 최종 병합: 기능 PR은 해당 **기능 오너**, 공통 영역 PR은 **김형균**
- 승인자/일자: 팀 결정(semicolon213 전달) / 2026-10-28

## ADR 작성 양식
```md
## ADR-XXX: 제목
- 상태: 제안/승인/대체
- 배경:
- 선택지:
- 결정:
- 이유:
- 영향받는 파일/담당:
- 승인자/일자:
```
