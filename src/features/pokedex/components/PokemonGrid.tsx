import type { PokemonSummary } from '@/shared/models'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { PAGE_SIZE } from '../model/filters'
import { formatRegionalNumber, type RegionalEntry } from '../model/regional'
import { PokemonCard } from './PokemonCard'

type Props = { pokemon: PokemonSummary[]; regional?: ReadonlyMap<number, RegionalEntry> }

export function PokemonGrid({ pokemon, regional }: Props) {
  const { visibleCount, hasMore, sentinelRef } = useInfiniteScroll(pokemon.length, PAGE_SIZE)

  return (
    <>
      <ul className="pokedex-grid">
        {pokemon.slice(0, visibleCount).map((p) => {
          const entry = regional?.get(p.id)
          return (
            <li key={p.id}>
              <PokemonCard pokemon={p} regionalNumber={entry ? formatRegionalNumber(entry) : undefined} />
            </li>
          )
        })}
      </ul>
      {hasMore && (
        <div ref={sentinelRef} className="pokedex-grid__sentinel" role="status" aria-live="polite">
          포켓몬을 더 불러오는 중입니다.
        </div>
      )}
    </>
  )
}
