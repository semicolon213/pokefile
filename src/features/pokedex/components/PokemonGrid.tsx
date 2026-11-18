import { useEffect } from 'react'
import type { PokemonSummary } from '@/shared/models'
import { rememberVisibleCount, savedVisibleCount } from '@/shared/state'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { PAGE_SIZE } from '../model/filters'
import { formatRegionalNumber, type RegionalEntry } from '../model/regional'
import { STAT_LABELS, statValue, type StatKey } from '../model/stats'
import { PokemonCard } from './PokemonCard'

/**
 * listKey: 목록 주소(필터 쿼리). 펼친 카드 수를 이 키로 기억해 상세에서 돌아오면 그대로 다시 그린다
 * stat: 카드에 함께 보여 줄 종족값 (종족값 정렬·조건일 때, FR-34)
 */
type Props = { pokemon: PokemonSummary[]; regional?: ReadonlyMap<number, RegionalEntry>; listKey: string; stat?: StatKey }

export function PokemonGrid({ pokemon, regional, listKey, stat }: Props) {
  const { visibleCount, hasMore, sentinelRef } = useInfiniteScroll(pokemon.length, PAGE_SIZE, savedVisibleCount(listKey))
  useEffect(() => rememberVisibleCount(listKey, visibleCount), [listKey, visibleCount])

  return (
    <>
      <ul className="pokedex-grid">
        {pokemon.slice(0, visibleCount).map((p) => {
          const entry = regional?.get(p.id)
          const value = stat ? statValue(p, stat) : null
          return (
            <li key={p.id}>
              <PokemonCard
                pokemon={p}
                regionalNumber={entry ? formatRegionalNumber(entry) : undefined}
                statLabel={stat && value !== null ? `${STAT_LABELS[stat]} ${value}` : undefined}
              />
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
