import { useParams } from 'react-router'
import { SmogonSetsSection } from '@/features/battle-tools'
import { FavoriteToggle } from '@/features/favorites'
import { ErrorState } from '@/shared/ui'

// UI-02 포켓몬 상세 — TASK-005, TASK-006에서 구현
export function PokemonDetailPage() {
  const { id } = useParams()
  const pokemonId = Number(id)

  if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
    return <ErrorState message="올바르지 않은 포켓몬 번호입니다." />
  }

  return (
    <article aria-labelledby="detail-title">
      <header>
        <h1 id="detail-title">포켓몬 #{pokemonId}</h1>
        <FavoriteToggle pokemonId={pokemonId} />
      </header>
      <section aria-label="기본 정보">기본 정보·종족값 차트 (TASK-005)</section>
      <section aria-label="진화">진화 트리 (TASK-006)</section>
      <section aria-label="출현 장소">출현 장소 (TASK-006)</section>
      <SmogonSetsSection pokemonId={pokemonId} />
    </article>
  )
}
