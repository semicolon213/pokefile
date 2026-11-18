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
  // 주소가 배포마다 같아서, 브라우저가 이전 배포의 인덱스(최대 10분 캐시)를 쓰지 않도록 서버에 바뀌었는지 확인한다(ETag, 같으면 304)
  const file = await fetchJson<SearchIndexFile>(SEARCH_INDEX_URL, { cache: 'no-cache' })
  if (file.version !== 2 || !Array.isArray(file.pokemon)) {
    throw new Error('검색 인덱스 형식이 올바르지 않습니다.')
  }
  return { pokemon: file.pokemon, regionalDexes: file.regionalDexes }
}
