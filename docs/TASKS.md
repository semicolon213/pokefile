# 작업 백로그

> 담당은 `OWNERSHIP.md`의 확정 배정(ADR-004)을 따른다.
> 상태: BACKLOG / READY / IN_PROGRESS / SELF_TESTED / QA_REVIEW / QA_PASS / HUMAN_APPROVED / MERGED / BLOCKED / DONE (`WORKFLOW.md` §2)

| TASK | 담당 | 범위 | 관련 SRS | 의존성 | 상태 |
|---|---|---|---|---|---|
| TASK-001 | 김형균 | Vite `react-ts`·HashRouter·Query 초기 설정, oxlint·Vitest·Playwright·npm scripts, GitHub Actions CI/CD·Pages 배포, CODEOWNERS | NFR-05 | ADR-005~007 | SELF_TESTED |
| TASK-002 | 김형균 | 공통 모델(`PokemonId`·`FormKey`·`Generation`·`PokemonType`·`PokemonSummary`)과 공통 유틸(`toShowdownId`·`formatDexNumber`·`displayName`) (ADR-009) | DR-01~04 | API 스키마 검증(API_SPEC §5) | SELF_TESTED |
| TASK-003 | 김형균 | 정적 검색 인덱스 생성 스크립트(`public/data/pokedex-index.json`)·한국어 검색 (ADR-010) | FR-01~03 | TASK-002 | SELF_TESTED |
| TASK-004 | 김형균 | 타입·세대 필터, 번호·이름 정렬, 무한 스크롤, URL 쿼리 동기화 (ADR-011) | FR-04~09 | TASK-003, OQ-20(제안값 24 적용) | SELF_TESTED |
| TASK-005 | 임지섭 | 상세 기본 정보·차트, 6세대 메가 폼 탭(`?form=`) | FR-10~14 | TASK-002, OQ-17 | BACKLOG |
| TASK-006 | 임지섭 | 진화 트리(#722 이후 제외)·출현 장소(6세대 이하 버전만, ADR-008) | FR-15~16,18 | TASK-005, OQ-18 | BACKLOG |
| TASK-007 | 성윤우 | Smogon gen6 실전 세팅·이름 매핑·메가스톤 대응표 (ADR-009) | FR-17~18 | TASK-002, OQ-19 | BACKLOG |
| TASK-008 | 성윤우 | localStorage 즐겨찾기 (ADR-012) | FR-19~22 | TASK-002 | BACKLOG |
| TASK-009 | 팀 합의 | 반응형·로딩·오류·캐싱 통합 | NFR-01~04,07~08 | 기능 구현 | BACKLOG |
| TASK-010 | 팀 합의 | 통합 테스트·배포 URL 확인 | NFR-05~06 | TASK-003~009 | BACKLOG |
| TASK-011 | 성윤우 | 이로치/울음소리·상성·비교 | FR-23~25 | 필수 기능 완료, OQ-10 | BACKLOG |
| TASK-012 | 김형균 | 외부 API 계약 검증 테스트 (`scripts/verify-api/`) | DR-01~05 | — | SELF_TESTED |

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
