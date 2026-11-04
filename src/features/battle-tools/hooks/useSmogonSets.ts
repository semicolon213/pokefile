import { useQuery } from '@tanstack/react-query'
import { battleToolsQueryKeys } from '../api/queryKeys'
import { fetchGen6SmogonSets } from '../api/smogon'

// 종·폼별로 같은 gen6 파일을 중복 요청하지 않는다. TTL·재시도는 공통 QueryClient를 따른다.
// 화면 연결은 OQ-19 및 상세 feature와의 폼 전달 계약 합의 후 진행한다.
export function useSmogonSets() {
  return useQuery({
    queryKey: battleToolsQueryKeys.smogonSets(),
    queryFn: ({ signal }) => fetchGen6SmogonSets(signal),
  })
}
