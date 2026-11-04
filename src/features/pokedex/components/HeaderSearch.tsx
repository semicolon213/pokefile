import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { MY_GAME_PARAM } from '@/shared/state'
import { DEFAULT_FILTERS, parseFilters, toSearchParams } from '../model/filters'
import './SearchForm.css'
import { SearchForm } from './SearchForm'

/**
 * 상단 바 검색 (ADR-011). 입력할 때마다 URL q를 바꾼다.
 * 목록 화면에서는 현재 필터를 유지한 채 q만 바꾸고(기록을 쌓지 않도록 replace),
 * 다른 화면에서는 도감 목록으로 이동해 검색한다. 내 게임(game)은 유지한다.
 */
export function HeaderSearch() {
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const onList = location.pathname === '/'
  const current = onList ? parseFilters(params) : DEFAULT_FILTERS
  // 다른 화면에서 목록으로 이동하는 중(아직 렌더 전)에 이어 친 글자는 기록을 또 쌓지 않는다
  const movingToList = useRef(false)
  useEffect(() => {
    if (onList) movingToList.current = false
  }, [onList])

  const search = (q: string) => {
    if (onList && q === current.q) return
    const next = toSearchParams({ ...current, q })
    const game = params.get(MY_GAME_PARAM)
    if (game) next.set(MY_GAME_PARAM, game)
    const search = next.toString()
    navigate({ pathname: '/', search: search ? `?${search}` : '' }, { replace: onList || movingToList.current })
    if (!onList) movingToList.current = true
  }

  return <SearchForm query={current.q} onSearch={search} />
}
