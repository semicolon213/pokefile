import { fetchJson, POKEAPI_BASE_URL } from '@/shared/api'
import { POKEMON_TYPES, type PokemonType } from '@/shared/models'
import { STATS, type CompareStats, type StatKey } from '../model/compare'

type RawPokemon = {
  species: { name: string }
  types: { slot: number; type: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  sprites: { front_default: string | null; other?: { showdown?: { front_default: string | null } } }
}

const isType = (name: string): name is PokemonType => (POKEMON_TYPES as readonly string[]).includes(name)

/** PokéAPI /pokemon/{id 또는 이름} → 비교에 필요한 값. 종족값이 빠지면 0으로 두지 않고 오류로 본다 */
export async function fetchCompareStats(idOrName: number | string): Promise<CompareStats> {
  const raw = await fetchJson<RawPokemon>(`${POKEAPI_BASE_URL}/pokemon/${idOrName}`)
  const stats = Object.fromEntries(
    STATS.map(({ key }) => {
      const stat = raw.stats.find((s) => s.stat.name === key)
      if (!stat) throw new Error(`종족값 ${key} 없음: ${idOrName}`)
      return [key, stat.base_stat]
    }),
  ) as Record<StatKey, number>
  return {
    speciesName: raw.species.name,
    types: [...raw.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name).filter(isType),
    stats,
    imageUrls: [raw.sprites.other?.showdown?.front_default, raw.sprites.front_default].filter(
      (url): url is string => !!url,
    ),
  }
}
