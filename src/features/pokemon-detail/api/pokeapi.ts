import { fetchJson, POKEAPI_BASE_URL } from '@/shared/api'
import type { PokemonSummary } from '@/shared/models'

// PokéAPI 응답 중 상세 화면이 쓰는 필드만 선언한다 (API_SPEC.md §5 실측 기준).
// UI에는 그대로 넘기지 않고 model/의 adapter로 정규화한다.

export type NamedResource = { name: string; url: string }
type LocalizedName = { name: string; language: NamedResource }

export type RawPokemon = {
  id: number
  name: string
  height: number
  weight: number
  types: { slot: number; type: NamedResource }[]
  abilities: { slot: number; is_hidden: boolean; ability: NamedResource }[]
  stats: { base_stat: number; stat: NamedResource }[]
  sprites: {
    front_default: string | null
    front_shiny?: string | null
    other?: { showdown?: { front_default: string | null; front_shiny?: string | null } }
  }
  forms: NamedResource[]
  cries?: { latest?: string | null; legacy?: string | null }
}

export type RawPokemonForm = {
  name: string
  is_mega: boolean
  form_names: LocalizedName[]
}

export type RawSpecies = {
  id: number
  name: string
  names: LocalizedName[]
  genera: { genus: string; language: NamedResource }[]
  flavor_text_entries: { flavor_text: string; language: NamedResource; version: NamedResource }[]
  evolution_chain: { url: string } | null
}

export type RawAbility = {
  name: string
  names: LocalizedName[]
}

/**
 * 진화 조건 하나. 같은 진화에 게임(version_group)·폼별로 여러 개가 온다 (2026-11-11 전체 540개 체인 실측).
 * 값이 없는 필드는 null/false/'' 이며, 실측에서 쓰이지 않는 필드(condition_expression 등)는 선언하지 않는다.
 */
export type RawEvolutionDetail = {
  trigger: NamedResource
  min_level: number | null
  version_group?: NamedResource | null
  region?: NamedResource | null
  /** 진화 전 폼 (예: vulpix-alola). 리전폼 진화 판별에 쓴다 */
  required_pokemon_form?: NamedResource | null
  evolved_pokemon_form?: NamedResource | null
  item?: NamedResource | null
  held_item?: NamedResource | null
  known_move?: NamedResource | null
  known_move_type?: NamedResource | null
  used_move?: NamedResource | null
  min_move_count?: number | null
  location?: NamedResource | null
  near_special_rock?: boolean
  time_of_day?: string
  gender?: number | null
  min_happiness?: number | null
  min_affection?: number | null
  min_beauty?: number | null
  min_damage_taken?: number | null
  min_steps?: number | null
  party_species?: NamedResource | null
  party_type?: NamedResource | null
  trade_species?: NamedResource | null
  relative_physical_stats?: number | null
  needs_overworld_rain?: boolean
  needs_multiplayer?: boolean
  turn_upside_down?: boolean
}

export type RawEvolutionNode = {
  species: NamedResource
  evolution_details: RawEvolutionDetail[]
  evolves_to: RawEvolutionNode[]
}

export type RawEvolutionChain = {
  id: number
  chain: RawEvolutionNode
}

export type RawEncounter = {
  location_area: NamedResource
  version_details: {
    version: NamedResource
    encounter_details: { min_level: number; max_level: number; method: NamedResource }[]
  }[]
}

/** 기본 폼은 `/pokemon/{id}`, 메가는 `/pokemon/{species-name}-{formKey}` (ADR-009) */
export function fetchPokemon(idOrName: number | string) {
  return fetchJson<RawPokemon>(`${POKEAPI_BASE_URL}/pokemon/${idOrName}`)
}

export function fetchPokemonForm(name: string) {
  return fetchJson<RawPokemonForm>(`${POKEAPI_BASE_URL}/pokemon-form/${name}`)
}

export function fetchSpecies(id: number) {
  return fetchJson<RawSpecies>(`${POKEAPI_BASE_URL}/pokemon-species/${id}`)
}

export function fetchAbility(name: string) {
  return fetchJson<RawAbility>(`${POKEAPI_BASE_URL}/ability/${name}`)
}

/** 진화 조건의 도구 이름 (`names[ko]`) */
export function fetchItem(name: string) {
  return fetchJson<{ name: string; names: LocalizedName[] }>(`${POKEAPI_BASE_URL}/item/${name}`)
}

/** 진화 조건의 기술 이름 (`names[ko]`) */
export function fetchMove(name: string) {
  return fetchJson<{ name: string; names: LocalizedName[] }>(`${POKEAPI_BASE_URL}/move/${name}`)
}

/** 진화 조건의 장소 이름 (`names[ko]`, 없으면 en). 번역표에 없는 장소만 조회한다 */
export function fetchLocation(name: string) {
  return fetchJson<{ name: string; names: LocalizedName[] }>(`${POKEAPI_BASE_URL}/location/${name}`)
}

export function fetchEvolutionChain(chainId: number) {
  return fetchJson<RawEvolutionChain>(`${POKEAPI_BASE_URL}/evolution-chain/${chainId}`)
}

export function fetchEncounters(id: number) {
  return fetchJson<RawEncounter[]>(`${POKEAPI_BASE_URL}/pokemon/${id}/encounters`)
}

/**
 * 정적 검색 인덱스(public/data/pokedex-index.json, ADR-010).
 * 폼 목록(`forms`)·폼 이름과 진화 트리의 한국어 이름에 사용한다.
 */
export const POKEDEX_INDEX_URL = `${import.meta.env.BASE_URL}data/pokedex-index.json`

export async function fetchPokedexIndex(): Promise<PokemonSummary[]> {
  const file = await fetchJson<{ version: number; pokemon: PokemonSummary[] }>(POKEDEX_INDEX_URL)
  if (file.version !== 2 || !Array.isArray(file.pokemon)) {
    throw new Error('검색 인덱스 형식이 올바르지 않습니다.')
  }
  return file.pokemon
}

/** `.../pokemon-species/133/` → 133 */
export function idFromResourceUrl(url: string): number | null {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : null
}
