import { useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { DEFAULT_FILTERS, parseFilters, toSearchParams, type PokedexFilters } from '../model/filters'

/** 필터가 쓰는 쿼리 키. 그 밖의 키(내 게임 `game` 등)는 건드리지 않는다 */
const FILTER_KEYS = ['q', 'type', 'gen', 'sort']

function withFilters(base: URLSearchParams, filters: PokedexFilters): URLSearchParams {
  const next = new URLSearchParams(base)
  for (const key of FILTER_KEYS) next.delete(key)
  // 필터 키를 앞에 두어 주소 모양을 일정하게 유지한다
  const merged = toSearchParams(filters)
  next.forEach((value, key) => merged.append(key, value))
  return merged
}

/** 검색어·필터·정렬을 URL 쿼리(/#/?q=&type=&gen=&sort=)와 동기화한다 (ADR-011) */
export function usePokedexFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])

  // setSearchParams에 함수를 넘겨도 인자는 이번 렌더의 값이라, 빠르게 연달아 바꾸면 앞선 변경이 사라진다.
  // 마지막으로 쓴 값을 바로 기록해 두고 그 값을 기준으로 다음 변경을 만든다.
  const latest = useRef(params)
  // 화면에 반영된 주소로 맞춘다(커밋 직후, 사용자가 다음 조작을 하기 전)
  useLayoutEffect(() => {
    latest.current = params
  }, [params])

  const write = useCallback(
    (next: URLSearchParams) => {
      latest.current = next
      setParams(next)
    },
    [setParams],
  )

  const update = useCallback(
    (patch: Partial<PokedexFilters>) =>
      write(withFilters(latest.current, { ...parseFilters(latest.current), ...patch })),
    [write],
  )
  const reset = useCallback(() => write(withFilters(latest.current, DEFAULT_FILTERS)), [write])

  return { filters, update, reset }
}
