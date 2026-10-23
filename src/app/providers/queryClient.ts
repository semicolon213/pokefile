import { QueryClient } from '@tanstack/react-query'

// 캐시 TTL·재시도 횟수는 성능/요청량 측정 후 확정한다 (API_SPEC.md §4, OQ-13).
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}
