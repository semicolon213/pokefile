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
    other?: { showdown?: { front_default: string | null } }
  }
  forms: NamedResource[]
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

export type RawEvolutionNode = {
  species: NamedResource
  evolution_details: { min_level: number | null; trigger: NamedResource }[]
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

export function fetchEvolutionChain(chainId: number) {
  return fetchJson<RawEvolutionChain>(`${POKEAPI_BASE_URL}/evolution-chain/${chainId}`)
}

export function fetchEncounters(id: number) {
  return fetchJson<RawEncounter[]>(`${POKEAPI_BASE_URL}/pokemon/${id}/encounters`)
}

/**
 * 정적 검색 인덱스(public/data/pokedex-index.json, ADR-010).
 * 메가 폼 목록(`megaForms`)과 진화 트리의 한국어 이름에 사용한다.
 */
export const POKEDEX_INDEX_URL = `${import.meta.env.BASE_URL}data/pokedex-index.json`

export async function fetchPokedexIndex(): Promise<PokemonSummary[]> {
  const file = await fetchJson<{ version: number; pokemon: PokemonSummary[] }>(POKEDEX_INDEX_URL)
  if (file.version !== 1 || !Array.isArray(file.pokemon)) {
    throw new Error('검색 인덱스 형식이 올바르지 않습니다.')
  }
  return file.pokemon
}

/** `.../pokemon-species/133/` → 133 */
export function idFromResourceUrl(url: string): number | null {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : null
}
