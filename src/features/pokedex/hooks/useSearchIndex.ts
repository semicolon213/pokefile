import { useQuery } from '@tanstack/react-query'
import { pokedexQueryKeys } from '../api/queryKeys'
import { fetchSearchIndex, type SearchIndex } from '../api/searchIndex'

const indexQuery = {
  queryKey: pokedexQueryKeys.searchIndex(),
  queryFn: fetchSearchIndex,
  staleTime: Infinity,
  gcTime: Infinity,
}

const selectPokemon = (index: SearchIndex) => index.pokemon
const selectRegionalDexes = (index: SearchIndex) => index.regionalDexes

/** 정적 검색 인덱스는 배포 단위로만 바뀌므로 세션 동안 다시 요청하지 않는다 */
export function useSearchIndex() {
  return useQuery({ ...indexQuery, select: selectPokemon })
}

/** 같은 인덱스 파일의 지방 도감 (TASK-019) */
export function useRegionalDexes() {
  return useQuery({ ...indexQuery, select: selectRegionalDexes })
}
