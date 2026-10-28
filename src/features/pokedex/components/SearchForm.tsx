import { useState, type FormEvent } from 'react'

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
    <form className="pokedex-search" role="search" onSubmit={submit}>
      <label htmlFor="pokedex-search-input" className="visually-hidden">
        포켓몬 검색
      </label>
      <input
        id="pokedex-search-input"
        className="pokedex-search__input"
        type="search"
        placeholder="포켓몬 이름 또는 도감 번호를 입력하세요"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
      {value && (
        <button type="button" className="pokedex-search__reset" onClick={reset} disabled={disabled}>
          초기화
        </button>
      )}
      <button type="submit" className="pokedex-search__button" disabled={disabled}>
        검색
      </button>
    </form>
  )
}
