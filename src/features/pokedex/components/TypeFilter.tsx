import { POKEMON_TYPES, type PokemonType } from '@/shared/models'
import { TYPE_LABELS } from '@/shared/ui'
import { MAX_TYPES } from '../model/filters'

type Props = {
  selected: PokemonType[]
  onChange: (types: PokemonType[]) => void
}

// 타입 필터 (FR-04). 최대 2개를 골라 그 타입 조합을 모두 가진 포켓몬만 본다. 다시 누르면 해제된다.
// 2개를 고르면 나머지 칩은 비활성화된다(세 타입을 모두 가진 포켓몬은 없으므로).
export function TypeFilter({ selected, onChange }: Props) {
  const full = selected.length >= MAX_TYPES

  const toggle = (type: PokemonType) => {
    if (selected.includes(type)) onChange(selected.filter((t) => t !== type))
    else if (!full) onChange([...selected, type])
  }

  return (
    <div className="type-filter-wrap">
      <div className="type-filter" role="group" aria-label="타입 필터" aria-describedby="type-filter-hint">
        <button
          type="button"
          className="type-filter__chip"
          aria-pressed={selected.length === 0}
          onClick={() => onChange([])}
        >
          전체 타입
        </button>
        {POKEMON_TYPES.map((type) => {
          const pressed = selected.includes(type)
          return (
            <button
              key={type}
              type="button"
              className={`type-filter__chip type-filter__chip--type type--${type}`}
              aria-pressed={pressed}
              disabled={full && !pressed}
              onClick={() => toggle(type)}
            >
              {TYPE_LABELS[type]}
            </button>
          )
        })}
      </div>
      <p id="type-filter-hint" className="type-filter__hint" aria-live="polite">
        {full
          ? `${selected.map((t) => TYPE_LABELS[t]).join('·')} 타입을 모두 가진 포켓몬입니다. 타입은 최대 2개까지 고를 수 있어요.`
          : '타입을 2개까지 골라 조합으로 찾을 수 있어요.'}
      </p>
    </div>
  )
}
