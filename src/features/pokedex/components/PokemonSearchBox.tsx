import { useId, useState, type KeyboardEvent } from 'react'
import type { PokemonSummary } from '@/shared/models'
import { displayName, formatDexNumber } from '@/shared/utils'
import { searchPokemon } from '../model/search'
import './PokemonSearchBox.css'

const MAX_SUGGESTIONS = 8

type Props = {
  /** 화면 낭독기용 이름 (예: '포켓몬 A', '파티에 추가할 포켓몬') */
  label: string
  index: PokemonSummary[]
  onPick: (pokemon: PokemonSummary) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * 포켓몬 하나를 고르는 검색 콤보박스 (비교 FR-25, 파티 분석 FR-33).
 * 이름(한국어·영어)·도감 번호를 목록 검색과 같은 규칙으로 찾고, 후보 8개를 ↑↓·Enter·Esc로 고른다.
 */
export function PokemonSearchBox({ label, index, onPick, disabled = false, placeholder = '포켓몬 이름 또는 도감 번호' }: Props) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const results = query.trim() && !disabled ? searchPokemon(index, query).slice(0, MAX_SUGGESTIONS) : []
  const open = results.length > 0

  const pick = (pokemon: PokemonSummary) => {
    setQuery('')
    setActive(0)
    onPick(pokemon)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && open) {
      e.preventDefault()
      pick(results[Math.min(active, results.length - 1)])
    } else if (e.key === 'Escape') {
      setQuery('')
    }
  }

  return (
    <div className="pokemon-search-box">
      <label htmlFor={`${id}-input`} className="visually-hidden">
        {label} 검색
      </label>
      <input
        id={`${id}-input`}
        className="pokemon-search-box__input"
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
      />
      {open ? (
        <ul id={`${id}-list`} role="listbox" aria-label={`${label} 후보`} className="pokemon-search-box__list">
          {results.map((p, i) => (
            <li
              key={p.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              className="pokemon-search-box__option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(p)}
              onMouseEnter={() => setActive(i)}
            >
              <span className="tabular">{formatDexNumber(p.id)}</span>
              {displayName(p)}
            </li>
          ))}
        </ul>
      ) : (
        query.trim() && !disabled && <p className="pokemon-search-box__empty">찾는 포켓몬이 없습니다.</p>
      )}
    </div>
  )
}
