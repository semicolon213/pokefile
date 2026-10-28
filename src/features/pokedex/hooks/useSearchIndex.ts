import { useQuery } from '@tanstack/react-query'
import { pokedexQueryKeys } from '../api/queryKeys'
import { fetchSearchIndex } from '../api/searchIndex'

/** 정적 검색 인덱스는 배포 단위로만 바뀌므로 세션 동안 다시 요청하지 않는다 */
export function useSearchIndex() {
  return useQuery({
    queryKey: pokedexQueryKeys.searchIndex(),
    queryFn: fetchSearchIndex,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
