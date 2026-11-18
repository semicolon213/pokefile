import { useQueries, useQuery } from '@tanstack/react-query'
import { SCOPE } from '@/shared/config/scope'
import { battleToolsQueryKeys } from '../api/queryKeys'
import { fetchSmogonSets } from '../api/smogon'
import { SMOGON_GENERATIONS, supportsSmogonForm } from '../model/generations'

// 종·폼별로 같은 gen6 파일을 중복 요청하지 않는다. TTL·재시도는 공통 QueryClient를 따른다.
// 화면 연결은 OQ-19 및 상세 feature와의 폼 전달 계약 합의 후 진행한다.
export function useSmogonSets(generation = SCOPE.smogon.generation) {
  return useQuery({
    queryKey: battleToolsQueryKeys.smogonSets(generation),
    queryFn: ({ signal }) => fetchSmogonSets(generation, signal),
  })
}

/** 설정된 세대만 조회하고 여러 화면·폼에서 같은 캐시를 공유한다. */
export function useSmogonGenerations(formKey: string) {
  const generations = SMOGON_GENERATIONS.filter((generation) => supportsSmogonForm(generation, formKey))
  const queries = useQueries({
    queries: generations.map((generation) => ({
      queryKey: battleToolsQueryKeys.smogonSets(generation),
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchSmogonSets(generation, signal),
    })),
  })
  return queries.map((query, index) => ({ generation: generations[index], query }))
}
