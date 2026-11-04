# 혼합형 개발·검증 워크플로

## 1. 역할
- **사람(기능 오너)**: 요구사항 해석, 범위 승인, 결과 검토, PR 승인.
- **구현 AI(Codex 또는 Claude)**: 할당 범위 구현, 자체 테스트, 변경 보고.
- **독립 QA(다른 AI 또는 다른 팀원)**: 읽기 전용 코드 검토 및 검증 보고.
- **문서 갱신 담당**: QA PASS 후 별도 승인 작업으로 TASK/ADR/명세 업데이트.
- **최종 병합자(사람)**: 보호 규칙과 QA 상태 확인 후 병합.

## 2. 상태 전이
`BACKLOG → READY → IN_PROGRESS → SELF_TESTED → QA_REVIEW → QA_PASS → HUMAN_APPROVED → MERGED → DONE`
- QA FAIL: `QA_REVIEW → IN_PROGRESS` (수정 후 재검증)
- 요구사항/환경 불명확: `BLOCKED` (사람이 결정 후 READY)
- QA PASS는 테스트 증거가 확인된 경우에만 사용한다.
- 문서 갱신은 QA PASS 후 별도 단계이며 승인된 문서만 수정한다.

## 3. 작업 시작 조건 (Definition of Ready)
- TASK ID, 연결 FR/NFR, owner, 허용/금지 경로, 의존성, 인수 조건 존재
- 공통 계약이 필요하면 선행 ADR/PR 완료
- 같은 파일에 진행 중인 충돌 작업 없음
- 승인된 설계와 명세 확인

## 4. 작업 종료 조건 (Definition of Done)
- 기능·테스트 구현
- 해당 요구사항 인수 기준 충족
- lint/typecheck/test/build 실행 결과 기록 (미구성 시 BLOCKED)
- 소유권 위반 없음
- 독립 QA PASS (또는 팀이 명시적으로 승인한 예외)
- 사람 승인 + main 병합
- TASK/ADR/README 등 필요한 문서 동기화

## 5. Git 전략
```text
feat/TASK-xxx-…  ──PR──▶  develop  ──PR(릴리스)──▶  main  ──▶  GitHub Pages 자동 배포
```
- `develop`: 통합 브랜치. 모든 작업 브랜치는 `develop`에서 따고 `develop`으로 PR을 보낸다.
- `main`: 배포 브랜치. 보호, 직접 push 금지, PR + CI 통과 필수, 필수 승인 리뷰 수 0 (ADR-014). `develop`이 안정되면 `develop → main` PR로 반영한다.
- 공통 영역 PR은 사전 리뷰 없이 병합하고, 병합 후 충돌·영향이 발견되면 이슈로 대응한다(ADR-004).
- `main` 병합 시 GitHub Actions(`.github/workflows/deploy.yml`)가 GitHub Pages로 자동 배포한다(ADR-005). CI(`ci.yml`)는 모든 PR과 `main`·`develop` push에서 실행된다.
- 브랜치 이름: `feat/TASK-003-search-index`처럼 TASK 기반으로 짓는다. 문서만 바꾸면 `docs/…`.
- 작업 시작 전 `git pull origin develop`으로 최신 `develop`을 받는다. 다른 사람의 공통 영역 변경이 병합되면 작업 브랜치에 `develop`을 merge 또는 rebase한다.
- 팀원별 로컬 디렉터리 또는 git worktree 분리
- PR은 가능한 한 하나의 기능/계약 변경만 포함
- 공통 코드와 기능 코드를 함께 수정해야 하면 공통 계약 PR을 먼저 병합

## 6. QA 독립성
- 구현 AI가 Claude라면 Codex 또는 다른 팀원이 QA
- 구현 AI가 Codex라면 Claude 또는 다른 팀원이 QA
- 도구가 달라도 동일한 테스트를 재현해야 한다.
- 독립 QA는 기본 읽기 전용; 보고서 작성은 허용된 별도 경로/작업에서 수행
- QA FAIL 시 제품 코드는 구현 담당자에게 돌려보낸다.
- 사람 확인 교차 배정: 김형균 → 임지섭 → 성윤우 → 김형균 (ADR-014)
- 최종 병합자: 기능 PR은 기능 오너, 공통 영역 PR은 김형균

## 7. 사람 승인 필수 변경
SRS, 공통 데이터 모델, 라우터, 패키지 추가, 외부 API 출처 변경, 담당 영역 재배정, CI 우회, 배포 설정.

## 8. 문서 갱신 규칙
- QA 중 요구사항을 완화하지 않는다.
- QA PASS 후 별도 DOC-TASK를 열어 관련 TASK 상태/ADR/운영 문서를 갱신한다.
- SRS 변경은 팀 합의와 버전 기록을 필요로 한다.
- 문서 변경 PR도 사람 리뷰를 받는다.

## 9. 보고 형식
`TASK ID / 구현 AI / 변경 파일 / 테스트 명령과 결과 / 요구사항 연결 / 제한사항 / QA 결과 / 승인자`
