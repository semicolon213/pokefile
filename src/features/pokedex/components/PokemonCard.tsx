import { useState } from 'react'
import { Link } from 'react-router'
import { FavoriteToggle } from '@/features/favorites'
import { pokemonDetailPath } from '@/features/pokemon-detail'
import type { PokemonSummary } from '@/shared/models'
import { TypeBadge, fitPixelArt } from '@/shared/ui'
import { displayName, formatDexNumber } from '@/shared/utils'
import { pokemonImageUrls } from '../model/image'
import './PokemonCard.css'

type Props = { pokemon: PokemonSummary }

/** 스프라이트 원판(104px) 안의 상자. 픽셀 아트는 이 안에서 정수배로만 키우고, 더 크면 96px PNG(1배)로 바꾼다. */
const SPRITE_BOX = 96

// DESIGN.md §5.1: 카드 본문은 상세로 이동, 즐겨찾기 버튼은 이동하지 않는다.
export function PokemonCard({ pokemon }: Props) {
  const name = displayName(pokemon)
  const urls = pokemonImageUrls(pokemon.id)
  const [imageIndex, setImageIndex] = useState(0)
  const imageUrl = urls[imageIndex]

  return (
    <article className="pokemon-card">
      <Link to={pokemonDetailPath(pokemon.id)} className="pokemon-card__link">
        <span className="pokemon-card__number tabular">{formatDexNumber(pokemon.id)}</span>
        <span className="pokemon-card__plate" aria-hidden="true">
          {imageUrl ? (
            // 이름이 링크 텍스트로 이미 있으므로 이미지는 장식으로 둔다 (이름 중복 낭독 방지)
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onLoad={(e) => {
                if (!fitPixelArt(e.currentTarget, SPRITE_BOX)) setImageIndex((i) => i + 1)
              }}
              onError={() => setImageIndex((i) => i + 1)}
            />
          ) : (
            <span className="pokemon-card__placeholder" />
          )}
        </span>
        <span className="pokemon-card__name">{name}</span>
        <span className="pokemon-card__types">
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} size="sm" />
          ))}
        </span>
      </Link>
      <div className="pokemon-card__favorite">
        <FavoriteToggle pokemonId={pokemon.id} />
      </div>
    </article>
  )
}
