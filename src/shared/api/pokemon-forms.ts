import { POKEAPI_BASE_URL } from './endpoints'
import { ApiError, fetchJson } from './http'

export type PokemonFormOverride = {
  name: string
  pokemon: { name: string; url: string }
  types: { slot: number; type: { name: string; url: string } }[]
  sprites: {
    front_default: string | null
    front_shiny?: string | null
    other?: { showdown?: { front_default: string | null; front_shiny?: string | null } }
  }
}

/** C-01: 선택 폼의 타입·이미지만 조회한다. 연결된 기본 pokemon의 종족값은 호출자가 유지한다. */
export async function fetchPokemonFormOverride(name: string, pokemonName: string, signal?: AbortSignal): Promise<PokemonFormOverride> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new ApiError('parse', '올바르지 않은 포켓몬 폼 리소스입니다.')
  }
  const form = await fetchJson<PokemonFormOverride>(`${POKEAPI_BASE_URL}/pokemon-form/${name}`, { signal })
  if (!form || typeof form !== 'object' || form.name !== name || form.pokemon?.name !== pokemonName
    || !Array.isArray(form.types) || form.types.length === 0
    || form.types.some((entry) => !entry || !Number.isInteger(entry.slot) || typeof entry.type?.name !== 'string')
    || !form.sprites || (form.sprites.front_default !== null && typeof form.sprites.front_default !== 'string')) {
    throw new ApiError('parse', '선택한 포켓몬과 폼 정보가 일치하지 않습니다.')
  }
  return form
}
