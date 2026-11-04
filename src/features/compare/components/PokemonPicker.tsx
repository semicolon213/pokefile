import { useId, useState, type KeyboardEvent } from 'react'
import { searchPokemon } from '@/features/pokedex'
import type { PokemonSummary } from '@/shared/models'
import { TypeBadge, fitSprite } from '@/shared/ui'
import { displayName, formLabel, formatDexNumber } from '@/shared/utils'
import type { CompareStats, Selection, Slot } from '../model/compare'

const MAX_SUGGESTIONS = 8

type Props = {
  slot: Slot
  label: string
  index: PokemonSummary[]
  selection: Selection | null
  summary: PokemonSummary | undefined
  stats: CompareStats | undefined
  onChange: (selection: Selection | null) => void
}

/** 비교할 포켓몬 하나를 고른다. 이름(한국어·영어)·도감 번호로 찾고, 폼이 있으면 폼도 고른다. */
export function PokemonPicker({ slot, label, index, selection, summary, stats, onChange }: Props) {
  return (
    <section className={`compare-picker compare-picker--${slot}`} aria-label={label}>
      <h2 className="compare-picker__title">
        <span className="compare-swatch" aria-hidden="true" />
        {label}
      </h2>
      {selection && summary ? (
        <Selected selection={selection} summary={summary} stats={stats} onChange={onChange} />
      ) : (
        <SearchBox label={label} index={index} onPick={(p) => onChange({ id: p.id, form: 'default' })} />
      )}
    </section>
  )
}

function Selected({
  selection,
  summary,
  stats,
  onChange,
}: {
  selection: Selection
  summary: PokemonSummary
  stats: CompareStats | undefined
  onChange: (selection: Selection | null) => void
}) {
  const [imageIndex, setImageIndex] = useState(0)
  const image = stats?.imageUrls[imageIndex]
  return (
    <div className="compare-selected">
      <span className="compare-selected__plate">
        {image ? (
          <img
            key={image}
            src={image}
            alt=""
            onLoad={(e) => fitSprite(e.currentTarget, 96, { upscale: false })}
            onError={() => setImageIndex((i) => i + 1)}
          />
        ) : null}
      </span>
      <div className="compare-selected__body">
        <span className="compare-selected__number tabular">{formatDexNumber(summary.id)}</span>
        <span className="compare-selected__name">{displayName(summary)}</span>
        <span className="compare-selected__types">
          {(stats?.types ?? summary.types).map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </span>
        {summary.forms.length > 0 && (
          <label className="compare-selected__form">
            <span className="visually-hidden">{displayName(summary)} 폼</span>
            <select value={selection.form} onChange={(e) => onChange({ id: summary.id, form: e.target.value })}>
              <option value="default">기본 폼</option>
              {summary.forms.map((f) => (
                <option key={f.key} value={f.key}>
                  {formLabel(f)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <button type="button" className="compare-selected__change" onClick={() => onChange(null)}>
        다른 포켓몬
      </button>
    </div>
  )
}

function SearchBox({ label, index, onPick }: { label: string; index: PokemonSummary[]; onPick: (p: PokemonSummary) => void }) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const results = query.trim() ? searchPokemon(index, query).slice(0, MAX_SUGGESTIONS) : []
  const open = results.length > 0

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault()
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && open) {
      e.preventDefault()
      onPick(results[Math.min(active, results.length - 1)])
    } else if (e.key === 'Escape') {
      setQuery('')
    }
  }

  return (
    <div className="compare-search">
      <label htmlFor={`${id}-input`} className="visually-hidden">
        {label} 검색
      </label>
      <input
        id={`${id}-input`}
        className="compare-search__input"
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        placeholder="포켓몬 이름 또는 도감 번호"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
      />
      {open ? (
        <ul id={`${id}-list`} role="listbox" aria-label={`${label} 후보`} className="compare-search__list">
          {results.map((p, i) => (
            <li
              key={p.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              className="compare-search__option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(p)}
              onMouseEnter={() => setActive(i)}
            >
              <span className="tabular">{formatDexNumber(p.id)}</span>
              {displayName(p)}
            </li>
          ))}
        </ul>
      ) : (
        query.trim() && <p className="compare-search__empty">찾는 포켓몬이 없습니다.</p>
      )}
    </div>
  )
}
