import { useState } from 'react'
import { Link } from 'react-router'
import { FavoriteToggle } from '@/features/favorites'
import { pokemonDetailPath } from '@/features/pokemon-detail'
import type { PokemonSummary } from '@/shared/models'
import { TypeBadge } from '@/shared/ui'
import { displayName, formatDexNumber } from '@/shared/utils'
import { pokemonImageUrls } from '../model/image'
import './PokemonCard.css'

/** regionalNumber: 지방을 골랐을 때 지방 번호('성도 #010', FR-31) */
type Props = { pokemon: PokemonSummary; regionalNumber?: string }

/**
 * 스프라이트 원판(104px) 안의 상자. 목록에서는 키우지 않고 원본 크기(1배)로 보여 포켓몬끼리 크기 비율을 지킨다.
 * 상자보다 큰 GIF(실측 1011개 중 292개)는 PNG로 바꾸지 않고 상자에 맞게 줄여 움직임을 유지한다(줄일 때만 부드럽게 보간).
 */
const SPRITE_BOX = 96

// DESIGN.md §5.1: 카드 본문은 상세로 이동, 즐겨찾기 버튼은 이동하지 않는다.
export function PokemonCard({ pokemon, regionalNumber }: Props) {
  const name = displayName(pokemon)
  const urls = pokemonImageUrls(pokemon.id)
  const [imageIndex, setImageIndex] = useState(0)
  const imageUrl = urls[imageIndex]

  return (
    <article className="pokemon-card">
      <Link to={pokemonDetailPath(pokemon.id)} className="pokemon-card__link">
        <span className="pokemon-card__number tabular">
          {regionalNumber ? (
            <>
              <span className="pokemon-card__regional">{regionalNumber}</span>
              <span className="pokemon-card__national">{formatDexNumber(pokemon.id)}</span>
            </>
          ) : (
            formatDexNumber(pokemon.id)
          )}
        </span>
        <span className="pokemon-card__plate" aria-hidden="true">
          {imageUrl ? (
            // 이름이 링크 텍스트로 이미 있으므로 이미지는 장식으로 둔다 (이름 중복 낭독 방지)
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onLoad={(e) => {
                const img = e.currentTarget
                img.dataset.downscaled = String(Math.max(img.naturalWidth, img.naturalHeight) > SPRITE_BOX)
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
