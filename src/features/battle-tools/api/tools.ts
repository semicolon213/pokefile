import { fetchJson, POKEAPI_BASE_URL } from '@/shared/api'
import type { PokemonType } from '@/shared/models'
import { normalizeTypeDefense } from '../model/matchups'
import { normalizePokemonTools, pokemonResource } from '../model/tools'
import type { PokemonSelection } from '../model/tools'

export async function fetchPokemonTools(selection: PokemonSelection, signal?: AbortSignal) {
  const resource = pokemonResource(selection)
  const data = await fetchJson<unknown>(`${POKEAPI_BASE_URL}/pokemon/${encodeURIComponent(resource)}`, { signal })
  return normalizePokemonTools(data, selection)
}

export async function fetchTypeDefense(type: PokemonType, signal?: AbortSignal) {
  const data = await fetchJson<unknown>(`${POKEAPI_BASE_URL}/type/${type}`, { signal })
  return normalizeTypeDefense(data, type)
}
