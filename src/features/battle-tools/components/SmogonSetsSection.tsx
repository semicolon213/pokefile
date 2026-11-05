import { useMemo, useState } from 'react'
import type { Loadable, PokemonId } from '@/shared/models'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui'
import { useSmogonSets } from '../hooks/useSmogonSets'
import { selectSmogonSets } from '../model/smogon'
import type { SmogonIdentity } from '../model/smogon'
import { SmogonSetCard } from './SmogonSetCard'
import { PokemonToolsSection } from './PokemonToolsSection'
import './SmogonSetsSection.css'

type Props = {
  pokemonId: PokemonId
  identity?: Loadable<SmogonIdentity>
  onRetryIdentity?: () => void
}

// FR-17~18 / TC-06: 상세 화면이 확정한 종·폼만 표시한다. 이전 호출부와의 호환을 위해 identity는 선택적이다.
export function SmogonSetsSection({ pokemonId, identity, onRetryIdentity }: Props) {
  return <>
    <SmogonSetsContent pokemonId={pokemonId} identity={identity} onRetryIdentity={onRetryIdentity} />
    {identity?.status === 'success' && <PokemonToolsSection pokemonId={pokemonId} {...identity.data} />}
  </>
}

function SmogonSetsContent({ pokemonId, identity, onRetryIdentity }: Props) {
  return (
    <section className="detail-section smogon-section" aria-label="실전 추천 세팅" data-pokemon-id={pokemonId}>
      <h2>실전 추천 세팅</h2>
      <p className="smogon-source">Smogon · 6세대</p>
      {!identity || identity.status === 'loading' ? (
        <LoadingState message="포켓몬 정보를 확인하는 중입니다." />
      ) : identity.status === 'error' ? (
        <div>
          <ErrorState message="실전 세팅에 필요한 포켓몬 정보를 불러오지 못했습니다." />
          {onRetryIdentity && <button type="button" onClick={onRetryIdentity}>다시 시도</button>}
        </div>
      ) : identity.status === 'empty' ? (
        <EmptyState message="등록된 실전 세팅이 없습니다." />
      ) : (
        <SmogonSetsData key={`${pokemonId}:${identity.data.speciesName}:${identity.data.formKey}`} identity={identity.data} />
      )}
    </section>
  )
}

function SmogonSetsData({ identity }: { identity: SmogonIdentity }) {
  const query = useSmogonSets()
  const [selectedFormat, setSelectedFormat] = useState('')
  const formats = useMemo(
    () => selectSmogonSets(query.data ?? [], identity),
    [query.data, identity],
  )
  const selected = formats.find((entry) => entry.format === selectedFormat)

  if (query.isPending) return <LoadingState message="실전 세팅을 불러오는 중입니다." />
  if (query.isError) return (
    <div>
      <ErrorState message="실전 세팅을 불러오지 못했습니다." />
      <button type="button" onClick={() => void query.refetch()}>다시 시도</button>
    </div>
  )
  if (formats.length === 0) return <EmptyState message="등록된 실전 세팅이 없습니다." />

  // OQ-19는 미결정이다. 기본 포맷을 임의로 정하지 않고 사용자에게 선택을 맡긴다.
  return (
    <>
      <label className="smogon-format">
        대전 포맷
        <select value={selected?.format ?? ''} onChange={(event) => setSelectedFormat(event.target.value)}>
          <option value="">포맷을 선택하세요</option>
          {formats.map(({ format }) => <option key={format} value={format}>{format.toUpperCase()}</option>)}
        </select>
      </label>
      {selected ? (
        <>
          <p className="smogon-summary">세팅 {selected.sets.length}개 · 여러 후보는 ‘또는’으로 표시합니다.</p>
          <div className="smogon-grid">
            {selected.sets.map((set, index) => <SmogonSetCard key={`${set.name}:${index}`} set={set} />)}
          </div>
        </>
      ) : <p role="status">포맷을 선택하면 추천 세팅을 확인할 수 있습니다.</p>}
    </>
  )
}
