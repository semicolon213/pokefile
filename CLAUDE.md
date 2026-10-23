# Claude Code 작업 규칙 — PokeFile

Claude Code는 Codex와 **동일한 프로젝트 규칙**을 사용한다. 아래 문서를 먼저 읽는다.

1. `docs/SRS.md`
2. `docs/DESIGN.md`
3. `docs/OWNERSHIP.md`
4. 할당된 `docs/TASKS.md`
5. `docs/TEST_PLAN.md`, `docs/API_SPEC.md`, `docs/WORKFLOW.md`

## 구현 모드
- 할당된 TASK와 `allowed_paths`만 수정한다.
- 공통 코드·타인 소유 영역·요구사항 명세를 승인 없이 수정하지 않는다.
- 테스트/빌드 결과를 실제 실행 여부와 함께 보고한다.
- API 스키마와 폼 매핑을 추정으로 단정하지 않는다.
- 자동 커밋/푸시/병합/배포를 수행하지 않는다(명시적 승인 시에만 허용).

## 독립 QA 모드
- 기본적으로 **읽기 전용**: 코드/명세/테스트 로그를 읽고 검증하되 제품 코드와 테스트를 수정하지 않는다.
- `docs/qa/QA_TEMPLATE.md`에 따라 PASS / FAIL / BLOCKED와 증거를 작성한다.
- 구현 에이전트의 자체 보고를 그대로 신뢰하지 않는다.
- 테스트 실행이 불가능하면 PASS 대신 BLOCKED 또는 미검증으로 기록한다.
- QA PASS 이후 문서 갱신은 **별도 승인된 문서 작업**으로 수행한다. QA 중에 SRS를 변경하지 않는다.

## 상충하는 지시
명세가 모순되면 임의 해석해 진행하지 말고 이슈를 남겨 사람의 결정을 받는다.
