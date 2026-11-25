import { useState } from 'react'
import { Link } from 'react-router'
import type { PokemonId, PokemonSummary } from '@/shared/models'
import { useMyGame } from '@/shared/state'
import { TYPE_LABELS } from '@/shared/ui'
import { displayName, formatDexNumber } from '@/shared/utils'
import { useConditionNames, useEvolutionTree } from '../hooks/useDetailQueries'
import type { ConditionToken, EvolutionCondition, EvolutionNode } from '../model/evolution'
import { conditionsForGame, isSingleStage, versionGroupLabel } from '../model/evolution'
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

type Names = { names: ReadonlyMap<string, string>; pending: ReadonlySet<string> }

// FR-15 진화 트리 (지원 범위 #1025 밖 진화형 제외, ADR-016). 진화는 종 단위이므로 폼 전환과 무관하다.
// FR-28 진화 조건: 레벨·돌·통신교환·친밀도·시간대·장소 등을 카드 앞에 표시한다.
// 게임마다 방법이 다르면 모두 보여 주고 기록된 게임을 붙인다. 내 게임(FR-26)을 고르면 그 게임 기록이 있는 진화는 그 방법만 보여 준다.
export function EvolutionSection({ currentId, species, index }: Props) {
  const chainId = species.status === 'success' ? species.chainId : undefined
  const query = useEvolutionTree(chainId)
  const names = useConditionNames(query.data)
  const myGame = useMyGame()
  const [showAll, setShowAll] = useState(false)
  const version = myGame && !showAll ? myGame.version : null

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
      <>
        {myGame && hasGameSpecific(query.data, myGame.version) && (
          <div className="evolution__game">
            <p>{showAll ? '모든 게임의 진화 방법입니다.' : `내 게임 ${myGame.label} 기준입니다.`}</p>
            <button type="button" onClick={() => setShowAll((v) => !v)}>
              {showAll ? `${myGame.label}만 보기` : '모든 게임 보기'}
            </button>
          </div>
        )}
        <ul className="evolution-tree" aria-label="진화 단계">
          <EvolutionBranch node={query.data} currentId={currentId} index={index} names={names} version={version} />
        </ul>
      </>
    )

  return (
    <section className="detail-section" aria-labelledby="detail-evolution-title">
      <h2 id="detail-evolution-title">진화</h2>
      {body}
    </section>
  )
}

/** 내 게임 기준으로 좁혀지는 진화가 있는지 (게임마다 방법이 다르고 내 게임 기록이 있을 때만 전환 버튼을 보여 준다) */
function hasGameSpecific(node: EvolutionNode, version: string): boolean {
  const own = node.conditions.length > 1 && conditionsForGame(node.conditions, version).matched
  return own || node.children.some((child) => hasGameSpecific(child, version))
}

function EvolutionBranch({
  node,
  currentId,
  index,
  names,
  version,
}: {
  node: EvolutionNode
  currentId: PokemonId
  index: ReadonlyMap<PokemonId, PokemonSummary>
  names: Names
  version: string | null
}) {
  const { conditions, matched } = conditionsForGame(node.conditions, version)
  // 방법마다 기록된 게임이 다를 때만 게임 이름을 붙인다 (모든 방법이 같은 게임이면 생략)
  const showGames = !matched && new Set(conditions.map((c) => c.versionGroups.join())).size > 1
  const summary = index.get(node.id)
  const name = summary ? displayName(summary) : node.speciesName
  const isCurrent = node.id === currentId

  return (
    <li className="evolution-tree__item">
      {conditions.length > 0 && (
        <span className="evolution-tree__condition">
          {conditions.map((condition, i) => (
            <span key={i} className="evolution-tree__condition-line">
              {i > 0 && '또는 '}
              {conditionText(condition.parts, index, names)}
              {showGames && condition.versionGroups.length > 0 && (
                <span className="evolution-tree__games">{condition.versionGroups.map(versionGroupLabel).join(', ')}</span>
              )}
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
            <EvolutionBranch key={child.id} node={child} currentId={currentId} index={index} names={names} version={version} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** 받침이 있으면 consonant, 없으면 vowel. 한글이 아니면 둘 다 보여 준다 (예: 와(과)) */
function josa(previous: string, consonant: string, vowel: string): string {
  const code = previous.trim().charCodeAt(previous.trim().length - 1) - 0xac00
  if (Number.isNaN(code) || code < 0 || code > 11171) return `${vowel}(${consonant})`
  return code % 28 === 0 ? vowel : consonant
}

/** 조건 → 표시 문자열. 이름 참조는 한국어 이름으로, 조회 중이면 '…', 조회에 실패하면 API 식별자로 표시한다 */
function conditionText(
  condition: EvolutionCondition,
  index: ReadonlyMap<PokemonId, PokemonSummary>,
  { names, pending }: Names,
): string {
  const token = (t: Exclude<ConditionToken, { kind: 'josa' }>): string => {
    if (typeof t === 'string') return t
    if (t.kind === 'type') return TYPE_LABELS[t.type]
    if (t.kind === 'species') {
      const summary = t.id != null ? index.get(t.id) : undefined
      return summary ? displayName(summary) : t.name
    }
    const key = `${t.kind}:${t.name}`
    return names.get(key) ?? (pending.has(key) ? '…' : t.name)
  }
  return condition
    .map((part) =>
      part.reduce<string>(
        (text, t) => (typeof t !== 'string' && t.kind === 'josa' ? text + josa(text, t.consonant, t.vowel) : text + token(t)),
        '',
      ),
    )
    .join(' · ')
}
