import { isPokemonId } from '@/shared/models'
import type { PokemonId } from '@/shared/models'
import type { RawEvolutionNode } from '../api/pokeapi'
import { idFromResourceUrl } from '../api/pokeapi'

export type EvolutionNode = {
  id: PokemonId
  /** PokéAPI species 식별자 (인덱스에 이름이 없을 때 대체 표시용) */
  speciesName: string
  /** 레벨업 진화일 때의 최소 레벨. 다른 조건은 표시하지 않는다 */
  minLevel?: number
  children: EvolutionNode[]
}

/**
 * evolution-chain 응답 → 지원 범위(#1~#721) 진화 트리 (ADR-008).
 * #722 이후 종(예: 킹갬브릿 #983)은 그 아래 가지까지 함께 제외한다. 루트가 범위 밖이면 null.
 */
export function toEvolutionTree(raw: RawEvolutionNode): EvolutionNode | null {
  const id = idFromResourceUrl(raw.species.url)
  if (id == null || !isPokemonId(id)) return null
  const levelUp = raw.evolution_details.find((d) => d.trigger.name === 'level-up' && d.min_level != null)
  return {
    id,
    speciesName: raw.species.name,
    minLevel: levelUp?.min_level ?? undefined,
    children: raw.evolves_to.map(toEvolutionTree).filter((node): node is EvolutionNode => node !== null),
  }
}

/** 진화하지 않는 종(트리가 자기 자신 하나뿐)인지 */
export function isSingleStage(tree: EvolutionNode): boolean {
  return tree.children.length === 0
}
