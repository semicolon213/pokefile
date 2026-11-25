import { useId, useMemo, useState } from 'react'
import type { Loadable, PokemonId } from '@/shared/models'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui'
import { useSmogonGenerations } from '../hooks/useSmogonSets'
import { selectSmogonSets } from '../model/smogon'
import type { SmogonIdentity } from '../model/smogon'
import { SmogonSetCard } from './SmogonSetCard'
import './SmogonSetsSection.css'

type Props = {
  pokemonId: PokemonId
  identity?: Loadable<SmogonIdentity>
  onRetryIdentity?: () => void
}

// FR-17~18 / TC-06: 상세 화면이 확정한 종·폼만 표시한다. 이전 호출부와의 호환을 위해 identity는 선택적이다.
export function SmogonSetsSection({ pokemonId, identity, onRetryIdentity }: Props) {
  return (
    <section className="detail-section smogon-section" aria-label="실전 추천 세팅" data-pokemon-id={pokemonId}>
      <h2>실전 추천 세팅</h2>
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
  const queries = useSmogonGenerations(identity.formKey)
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null)
  const id = useId()
  const available = useMemo(() => queries.map(({ generation, query }) => ({
    generation,
    formats: selectSmogonSets(query.data ?? [], identity, generation),
  })).filter(({ formats }) => formats.length > 0), [queries, identity])
  const selected = available.find(({ generation }) => generation === selectedGeneration) ?? available[0]
  const pending = queries.some(({ query }) => query.isPending)
  const failed = queries.filter(({ query }) => query.isError)
  // D-02 / TC-09: 더 최신 세대가 아직 대기 중이면 기본 세대를 확정하지 않는다.
  const waitingForLatest = selectedGeneration === null && queries.some(({ generation, query }) =>
    query.isPending && (!selected || generation > selected.generation))
  const visible = waitingForLatest ? undefined : selected

  return (
    <>
      {pending && <LoadingState message={visible
        ? '다른 세대의 실전 세팅을 불러오는 중입니다.'
        : '실전 세팅을 불러오는 중입니다.'} />}
      {failed.map(({ generation, query }) => (
        <div className="smogon-error" key={generation}>
          <ErrorState message={`${generation}세대 실전 세팅을 불러오지 못했습니다.`} />
          <button type="button" onClick={() => void query.refetch()}>{generation}세대 다시 시도</button>
        </div>
      ))}
      {visible ? (
        <>
          <div className="smogon-generations" role="tablist" aria-label="실전 세팅 세대">
            {available.map(({ generation }, index) => (
              <button key={generation} type="button" role="tab"
                id={`${id}-gen${generation}`} aria-controls={`${id}-panel`}
                aria-selected={visible.generation === generation}
                tabIndex={visible.generation === generation ? 0 : -1}
                onClick={() => setSelectedGeneration(generation)}
                onKeyDown={(event) => {
                  let next = index
                  if (event.key === 'ArrowRight') next = (index + 1) % available.length
                  else if (event.key === 'ArrowLeft') next = (index - 1 + available.length) % available.length
                  else if (event.key === 'Home') next = 0
                  else if (event.key === 'End') next = available.length - 1
                  else return
                  event.preventDefault()
                  setSelectedGeneration(available[next].generation)
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
                }}
              >{generation}세대</button>
            ))}
          </div>
          <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-gen${visible.generation}`}>
            <p className="smogon-source">Smogon · {visible.generation}세대</p>
            <SmogonFormats key={visible.generation} formats={visible.formats}
              onSelectFormat={() => setSelectedGeneration(visible.generation)} />
          </div>
        </>
      ) : !pending && failed.length === 0 ? <EmptyState message="등록된 실전 세팅이 없습니다." /> : null}
    </>
  )
}

function SmogonFormats({ formats, onSelectFormat }: {
  formats: ReturnType<typeof selectSmogonSets>
  onSelectFormat: () => void
}) {
  const [selectedFormat, setSelectedFormat] = useState('')
  const selected = formats.find((entry) => entry.format === selectedFormat)

  // OQ-19는 미결정이다. 기본 포맷을 임의로 정하지 않고 사용자에게 선택을 맡긴다.
  return (
    <>
      <label className="smogon-format">
        대전 포맷
        <select value={selected?.format ?? ''} onChange={(event) => {
          setSelectedFormat(event.target.value)
          onSelectFormat()
        }}>
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
