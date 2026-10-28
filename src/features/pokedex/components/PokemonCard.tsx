import { useState } from 'react'
import { Link } from 'react-router'
import { FavoriteToggle } from '@/features/favorites'
import { pokemonDetailPath } from '@/features/pokemon-detail'
import type { PokemonSummary } from '@/shared/models'
import { displayName, formatDexNumber } from '@/shared/utils'
import { pokemonImageUrls } from '../model/image'
import { TYPE_LABELS } from '../model/labels'

type Props = { pokemon: PokemonSummary }

// DESIGN.md §5.1: 카드 본문은 상세로 이동, 즐겨찾기 버튼은 이동하지 않는다.
export function PokemonCard({ pokemon }: Props) {
  const name = displayName(pokemon)
  const urls = pokemonImageUrls(pokemon.id)
  const [imageIndex, setImageIndex] = useState(0)
  const imageUrl = urls[imageIndex]

  return (
    <article className="pokemon-card">
      <Link to={pokemonDetailPath(pokemon.id)} className="pokemon-card__link">
        <span className="pokemon-card__number">{formatDexNumber(pokemon.id)}</span>
        <span className="pokemon-card__image">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              onError={() => setImageIndex((i) => i + 1)}
            />
          ) : (
            <span className="pokemon-card__placeholder" role="img" aria-label={`${name} 이미지 없음`} />
          )}
        </span>
        <span className="pokemon-card__name">{name}</span>
        <span className="pokemon-card__types">
          {pokemon.types.map((type) => (
            <span key={type} className={`type-chip type-chip--${type} type-chip--small`}>
              {TYPE_LABELS[type]}
            </span>
          ))}
        </span>
      </Link>
      <div className="pokemon-card__favorite">
        <FavoriteToggle pokemonId={pokemon.id} />
      </div>
    </article>
  )
}
