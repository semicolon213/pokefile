import { useState, type FormEvent } from 'react'
import { SearchIcon } from '@/shared/ui'

type Props = {
  initialQuery: string
  disabled?: boolean
  onSearch: (query: string) => void
}

// ADR-011: 검색 버튼(또는 Enter)으로 제출할 때만 조회한다.
export function SearchForm({ initialQuery, disabled, onSearch }: Props) {
  const [value, setValue] = useState(initialQuery)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(value.trim())
  }

  const reset = () => {
    setValue('')
    onSearch('')
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
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          autoComplete="off"
        />
        {value && (
          <button type="button" className="search-form__reset" onClick={reset} disabled={disabled}>
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
