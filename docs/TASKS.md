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
| TASK-011 | 성윤우 | [난이도 하] 이로치 이미지 전환·울음소리 재생 (상세 이미지 영역에 공개 컴포넌트로 제공) | FR-23 | TASK-013 | MERGED |
| TASK-012 | 김형균 | 외부 API 계약 검증 테스트 (`scripts/verify-api/`) | DR-01~05 | — | MERGED |
| TASK-013 | 김형균 | 지원 범위 설정 일원화: 세대·최대 번호·메가 판별·게임 버전·도감 설명 버전·Smogon 세대를 `src/shared/config/scope.json` 한 곳으로 (세대 확장 대비, ADR-015) | DR-01~08 | — | MERGED |
| TASK-014 | 김형균 | [난이도 중] 내 게임 선택: 게임 버전 선택·저장(URL+localStorage), 출현 장소 필터 연동 | FR-26 | TASK-013 | MERGED |
| TASK-015 | 임지섭 | [난이도 상] 기술 표: 게임 버전별 레벨업·기술머신 기술, 내 게임 연동 | FR-27 | TASK-014, TASK-023, OQ-23 | SELF_TESTED |
| TASK-016 | 임지섭 | [난이도 중] 진화 조건 상세(돌·교환·친밀도·시간대·장소) | FR-28 | — | MERGED |
| TASK-017 | 성윤우 | [난이도 중] 도감 완성 체크리스트·세대별 완성률 (localStorage, 즐겨찾기 구조 재사용) | FR-29 | TASK-013 | MERGED |
| TASK-018 | 임지섭 | [난이도 하] 특성 한국어 설명 | FR-30 | — | MERGED |
| TASK-019 | 김형균 | [난이도 중] 지방 도감 번호 표시·지방 도감 순 정렬 (검색 인덱스 확장, ADR-017) | FR-31 | TASK-023 | MERGED |
| TASK-020 | 김형균 | [난이도 중] 다크 모드: 어두운 테마 토큰·전환·저장, 18종 타입 배지 AA (ADR-018) | FR-32 | OQ-24 | MERGED |
| TASK-021 | 김형균 | [난이도 중] 타입 상성: 전체 상성표 화면 + 상세의 약점·반감·무효 섹션(공개 컴포넌트로 제공) | FR-24 | TASK-023 | MERGED |
| TASK-022 | 김형균 | [난이도 상] 두 포켓몬 능력치 비교: 비교 화면(라우트 추가)·포켓몬 선택·종족값 나란히 비교 | FR-25 | TASK-023 | MERGED |
| TASK-023 | 김형균 | [난이도 상] 9세대·모든 폼 공통 기반(ADR-016): `scope.json` 1025종·9세대·게임 버전(확장팩은 본편에 합침), 검색 인덱스 재생성(모든 폼·한국어 폼 이름), 폼 키 일반화, 폼 이름 규칙·번역표(OQ-26), `verify-api` 확장 | DR-01~08, FR-01~16 | TASK-013 | MERGED |
| TASK-024 | 임지섭 | [난이도 상] 상세 9세대·모든 폼: 폼이 많은 종의 폼 선택 UI, 도감 설명 버전 확장·정보 없음, 출현 장소 확장팩 합침·데이터 없는 게임 안내, 이미지 대체 순서(GIF→PNG→HOME→기본 폼→아이콘) | FR-08~16 | TASK-023, OQ-17, OQ-25 | MERGED |
| TASK-026 | 김형균 | [난이도 중] 파티 타입 분석: 파티 화면(라우트 추가)·6마리 선택·받는 피해 표·주의 타입·보완 추천·자속 공격 범위 | FR-33 | TASK-021, TASK-022 | SELF_TESTED |
| TASK-027 | 김형균 | [난이도 중] 종족값 정렬·조건 검색: 검색 인덱스에 종족값 추가·정렬 키·하한 필터 | FR-34 | TASK-023 | SELF_TESTED |
| TASK-025 | 성윤우 | [난이도 중] 실전 세팅 세대 탭(9·8·7·6, 최신 기본), 리전폼·메가·최신 메가 매핑, 메가레쿠쟈 규칙, 변칙 포맷 제외 목록 확장 | FR-17~18 | TASK-023 | BACKLOG |
| TASK-028 | 성윤우 | 움직임 줄이기에서도 선택 폼 유지: 같은 폼 정적 이미지·GIF 정지 프레임, 변환 실패 안내, 기본 모습 대체 고지 | FR-11·23, NFR-08 | TASK-011, TASK-024(PR #44·#50), 이슈 #49 | QA_REVIEW |

> 선택 기능 담당·난이도 (2026-11-04 확정, OQ-22): 비중은 김형균 > 임지섭 >>> 성윤우.
> 난이도 점수 하=1·중=2·상=3 기준 — 김형균 11(TASK-014·019·020·021·022), 임지섭 6(TASK-015·016·018), 성윤우 3(TASK-011·017).
> 9세대·모든 폼 확장(ADR-016, 2026-11-04)은 같은 비중으로 TASK-023(김형균 상)·024(임지섭 상)·025(성윤우 중)를 더한다 → 김형균 14, 임지섭 9, 성윤우 5. TASK-023이 끝나야 다른 선택 기능이 새 범위로 진행된다.
> 다른 담당자 화면에 붙는 기능(타입 상성 섹션, 이로치 전환)은 소유 feature의 공개 컴포넌트로 만들고, 상세 화면 연결부는 상세 담당(임지섭)이 확인한다.

### 상태 메모 (2026-11-04)
- **독립 QA (2026-11-04, develop 7c469bc, 구현 세션과 별도 QA 세션)**: TASK-012·013·019·020·021·022·023 PASS → MERGED. 보고서 `docs/qa/QA_TASK-0XX.md`. 하(下) 결함·남은 위험은 각 보고서 §4·§5.
- **TASK-014**: 1차 QA FAIL(D-014-01, 중: 상세에서 내 게임을 바꾼 뒤 뒤로 가기를 하면 이전 `game` 값이 다시 저장됨) → 팀 결정 "저장된 선택 유지"로 수정(`fix/my-game-keep-choice` `2e38546`, ADR-011 개정) → **재검증 PASS → MERGED**(수정 PR 병합 기준). 별도 추적: D-014-02(중, 출현 데이터 없는 게임·확장팩 처리 누락 — TASK-024 범위, 그때까지 해당 게임을 내 게임 목록에 둘지 김형균·임지섭 결정 필요), D-014-04(하, 개발 서버에서 잘못된 `?game=` 값이 드물게 남음). 보고서 `docs/qa/QA_TASK-014.md` §6.
- TASK-001~004: develop 반영(PR #1, 직접 push). QA는 구현과 같은 Claude가 수행해 교차 QA 미충족.
- TASK-005·006: develop 반영(PR #2). 1차 QA FAIL(E2E 회귀) → 테스트 수정 후 병합, 재검증 기록 없음.
- TASK-007·008: Codex 구현, Claude 독립 QA 1차 FAIL(M-1) → PR #6에서 수정·재검증 PASS. PR #6 병합 시 MERGED.
- 메인(`main`) 배포는 아직 없음. 필수 기능 완료 후 `develop → main` PR로 반영.

## TASK-028 등록 및 이미지 정책 문서 개정 (2026-11-25)

- 관련 작업: [이슈 #49](https://github.com/semicolon213/pokefile/issues/49), [구현 PR #51](https://github.com/semicolon213/pokefile/pull/51), [작업 카드](https://github.com/semicolon213/pokefile/blob/d193328ec2518aa7025380ec2dae3550d05e4abb/src/features/battle-tools/TASK-028.md).
- owner: 성윤우(@yoonwoo2002) / implementer_tool: Codex / status: **QA_REVIEW**. 구현 기준은 PR #51 `d193328`이며, 전체 독립 QA PASS·사람 승인·병합을 뜻하지 않는다.
- requirements: FR-11·23, NFR-08 / tests: TC-04·08·11 / 설계: ADR-016, DESIGN §2.2·3.3.
- 제품 허용 경로: `src/features/battle-tools/**`, `tests/{unit,integration,e2e}/battle-tools/**`. 상세 연결은 `src/features/pokemon-detail/model/detail.ts`, `src/features/pokemon-detail/components/BasicInfoSection.tsx`, `tests/unit/pokemon-detail/detail.test.ts`, `tests/integration/pokemon-detail/PokemonDetailPage.test.tsx`에 한정한다.
- 범위 근거: [최초 변경 요청](https://github.com/semicolon213/pokefile/issues/49#issuecomment-7150622824), [PR #50 반영 보완](https://github.com/semicolon213/pokefile/issues/49#issuecomment-7150909784). 상세 담당 임지섭은 [PR #51 검토](https://github.com/semicolon213/pokefile/pull/51#pullrequestreview-6051026407)에서 상세 후보 계약을 승인했다. 성윤우 담당 코드 교차 검증은 김형균에게 요청된 상태다(ADR-014).
- 제품 인수 조건: OFF는 같은 폼 GIF → PNG → HOME, ON은 같은 폼 PNG → HOME → GIF 정지 프레임을 사용한다. 정지 변환 불가 시 안내하며 재생 GIF·다른 폼으로 대체하지 않는다. 선택 폼 URL이 전혀 없을 때만 일반 이미지의 기본 모습 대체를 허용하고 고지한다. 이로치는 일반·기본 폼으로 대체하지 않으며, 열린 페이지의 움직임 설정 변경과 이전 비동기 작업 취소를 반영한다. 실제 데이터와 테스트 데이터 결과를 구분한다.
- 관련 테스트·lint/typecheck/test/build 증거와 독립 QA PASS를 확인한 뒤 사람 승인을 받는다. 기존 자체 실행 및 상세 계약 검토는 전체 독립 QA를 대신하지 않는다.

### DOC-TASK-028 — TASK 등록 및 정책 개정안

- owner: 성윤우(@yoonwoo2002) / 작성: Codex / 상태: **문서 초안·팀 검토 대기**. 사용자의 PR #51 검토 의견 반영 요청에 따른 별도 문서 작업이다.
- allowed_paths: `docs/TASKS.md`, `docs/DECISIONS.md`, `docs/DESIGN.md`. 그 밖의 제품·테스트·공통 설정·패키지는 변경하지 않는다.
- 인수 조건: TASK-028 담당·범위·인수 조건을 등록하고, ADR-016·DESIGN §3.3에 같은 폼 우선순위와 정지 변환 실패 시 안내 정책을 명시한다. PR #50의 후보 계약과 FR-23을 유지하고 승인·QA 상태를 사실대로 기록한다.
- 반영 조건: 이미지 정책은 **제안**으로 표시한다. 별도 문서 PR에서 담당·범위 및 정책을 팀이 확인하고, PR #51 독립 QA PASS 후 사람 검토를 거쳐 최종 반영한다(WORKFLOW §8). 기존 TASK 상태와 승인된 ADR의 다른 결정은 변경하지 않는다.

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
