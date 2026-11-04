import type { PokemonId, PokemonSummary } from '@/shared/models'

/** 저장 순서를 유지한다. 인덱스에서 찾지 못한 ID도 제거할 수 있도록 목록에 남긴다. */
export function favoriteEntries(ids: readonly PokemonId[], pokemon: readonly PokemonSummary[]) {
  const byId = new Map(pokemon.map((entry) => [entry.id, entry]))
  return ids.map((id) => ({ id, pokemon: byId.get(id) }))
}
