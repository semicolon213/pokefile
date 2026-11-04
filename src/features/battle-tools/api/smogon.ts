import { SMOGON_FORMAT_GEN } from '@/shared/config/scope'
import { fetchJson, PKMN_DATA_BASE_URL } from '@/shared/api'
import { normalizeGen6SmogonSets } from '../model/smogon'

/** 지원 범위 설정의 Smogon 세대 파일(gen6) 전체를 한 번 조회한다. 오류 분류는 기존 shared/api 계약을 그대로 사용한다. */
export async function fetchGen6SmogonSets(signal?: AbortSignal) {
  const data = await fetchJson<unknown>(`${PKMN_DATA_BASE_URL}/sets/${SMOGON_FORMAT_GEN}.json`, { signal })
  return normalizeGen6SmogonSets(data)
}
