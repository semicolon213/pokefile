import scope from './scope.json'

// 지원 범위 설정 (TASK-013·023, ADR-015·016). 값은 scope.json 한 곳에서만 정한다 — 이 파일은 타입을 붙여 내보내기만 한다.

export type GenerationInfo = { id: string; name: string; region: string }
export type GameVersionInfo = {
  version: string
  label: string
  generation: string
  /** 본편에 합쳐 표시하는 확장팩 버전 (PokéAPI version 이름, ADR-016) */
  includes?: readonly string[]
  /** false면 PokéAPI에 출현 장소 데이터가 없는 게임 — 출현 정보에서 안내한다 (ADR-016) */
  hasEncounters?: boolean
}

export type Scope = {
  /** 지원하는 마지막 전국도감 번호 */
  maxPokemonId: number
  /** 지원 세대 (PokéAPI generation 식별자, 순서대로) */
  generations: readonly GenerationInfo[]
  /** 출현 장소·게임 선택에 쓰는 본편 게임 버전 (표시 순서) */
  gameVersions: readonly GameVersionInfo[]
  /** 한국어 도감 설명을 고르는 게임 버전 우선순위 */
  flavorTextVersions: readonly string[]
  /** 실전 세팅에 쓰는 Smogon 세대 (data.pkmn.cc sets/gen{N}.json) */
  smogon: { generation: number }
}

export const SCOPE: Scope = scope

/** data.pkmn.cc 파일 이름: gen6 */
export const SMOGON_FORMAT_GEN = `gen${SCOPE.smogon.generation}`
