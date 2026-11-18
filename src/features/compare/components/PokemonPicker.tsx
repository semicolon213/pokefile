import { useState } from 'react'
import { PokemonSearchBox } from '@/features/pokedex'
import type { PokemonSummary } from '@/shared/models'
import { TypeBadge, fitSprite } from '@/shared/ui'
import { displayName, formLabel, formatDexNumber } from '@/shared/utils'
import type { CompareStats, Selection, Slot } from '../model/compare'

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
        <PokemonSearchBox label={label} index={index} onPick={(p) => onChange({ id: p.id, form: 'default' })} />
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
