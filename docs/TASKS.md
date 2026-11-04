# 작업 백로그

> 담당은 `OWNERSHIP.md`의 확정 배정(ADR-004)을 따른다.
> 상태: BACKLOG / READY / IN_PROGRESS / SELF_TESTED / QA_REVIEW / QA_PASS / HUMAN_APPROVED / MERGED / BLOCKED / DONE (`WORKFLOW.md` §2)

| TASK | 담당 | 범위 | 관련 SRS | 의존성 | 상태 |
|---|---|---|---|---|---|
| TASK-001 | 김형균 | Vite `react-ts`·HashRouter·Query 초기 설정, oxlint·Vitest·Playwright·npm scripts, GitHub Actions CI/CD·Pages 배포, CODEOWNERS | NFR-05 | ADR-005~007 | MERGED |
| TASK-002 | 김형균 | 공통 모델(`PokemonId`·`FormKey`·`Generation`·`PokemonType`·`PokemonSummary`)과 공통 유틸(`toShowdownId`·`formatDexNumber`·`displayName`) (ADR-009) | DR-01~04 | API 스키마 검증(API_SPEC §5) | MERGED |
| TASK-003 | 김형균 | 정적 검색 인덱스 생성 스크립트(`public/data/pokedex-index.json`)·한국어 검색 (ADR-010) | FR-01~03 | TASK-002 | MERGED |
| TASK-004 | 김형균 | 타입·세대 필터, 번호·이름 정렬, 무한 스크롤, URL 쿼리 동기화 (ADR-011) | FR-04~09 | TASK-003, OQ-20(제안값 24 적용) | MERGED |
| TASK-005 | 임지섭 | 상세 기본 정보·차트, 6세대 메가 폼 탭(`?form=`) | FR-10~14 | TASK-002, OQ-17(제안값 x→omega-ruby 적용) | MERGED |
| TASK-006 | 임지섭 | 진화 트리(#722 이후 제외)·출현 장소(6세대 이하 버전만, ADR-008) | FR-15~16,18 | TASK-005, OQ-18(결정 전 임시: 장소명 영문 표기) | SELF_TESTED |
| TASK-007 | 성윤우 | Smogon gen6 실전 세팅·이름 매핑·메가스톤 대응표 (ADR-009) | FR-17~18 | TASK-002, OQ-19 | MERGED |
| TASK-008 | 성윤우 | localStorage 즐겨찾기 (ADR-012) | FR-19~22 | TASK-002 | MERGED |
| TASK-009 | 팀 합의 | 반응형·로딩·오류·캐싱 통합 | NFR-01~04,07~08 | 기능 구현 | BACKLOG |
| TASK-010 | 팀 합의 | 통합 테스트·배포 URL 확인 | NFR-05~06 | TASK-003~009 | BACKLOG |
| TASK-011 | 성윤우 | [난이도 하] 이로치 이미지 전환·울음소리 재생 (상세 이미지 영역에 공개 컴포넌트로 제공) | FR-23 | TASK-013 | READY |
| TASK-012 | 김형균 | 외부 API 계약 검증 테스트 (`scripts/verify-api/`) | DR-01~05 | — | SELF_TESTED |
| TASK-013 | 김형균 | 지원 범위 설정 일원화: 세대·최대 번호·메가 판별·게임 버전·도감 설명 버전·Smogon 세대를 `src/shared/config/scope.json` 한 곳으로 (세대 확장 대비, ADR-015) | DR-01~08 | — | SELF_TESTED |
| TASK-014 | 김형균 | [난이도 중] 내 게임 선택: 게임 버전 선택·저장(URL+localStorage), 출현 장소 필터 연동 | FR-26 | TASK-013 | SELF_TESTED |
| TASK-015 | 임지섭 | [난이도 상] 기술 표: 게임 버전별 레벨업·기술머신 기술, 내 게임 연동 | FR-27 | TASK-014, TASK-023, OQ-23 | BACKLOG |
| TASK-016 | 임지섭 | [난이도 중] 진화 조건 상세(돌·교환·친밀도·시간대·장소) | FR-28 | — | BACKLOG |
| TASK-017 | 성윤우 | [난이도 중] 도감 완성 체크리스트·세대별 완성률 (localStorage, 즐겨찾기 구조 재사용) | FR-29 | TASK-013 | BACKLOG |
| TASK-018 | 임지섭 | [난이도 하] 특성 한국어 설명 | FR-30 | — | BACKLOG |
| TASK-019 | 김형균 | [난이도 중] 지방 도감 번호 표시·지방 도감 순 정렬 (검색 인덱스 확장, ADR-017) | FR-31 | TASK-023 | SELF_TESTED |
| TASK-020 | 김형균 | [난이도 중] 다크 모드: 어두운 테마 토큰·전환·저장, 18종 타입 배지 AA | FR-32 | OQ-24 | BACKLOG |
| TASK-021 | 김형균 | [난이도 중] 타입 상성: 전체 상성표 화면 + 상세의 약점·반감·무효 섹션(공개 컴포넌트로 제공) | FR-24 | TASK-023 | BACKLOG |
| TASK-022 | 김형균 | [난이도 상] 두 포켓몬 능력치 비교: 비교 화면(라우트 추가)·포켓몬 선택·종족값 나란히 비교 | FR-25 | TASK-023 | BACKLOG |
| TASK-023 | 김형균 | [난이도 상] 9세대·모든 폼 공통 기반(ADR-016): `scope.json` 1025종·9세대·게임 버전(확장팩은 본편에 합침), 검색 인덱스 재생성(모든 폼·한국어 폼 이름), 폼 키 일반화, 폼 이름 규칙·번역표(OQ-26), `verify-api` 확장 | DR-01~08, FR-01~16 | TASK-013 | SELF_TESTED |
| TASK-024 | 임지섭 | [난이도 상] 상세 9세대·모든 폼: 폼이 많은 종의 폼 선택 UI, 도감 설명 버전 확장·정보 없음, 출현 장소 확장팩 합침·데이터 없는 게임 안내, 이미지 대체 순서(GIF→PNG→HOME→기본 폼→아이콘) | FR-08~16 | TASK-023, OQ-17, OQ-25 | BACKLOG |
| TASK-025 | 성윤우 | [난이도 중] 실전 세팅 세대 탭(9·8·7·6, 최신 기본), 리전폼·메가·최신 메가 매핑, 메가레쿠쟈 규칙, 변칙 포맷 제외 목록 확장 | FR-17~18 | TASK-023 | BACKLOG |

> 선택 기능 담당·난이도 (2026-11-04 확정, OQ-22): 비중은 김형균 > 임지섭 >>> 성윤우.
> 난이도 점수 하=1·중=2·상=3 기준 — 김형균 11(TASK-014·019·020·021·022), 임지섭 6(TASK-015·016·018), 성윤우 3(TASK-011·017).
> 9세대·모든 폼 확장(ADR-016, 2026-11-04)은 같은 비중으로 TASK-023(김형균 상)·024(임지섭 상)·025(성윤우 중)를 더한다 → 김형균 14, 임지섭 9, 성윤우 5. TASK-023이 끝나야 다른 선택 기능이 새 범위로 진행된다.
> 다른 담당자 화면에 붙는 기능(타입 상성 섹션, 이로치 전환)은 소유 feature의 공개 컴포넌트로 만들고, 상세 화면 연결부는 상세 담당(임지섭)이 확인한다.

### 상태 메모 (2026-11-04)
- TASK-001~004: develop 반영(PR #1, 직접 push). QA는 구현과 같은 Claude가 수행해 교차 QA 미충족.
- TASK-005·006: develop 반영(PR #2). 1차 QA FAIL(E2E 회귀) → 테스트 수정 후 병합, 재검증 기록 없음.
- TASK-007·008: Codex 구현, Claude 독립 QA 1차 FAIL(M-1) → PR #6에서 수정·재검증 PASS. PR #6 병합 시 MERGED.
- 메인(`main`) 배포는 아직 없음. 필수 기능 완료 후 `develop → main` PR로 반영.

## 작업 카드 형식 (복사해 사용)
```yaml
id: TASK-XXX
title: 작업명
owner: 팀원명
implementer_tool: codex-or-claude
status: BACKLOG
requirements: [FR-01]
allowed_paths:
  - src/features/pokedex/**
  - tests/unit/pokedex/**
restricted_paths:
  - src/features/pokemon-detail/**
  - src/features/battle-tools/**
dependencies: []
acceptance:
  - 검증 가능한 완료 조건
verification:
  - npm run lint
  - npm run typecheck
  - npm test
  - npm run build
qa_reviewer: 교차 배정(ADR-014)
human_approver: 기능 오너 (공통 영역은 김형균)
```
`verification`은 **TASK-001에서 npm script(ADR-007)가 실제로 구성된 후** 실행 가능하다.

## 교차 의존성 규칙
- `shared` 수정은 별도 TASK/PR로 분리하는 것을 원칙으로 한다.
- 각 TASK의 `allowed_paths`는 해당 작업의 범위를 명시적으로 승인한 뒤 사용한다.
- 목록과 상세의 ID 전달 계약, 상세와 실전 세팅의 폼 계약을 먼저 합의한다.
- 선택 기능은 필수 기능과 별도로 일정 승인 후 착수한다.
