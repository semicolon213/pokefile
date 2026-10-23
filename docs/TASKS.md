# 작업 백로그 (초안)

> 담당은 `OWNERSHIP.md`의 **임시 배정**에 따른 제안이다. 실제 개발 전 팀 합의가 필요하다.
> 상태: BACKLOG / READY / IN_PROGRESS / SELF_TESTED / QA_REVIEW / QA_PASS / BLOCKED / DONE

| TASK | 담당(제안) | 범위 | 관련 SRS | 의존성 | 상태 |
|---|---|---|---|---|---|
| TASK-001 | 김형균 | Vite/React/라우터/Query 초기 설정 | NFR-05 | 배포·구조 합의 | BACKLOG |
| TASK-002 | 김형균 | 공통 모델/API 계약 | DR-01~04 | API 스키마 검증 | BACKLOG |
| TASK-003 | 김형균 | 검색 인덱스·한국어 검색 | FR-01~03 | TASK-002 | BACKLOG |
| TASK-004 | 김형균 | 타입·세대 필터/정렬/무한 스크롤 | FR-04~09 | TASK-003 | BACKLOG |
| TASK-005 | 임지섭 | 상세 기본 정보·차트 | FR-10~14 | TASK-002 | BACKLOG |
| TASK-006 | 임지섭 | 진화 트리·출현 장소 | FR-15~16,18 | TASK-005 | BACKLOG |
| TASK-007 | 성윤우 | Smogon 실전 세팅/폼 매핑 | FR-17~18 | TASK-002, API 검증 | BACKLOG |
| TASK-008 | 성윤우 | localStorage 즐겨찾기 | FR-19~22 | TASK-002 | BACKLOG |
| TASK-009 | 팀 합의 | 반응형·로딩·오류·캐싱 통합 | NFR-01~04,07~08 | 기능 구현 | BACKLOG |
| TASK-010 | 팀 합의 | 통합 테스트·정적 배포 | NFR-05~06 | TASK-003~009 | BACKLOG |
| TASK-011 | 성윤우(제안) | 이로치/울음소리·상성·비교 | FR-23~25 | 필수 기능 완료 | BACKLOG |

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
qa_reviewer: 미정
human_approver: 미정
```
`verification`은 **프로젝트에 해당 npm script가 실제로 구성된 후** 실행 가능하다.

## 교차 의존성 규칙
- `shared` 수정은 별도 TASK/PR로 분리하는 것을 원칙으로 한다.
- 각 TASK의 `allowed_paths`는 해당 작업의 범위를 명시적으로 승인한 뒤 사용한다.
- 목록과 상세의 ID 전달 계약, 상세와 실전 세팅의 폼 계약을 먼저 합의한다.
- 선택 기능은 필수 기능과 별도로 일정 승인 후 착수한다.
