import { fetchJson, PKMN_DATA_BASE_URL } from '@/shared/api'
import { normalizeGen6SmogonSets } from '../model/smogon'

/** gen6 파일 전체를 한 번 조회한다. 오류 분류는 기존 shared/api 계약을 그대로 사용한다. */
export async function fetchGen6SmogonSets(signal?: AbortSignal) {
  const data = await fetchJson<unknown>(`${PKMN_DATA_BASE_URL}/sets/gen6.json`, { signal })
  return normalizeGen6SmogonSets(data)
}
