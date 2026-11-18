import { SCOPE } from '@/shared/config/scope'
import { ApiError, fetchJson, PKMN_DATA_BASE_URL } from '@/shared/api'
import { normalizeSmogonSets } from '../model/smogon'

/** API_SPEC §5.2: 세대별 전체 파일을 조회한다. 종·폼별 추가 요청은 필요하지 않다. */
export async function fetchSmogonSets(generation: number, signal?: AbortSignal) {
  if (!Number.isInteger(generation) || generation <= 0) throw new ApiError('parse', '지원하지 않는 세대입니다.')
  const data = await fetchJson<unknown>(`${PKMN_DATA_BASE_URL}/sets/gen${generation}.json`, { signal })
  return normalizeSmogonSets(data)
}

/** 기존 소비자의 단일 세대 API를 유지한다. */
export function fetchGen6SmogonSets(signal?: AbortSignal) {
  return fetchSmogonSets(SCOPE.smogon.generation, signal)
}
