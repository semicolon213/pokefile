import { POKEMON_TYPES, type PokemonType } from '@/shared/models'
import { TYPE_LABELS } from '../model/labels'

type Props = {
  selected: PokemonType | null
  onSelect: (type: PokemonType | null) => void
}

// 타입 필터 (FR-04). 같은 타입을 다시 누르면 해제된다.
export function TypeFilter({ selected, onSelect }: Props) {
  return (
    <div className="type-filter" role="group" aria-label="타입 필터">
      <button
        type="button"
        className="type-filter__all"
        aria-pressed={selected === null}
        onClick={() => onSelect(null)}
      >
        전체 타입
      </button>
      {POKEMON_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          className={`type-chip type-chip--${type} type-filter__chip`}
          aria-pressed={selected === type}
          onClick={() => onSelect(selected === type ? null : type)}
        >
          {TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  )
}
