import { Link } from 'react-router'
import type { PokemonId, PokemonSummary } from '@/shared/models'
import { displayName, formatDexNumber } from '@/shared/utils'
import { useEvolutionTree } from '../hooks/useDetailQueries'
import type { EvolutionNode } from '../model/evolution'
import { isSingleStage } from '../model/evolution'
import { pokemonDetailPath } from '../paths'
import { showdownImageUrls } from '../model/images'
import { PokemonImage } from './PokemonImage'
import { SectionState } from './SectionState'

type Props = {
  currentId: PokemonId
  /** species 응답의 체인 ID. species 조회 상태에 따라 로딩·오류를 함께 표시한다 */
  species: { status: 'pending' | 'error' | 'success'; chainId?: number | null; retry: () => void }
  /** 한국어 이름 조회용. 없으면 API 식별자를 표시한다 */
  index: ReadonlyMap<PokemonId, PokemonSummary>
}

// FR-15 진화 트리 (#722 이후 진화형 제외, ADR-008). 진화는 종 단위이므로 폼 전환과 무관하다.
export function EvolutionSection({ currentId, species, index }: Props) {
  const chainId = species.status === 'success' ? species.chainId : undefined
  const query = useEvolutionTree(chainId)

  let body
  if (species.status === 'error')
    body = <SectionState status="error" message="진화 정보를 불러오지 못했습니다." onRetry={species.retry} />
  else if (chainId === null) body = <SectionState status="empty" message="진화 정보가 없습니다." />
  else if (query.isPending) body = <SectionState status="loading" message="진화 정보를 불러오는 중입니다." />
  else if (query.isError)
    body = (
      <SectionState status="error" message="진화 정보를 불러오지 못했습니다." onRetry={() => void query.refetch()} />
    )
  else if (!query.data || isSingleStage(query.data))
    body = <SectionState status="empty" message="진화하지 않는 포켓몬입니다." />
  else
    body = (
      <ul className="evolution-tree" aria-label="진화 단계">
        <EvolutionBranch node={query.data} currentId={currentId} index={index} />
      </ul>
    )

  return (
    <section className="detail-section" aria-labelledby="detail-evolution-title">
      <h2 id="detail-evolution-title">진화</h2>
      {body}
    </section>
  )
}

function EvolutionBranch({
  node,
  currentId,
  index,
}: {
  node: EvolutionNode
  currentId: PokemonId
  index: ReadonlyMap<PokemonId, PokemonSummary>
}) {
  const summary = index.get(node.id)
  const name = summary ? displayName(summary) : node.speciesName
  const isCurrent = node.id === currentId

  return (
    <li className="evolution-tree__item">
      {node.minLevel != null && <span className="evolution-tree__condition">Lv.{node.minLevel}</span>}
      <Link
        to={pokemonDetailPath(node.id)}
        className="evolution-tree__card"
        aria-current={isCurrent ? 'page' : undefined}
      >
        <PokemonImage urls={showdownImageUrls(node.id)} alt={name} className="evolution-tree__image" box={96} upscale={false} />
        <span className="evolution-tree__number">{formatDexNumber(node.id)}</span>
        <span className="evolution-tree__name">{name}</span>
      </Link>
      {node.children.length > 0 && (
        <ul className="evolution-tree__children">
          {node.children.map((child) => (
            <EvolutionBranch key={child.id} node={child} currentId={currentId} index={index} />
          ))}
        </ul>
      )}
    </li>
  )
}
