import { isPokemonId } from '@/shared/models'
import type { PokemonId } from '@/shared/models'
import { StarIcon } from '@/shared/ui'
import { formatDexNumber } from '@/shared/utils'
import { useFavorites } from '../hooks/useFavorites'
import './FavoriteToggle.css'

type Props = { pokemonId: PokemonId }

// FR-19~21 / ADR-012: 기존 목록·상세의 공개 컴포넌트 계약(pokemonId)을 그대로 사용한다.
export function FavoriteToggle({ pokemonId }: Props) {
  const { ids, status, message, toggle } = useFavorites()
  const saved = ids.includes(pokemonId)
  const label = `${formatDexNumber(pokemonId)} 즐겨찾기 ${saved ? '해제' : '추가'}`
  return (
    <span className="favorite-control">
      <button
        type="button"
        className="favorite-toggle"
        disabled={status === 'unavailable' || !isPokemonId(pokemonId)}
        aria-label={label}
        aria-pressed={saved}
        aria-description={message}
        title={message ?? label}
        onClick={(event) => {
          event.stopPropagation()
          toggle(pokemonId)
        }}
      >
        <StarIcon filled={saved} size={20} />
      </button>
      {message && <span className="favorite-feedback" role="status">{status === 'unavailable' ? '저장 불가' : '저장 정보 정리됨'}</span>}
    </span>
  )
}
