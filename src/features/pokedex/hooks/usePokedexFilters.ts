import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { DEFAULT_FILTERS, parseFilters, toSearchParams, type PokedexFilters } from '../model/filters'

/** 검색어·필터·정렬을 URL 쿼리(/#/?q=&type=&gen=&sort=)와 동기화한다 (ADR-011) */
export function usePokedexFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])

  // 직전 렌더의 값이 아니라 항상 최신 URL을 기준으로 바꾼다. 빠르게 연달아 조작해도 앞선 변경을 덮어쓰지 않는다.
  const update = useCallback(
    (patch: Partial<PokedexFilters>) => setParams((prev) => toSearchParams({ ...parseFilters(prev), ...patch })),
    [setParams],
  )
  const reset = useCallback(() => setParams(toSearchParams(DEFAULT_FILTERS)), [setParams])

  return { filters, update, reset }
}
