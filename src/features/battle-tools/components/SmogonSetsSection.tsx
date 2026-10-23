import type { PokemonId } from '@/shared/models'

type Props = { pokemonId: PokemonId }

// FR-17~18 실전 추천 세팅 — TASK-007에서 구현. 폼 매핑 실패 시 임의 세팅을 표시하지 않는다.
export function SmogonSetsSection({ pokemonId }: Props) {
  return (
    <section aria-label="실전 추천 세팅" data-pokemon-id={pokemonId}>
      실전 추천 세팅 (TASK-007)
    </section>
  )
}
