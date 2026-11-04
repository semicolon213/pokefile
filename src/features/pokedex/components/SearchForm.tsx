import { useState, type FormEvent } from 'react'
import { SearchIcon } from '@/shared/ui'

type Props = {
  query: string
  disabled?: boolean
  onSearch: (query: string) => void
}

// ADR-011 (2026-11-04 개정): 입력할 때마다 바로 조회한다. 검색 버튼·Enter도 그대로 동작한다.
export function SearchForm({ query, disabled, onSearch }: Props) {
  const [value, setValue] = useState(query)
  const [syncedQuery, setSyncedQuery] = useState(query)

  // 뒤로 가기 등으로 URL의 검색어가 바뀌면 입력창도 맞춘다. 입력 중인 앞뒤 공백은 지우지 않는다.
  if (query !== syncedQuery) {
    setSyncedQuery(query)
    if (value.trim() !== query) setValue(query)
  }

  const change = (next: string) => {
    setValue(next)
    onSearch(next.trim())
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(value.trim())
  }

  return (
    <form className="search-form" role="search" onSubmit={submit}>
      <label htmlFor="pokedex-search-input" className="visually-hidden">
        포켓몬 검색
      </label>
      <span className="search-form__field">
        <SearchIcon size={18} className="search-form__icon" />
        <input
          id="pokedex-search-input"
          className="search-form__input"
          type="search"
          placeholder="포켓몬 이름 또는 도감 번호"
          value={value}
          onChange={(e) => change(e.target.value)}
          disabled={disabled}
          autoComplete="off"
        />
        {value && (
          <button type="button" className="search-form__reset" onClick={() => change('')} disabled={disabled}>
            초기화
          </button>
        )}
      </span>
      <button type="submit" className="button button--primary" disabled={disabled}>
        검색
      </button>
    </form>
  )
}
