# 외부 API 및 데이터 계약 (검증 초안)

> 2026-10-28 `scripts/verify-api`로 #1~#721과 6세대 메가 48종의 응답 필드를 실측했다(§5). 요청량 제한과 배포 origin CORS는 아직 검증되지 않았다.

## 1. 출처
| 출처 | 보고서에서 확인한 목적 | 확인 상태 |
|---|---|---|
| PokéAPI `/pokemon` | 포켓몬 기본 데이터/목록 | 1주차 조사 |
| PokéAPI `/pokemon-species` | 한국어 이름·설명·세대 | 1주차 조사 |
| PokéAPI `/evolution-chain` | 진화 관계 | 1주차 조사 |
| PokéAPI `/pokemon/{id}/encounters` | 출현 장소 | 1주차 조사 |
| data.pkmn.cc `/sets/gen6.json` | Smogon 기반 실전 세팅 | CORS·스키마 실측 완료(§5) |

## 2. 검증해야 할 항목
- 실제 URL/경로 파라미터와 응답 JSON
- 목록 페이징/총량/폼 포함 여부
- species와 pokemon의 ID·폼 관계
- 한국어 이름과 도감 설명의 언어 필터
- 진화 트리 연결 ID 및 분기 처리
- 출현 장소 데이터의 게임·세대 범위와 빈 응답
- data.pkmn.cc의 세팅 구조, 게임 버전, 폼 표기, 누락 항목
- CORS를 **배포할 실제 origin**에서도 확인
- API 실패/지연/응답 구조 변경 시 UI 처리

## 3. 정규화 원칙
- 내부 기준 ID는 전국도감 번호(1~721)이고, 6세대 메가는 `FormKey`로 구분한다(ADR-009). 다른 대체 폼은 OQ-15.
- API 응답 객체를 UI 컴포넌트에 직접 전파하지 않고 adapter에서 정규화한다.
- 번역·폼 매핑은 검증된 매핑 테이블로 관리한다.
- 매핑 실패는 `empty` 또는 명시적 오류로 반환하며 다른 포켓몬의 세팅으로 대체하지 않는다.
- `404/데이터 없음`, 네트워크 오류, JSON 파싱 오류를 구분한다.

## 4. 캐싱 (제안)
Query Key 예: `['pokemon', id]`, `['species', id]`, `['encounters', id]`, `['pokemon', id, formKey]`, `['smogon', 'gen6']`.
캐시 시간과 재시도 횟수는 성능/요청량 측정 후 확정한다.

## 5. 검증 기록 표

검증 코드: `scripts/verify-api/verify-api.test.mjs` (`node --test`, 실제 네트워크 호출). 범위: #1~#721 + 6세대 메가 48종 (ADR-008). 최종 실행: 11/11 PASS.

