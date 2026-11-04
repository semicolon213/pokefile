import { useEffect } from 'react'
import type { PokemonSummary } from '@/shared/models'
import { rememberVisibleCount, savedVisibleCount } from '@/shared/state'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { PAGE_SIZE } from '../model/filters'
import { formatRegionalNumber, type RegionalEntry } from '../model/regional'
import { PokemonCard } from './PokemonCard'

/** listKey: 목록 주소(필터 쿼리). 펼친 카드 수를 이 키로 기억해 상세에서 돌아오면 그대로 다시 그린다 */
type Props = { pokemon: PokemonSummary[]; regional?: ReadonlyMap<number, RegionalEntry>; listKey: string }

export function PokemonGrid({ pokemon, regional, listKey }: Props) {
  const { visibleCount, hasMore, sentinelRef } = useInfiniteScroll(pokemon.length, PAGE_SIZE, savedVisibleCount(listKey))
  useEffect(() => rememberVisibleCount(listKey, visibleCount), [listKey, visibleCount])

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
