import { fetchJson } from '@/shared/api'
import type { PokemonSummary } from '@/shared/models'
import type { RegionalDexData } from '../model/regional'

/** public/data/pokedex-index.json (scripts/build-pokedex-index.mjs가 생성, ADR-010) */
export type SearchIndexFile = {
  version: 2
  generatedAt: string
  count: number
  pokemon: PokemonSummary[]
  /** 지방 도감 (TASK-019, ADR-017) */
  regionalDexes?: RegionalDexData
}

/** regionalDexes가 없으면(이전 형식 인덱스) 지방 도감 대신 세대로 거른다 */
export type SearchIndex = { pokemon: PokemonSummary[]; regionalDexes?: RegionalDexData }

export const SEARCH_INDEX_URL = `${import.meta.env.BASE_URL}data/pokedex-index.json`

export async function fetchSearchIndex(): Promise<SearchIndex> {
  const file = await fetchJson<SearchIndexFile>(SEARCH_INDEX_URL)
  if (file.version !== 2 || !Array.isArray(file.pokemon)) {
    throw new Error('검색 인덱스 형식이 올바르지 않습니다.')
  }
  return { pokemon: file.pokemon, regionalDexes: file.regionalDexes }
}