| 항목 | 실제 호출 URL | 샘플 포켓몬/폼 | 결과 | 확인자/날짜 |
|---|---|---|---|---|
| 세대 범위 | `/pokemon-species/{1..721}` | 전체 | generation-i~vi만 존재, #721 = volcanion | Claude Code / 2026-10-28 |
| 한국어 이름 | `/pokemon-species/{id}` `names[language=ko]` | 전체, 피카츄 | **721/721 존재**, #25 = `피카츄` | Claude Code / 2026-10-28 |
| 한국어 도감 설명 | `/pokemon-species/{id}` `flavor_text_entries[language=ko]` | 전체 | **721/721이 x·y·omega-ruby·alpha-sapphire 버전에 존재**. 5세대 이하 게임 버전에는 ko 설명 없음 → OQ-17 | Claude Code / 2026-10-28 |
| 애니메이션 GIF | `/pokemon/{id}` `sprites.other.showdown.front_default` / `front_shiny` | 전체 + 메가 | **721/721, 메가 48/48 존재**(이로치 포함), `image/gif` 200. 참고: BW GIF는 #650~#721 중 18종, 메가 중 24종 누락 → ADR-013에서 showdown으로 통일 | Claude Code / 2026-10-28 |
| 타입 변경 이력 | `/pokemon/{id}` `past_types` | 전체 | 24종에 있으나 모두 generation-v 이하 변경(페어리 도입 등). **6세대 이후 변경 0건** → 현재 타입 = 6세대 타입 | Claude Code / 2026-10-28 |
| 6세대 메가 | `/pokemon?limit=2000`, `/pokemon-form/{name}` | 전체 | `-mega` 이름 97개 중 `is_mega` && version_group ∈ {x-y, omega-ruby-alpha-sapphire} = **48개**(#10033~#10090 구간). 나머지 49개는 `mega-dimension` 그룹이라 제외. ko 폼 이름 48/48 존재(예: 메가이상해꽃). 원시회귀는 `is_mega=false` | Claude Code / 2026-10-28 |
| 출현 장소 | `/pokemon/{25,495,650,714}/encounters` | 피카츄, 주리비얀, 도치마론, 음뱃 | 7세대 이후 버전(sun, sword 등)과 `red-japan`·`lets-go-*` 등이 섞여 있어 **버전 필터 필요**(ADR-008 목록). #650은 x·y만 | Claude Code / 2026-10-28 |
| 장소 한국어 이름 | `/location/{100,600}` | 관동, 칼로스 | 1~5세대 지역은 ko 없음(en/fr/de만), 칼로스는 ko 있음(프리즘타워) → OQ-18 | Claude Code / 2026-10-28 |
| 진화 분기 | `/evolution-chain/*` (721종이 속한 365개 체인) | 이브이 외 전체 | 이브이 분기 8개(님피아 #700 포함). 체인 전체에서 **#722 이후 종 17개** 발견(킹갬브릿 #983, 마임꽁꽁 #866 등) → 제외 필요 | Claude Code / 2026-10-28 |
| data.pkmn.cc CORS | `https://data.pkmn.cc/sets/gen6.json` | — | 301 → `https://pkmn.github.io/smogon/data/sets/gen6.json`, 두 응답 모두 `Access-Control-Allow-Origin: *`, fetch 리다이렉트 정상 | Claude Code / 2026-10-28 |
| Smogon 스키마 | 위와 동일 | 전체 | `{ [포켓몬]: { [포맷]: { [세팅명]: { moves, ability, item, nature, evs, ivs } } } }`. `moves` 원소와 `item`은 문자열 또는 **문자열 배열(택1 후보)** | Claude Code / 2026-10-28 |
| Smogon 이름 매핑(기본) | 위와 동일 | 전체 | `toId(species.name)` 기준 **639/721 매칭**, 나머지 82종은 세팅 없음 | Claude Code / 2026-10-28 |
| Smogon 이름 매핑(메가) | 위와 동일 | 메가 48종 | `X-Mega` 키로 직접 매칭 **25/48**. 나머지(리자몽 X/Y, 거북왕 등)는 **기본 종 세팅의 `item`이 메가스톤**(예: `Charizardite X`, `Blastoisinite`)인 형태로만 존재 → 메가스톤 대응표 필요(ADR-009) | Claude Code / 2026-10-28 |
| 실전 세팅 추출 | 위와 동일 | 한카리아스, 캐터피, 메가 48종 | 한카리아스 ou 세팅 7개 모두 기술·성격·노력치 있음. 캐터피는 키 없음 → `empty`. 변칙 룰 포맷을 뺀 일반 포맷 기준으로 **메가 47/48 세팅 있음**(메가스톤 47종 확인). 메가레쿠쟈는 스톤이 없어 없음 → '정보 없음'으로 결정(OQ-21). 메가 키 세팅 중 20종은 hackmons 계열뿐 | Claude Code / 2026-10-28 |
| 응답 특성 | 위와 동일 | — | 약 635KB(gzip 전송), `cache-control: max-age=600`, `etag` 제공, 응답 약 1초. 세대 파일 하나를 한 번 받아 캐시하면 된다(Query Key `['smogon','gen6']`) | Claude Code / 2026-10-28 |
| 매핑 대상 아닌 키 | 위와 동일 | — | 64개: 대체 폼(Rotom-Wash, Deoxys-Speed, Arceus-타입, Hoopa-Unbound, Meowstic-F, Gourgeist-*, Kyogre/Groudon-Primal 등)과 CAP 가상 포켓몬(Syclant 등) | Claude Code / 2026-10-28 |
| 기본 폼 이름 | `/pokemon?limit=721` | — | 19종이 species 이름과 다름: deoxys-normal, wormadam-plant, giratina-altered, shaymin-land, basculin-red-striped, darmanitan-standard, frillish-male, jellicent-male, tornadus/thundurus/landorus-incarnate, keldeo-ordinary, meloetta-aria, pyroar-male, meowstic-male, aegislash-shield, pumpkaboo-average, gourgeist-average, zygarde-50 | Claude Code / 2026-10-28 |

gen6 세팅 포맷: `ou, uu, ru, nu, pu, zu, lc, ubers, monotype, doublesou, vgc2014, vgc2016, battlespotsingles, battlespotdoubles, battlespottriples, anythinggoes, 1v1, cap, middlecup, stabmons, almostanyability, balancedhackmons, purehackmons` → 표시 포맷은 OQ-19.

**미검증:** 배포 origin(GitHub Pages)에서의 CORS 확인(배포 후 TASK-010), 요청량 제한.

## 6. 보안
프론트엔드 빌드 결과물은 공개되므로 비밀 키/토큰을 저장하지 않는다.
API 출처 변경이나 프록시 서버 추가는 팀 승인 및 SRS/설계 변경을 요구한다.
