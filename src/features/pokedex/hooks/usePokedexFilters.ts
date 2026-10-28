import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { DEFAULT_FILTERS, parseFilters, toSearchParams, type PokedexFilters } from '../model/filters'

/** 검색어·필터·정렬을 URL 쿼리(/#/?q=&type=&gen=&sort=)와 동기화한다 (ADR-011) */
export function usePokedexFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])

  const update = useCallback(
    (patch: Partial<PokedexFilters>) => setParams(toSearchParams({ ...filters, ...patch })),
    [filters, setParams],
  )
  const reset = useCallback(() => setParams(toSearchParams(DEFAULT_FILTERS)), [setParams])

  return { filters, update, reset }
}
