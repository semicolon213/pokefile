import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { DEFAULT_FILTERS, parseFilters, toSearchParams } from '../model/filters'
import './SearchForm.css'
import { SearchForm } from './SearchForm'

/**
 * 상단 바 검색 (ADR-011). 목록 화면에서는 현재 필터를 유지한 채 q만 바꾸고,
 * 다른 화면에서는 도감 목록으로 이동해 검색한다. URL은 필터 모델의 표준 형식으로 쓴다.
 */
export function HeaderSearch() {
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const onList = location.pathname === '/'
  const current = onList ? parseFilters(params) : DEFAULT_FILTERS

  const search = (q: string) => {
    const next = toSearchParams({ ...current, q }).toString()
    navigate({ pathname: '/', search: next ? `?${next}` : '' })
  }

  // 뒤로 가기 등으로 URL의 검색어가 바뀌면 입력창도 맞춘다
  return <SearchForm key={current.q} initialQuery={current.q} onSearch={search} />
}
