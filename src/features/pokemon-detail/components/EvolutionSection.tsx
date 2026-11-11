import { Link } from 'react-router'
import type { PokemonId, PokemonSummary } from '@/shared/models'
import { TYPE_LABELS } from '@/shared/ui'
import { displayName, formatDexNumber } from '@/shared/utils'
import { useConditionNames, useEvolutionTree } from '../hooks/useDetailQueries'
import type { ConditionToken, EvolutionCondition, EvolutionNode } from '../model/evolution'
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
// FR-28 진화 조건: 레벨·돌·통신교환·친밀도·시간대·장소 등을 카드 앞에 표시한다(최신 게임 기준).
export function EvolutionSection({ currentId, species, index }: Props) {
  const chainId = species.status === 'success' ? species.chainId : undefined
  const query = useEvolutionTree(chainId)
  const names = useConditionNames(query.data)

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
        <EvolutionBranch node={query.data} currentId={currentId} index={index} names={names} />
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
  names,
}: {
  node: EvolutionNode
  currentId: PokemonId
  index: ReadonlyMap<PokemonId, PokemonSummary>
  names: ReadonlyMap<string, string>
}) {
  const summary = index.get(node.id)
  const name = summary ? displayName(summary) : node.speciesName
  const isCurrent = node.id === currentId

  return (
    <li className="evolution-tree__item">
      {node.conditions.length > 0 && (
        <span className="evolution-tree__condition">
          {node.conditions.map((condition, i) => (
            <span key={i} className="evolution-tree__condition-line">
              {i > 0 && '또는 '}
              {conditionText(condition, index, names)}
            </span>
          ))}
        </span>
      )}
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
            <EvolutionBranch key={child.id} node={child} currentId={currentId} index={index} names={names} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** 조건 → 표시 문자열. 이름 참조는 한국어 이름으로, 아직 없으면 API 식별자로 표시한다 */
function conditionText(
  condition: EvolutionCondition,
  index: ReadonlyMap<PokemonId, PokemonSummary>,
  names: ReadonlyMap<string, string>,
): string {
  const token = (t: ConditionToken): string => {
    if (typeof t === 'string') return t
    if (t.kind === 'type') return TYPE_LABELS[t.type]
    if (t.kind === 'species') {
      const summary = t.id != null ? index.get(t.id) : undefined
      return summary ? displayName(summary) : t.name
    }
    return names.get(`${t.kind}:${t.name}`) ?? t.name
  }
  return condition.map((part) => part.map(token).join('')).join(' · ')
}
