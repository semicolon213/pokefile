import type { PokemonSummary } from '@/shared/models'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { PAGE_SIZE } from '../model/filters'
import { PokemonCard } from './PokemonCard'

type Props = { pokemon: PokemonSummary[] }

export function PokemonGrid({ pokemon }: Props) {
  const { visibleCount, hasMore, sentinelRef } = useInfiniteScroll(pokemon.length, PAGE_SIZE)

  return (
    <>
      <ul className="pokedex-grid">
        {pokemon.slice(0, visibleCount).map((p) => (
          <li key={p.id}>
            <PokemonCard pokemon={p} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div ref={sentinelRef} className="pokedex-grid__sentinel" role="status" aria-live="polite">
          포켓몬을 더 불러오는 중입니다.
        </div>
      )}
    </>
  )
}
