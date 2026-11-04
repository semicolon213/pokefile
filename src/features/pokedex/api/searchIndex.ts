import { fetchJson } from '@/shared/api'
import type { PokemonSummary } from '@/shared/models'

/** public/data/pokedex-index.json (scripts/build-pokedex-index.mjs가 생성, ADR-010) */
export type SearchIndexFile = {
  version: 1
  generatedAt: string
  count: number
  pokemon: PokemonSummary[]
}

export const SEARCH_INDEX_URL = `${import.meta.env.BASE_URL}data/pokedex-index.json`

export async function fetchSearchIndex(): Promise<PokemonSummary[]> {
  const file = await fetchJson<SearchIndexFile>(SEARCH_INDEX_URL)
  if (file.version !== 1 || !Array.isArray(file.pokemon)) {
    throw new Error('검색 인덱스 형식이 올바르지 않습니다.')
  }
  return file.pokemon
}
