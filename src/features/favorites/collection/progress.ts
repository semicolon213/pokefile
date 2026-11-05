import { GENERATIONS, isPokemonId } from '@/shared/models'
import type { PokemonId, PokemonSummary } from '@/shared/models'

export function collectionSpecies(index: readonly PokemonSummary[]): PokemonSummary[] {
  const species = new Map<PokemonId, PokemonSummary>()
  for (const pokemon of index) {
    if (isPokemonId(pokemon.id) && GENERATIONS.includes(pokemon.generation) && !species.has(pokemon.id)) species.set(pokemon.id, pokemon)
  }
  return [...species.values()].sort((a, b) => a.id - b.id)
}

export function collectionProgress(index: readonly PokemonSummary[], ids: readonly PokemonId[]) {
  const species = collectionSpecies(index)
  const caught = new Set(ids)
  const count = (entries: readonly PokemonSummary[]) => {
    const total = entries.length
    const completed = entries.filter((pokemon) => caught.has(pokemon.id)).length
    const percent = total ? Math.round(completed / total * 1000) / 10 : 0
    return { completed, total, percent: completed < total ? Math.min(99.9, percent) : percent }
  }
  return {
    all: count(species),
    generations: GENERATIONS.map((generation) => ({ generation, ...count(species.filter((pokemon) => pokemon.generation === generation)) })),
  }
}
