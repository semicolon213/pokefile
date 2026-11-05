import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PokemonCard, searchPokemon, useSearchIndex } from '@/features/pokedex'
import { GENERATIONS } from '@/shared/models'
import { ErrorState, GENERATION_LABELS, LoadingState, useDocumentTitle } from '@/shared/ui'
import { displayName } from '@/shared/utils'
import { CollectionToggle } from './CollectionToggle'
import { collectionProgress, collectionSpecies } from './progress'
import { useCollection } from './useCollection'
import type { CollectionSnapshot } from './storage'
import './CollectionChecklist.css'

const PAGE_SIZE = 48
type CompletionFilter = 'all' | 'caught' | 'missing'

export function CollectionChecklist() {
  useDocumentTitle('도감 체크리스트')
  const query = useSearchIndex()
  const collection = useCollection()
  const [search, setSearch] = useState('')
  const [generation, setGeneration] = useState('')
  const [completion, setCompletion] = useState<CompletionFilter>('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [resetSnapshot, setResetSnapshot] = useState<CollectionSnapshot | null>(null)
  const [resetFailed, setResetFailed] = useState(false)
  const [listRetrying, setListRetrying] = useState(false)
  const unknown = collection.knowledge === 'unknown'
  const confirmingReset = resetSnapshot === collection.snapshot
  const resetButtonRef = useRef<HTMLButtonElement>(null)
  const cancelResetRef = useRef<HTMLButtonElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const resetWasOpen = useRef(false)
  useLayoutEffect(() => {
    if (confirmingReset) cancelResetRef.current?.focus()
    else if (resetWasOpen.current) {
      const target = unknown && collection.status === 'recovered' ? resetButtonRef.current : titleRef.current
      target?.focus({ preventScroll: true })
    }
    resetWasOpen.current = confirmingReset
  }, [confirmingReset, unknown, collection.status])
  const effectiveCompletion = unknown ? 'all' : completion
  const species = useMemo(() => collectionSpecies(query.data ?? []), [query.data])
  const progress = useMemo(() => collectionProgress(species, collection.ids), [species, collection.ids])
  const caught = useMemo(() => new Set(collection.ids), [collection.ids])
  const filtered = searchPokemon(species, search).filter((pokemon) =>
    (!generation || pokemon.generation === generation)
    && (effectiveCompletion === 'all' || caught.has(pokemon.id) === (effectiveCompletion === 'caught')))

  return <section className="collection-page" aria-labelledby="collection-title">
    <header>
      <h1 id="collection-title" ref={titleRef} tabIndex={-1}>도감 체크리스트</h1>
      <p>잡은 포켓몬을 체크하고 도감 완성률을 확인하세요. 폼은 같은 종으로 기록합니다.</p>
    </header>
    {collection.message && <div className="collection-notice">
      <p role={collection.status === 'unavailable' ? 'alert' : 'status'}>{collection.message}</p>
      {collection.status === 'unavailable' && <button type="button" className="button" onClick={collection.reload}>포획 기록 다시 읽기</button>}
      {unknown && collection.status === 'recovered' && (confirmingReset ? <div role="group" aria-label="포획 기록 초기화 확인">
        <p>보존된 원본 기록을 지우고 새 도감을 시작할까요? 초기화한 기록은 되돌릴 수 없습니다.</p>
        <button ref={cancelResetRef} type="button" className="button" onClick={() => setResetSnapshot(null)}>취소</button>
        <button type="button" className="button" onClick={() => {
          setResetFailed(!collection.reset(collection.snapshot))
          setResetSnapshot(null)
        }}>초기화하고 시작</button>
      </div> : <button ref={resetButtonRef} type="button" className="button" onClick={() => {
        setResetFailed(false)
        setResetSnapshot(collection.snapshot)
      }}>기록 초기화</button>)}
    </div>}
    {resetFailed && <p role="status">저장된 기록이 바뀌었거나 저장에 실패해 초기화하지 않았습니다. 현재 기록을 다시 확인해 주세요.</p>}
    {query.isPending && !listRetrying ? <LoadingState message="도감 체크리스트를 불러오는 중입니다." />
      : query.isError || listRetrying ? <div>
        {query.isFetching || listRetrying ? <LoadingState message="도감 체크리스트를 불러오는 중입니다." />
          : <ErrorState message="도감 목록을 불러오지 못했습니다. 저장된 포획 기록은 유지됩니다." />}
        <button type="button" className="button" disabled={query.isFetching || listRetrying} onClick={() => {
          setListRetrying(true)
          void query.refetch().finally(() => setListRetrying(false))
        }}>목록 다시 시도</button>
      </div> : <>
        {unknown || collection.status === 'unavailable' ? <p role="status">저장된 기록을 확인할 수 없어 완성률을 표시하지 않습니다.</p> : <section className="collection-overview" aria-label="도감 완성률">
          <div className="collection-total">
            <h2>전체 도감</h2>
            <p role="status" className="tabular">{progress.all.completed} / {progress.all.total}마리 · {progress.all.percent}%</p>
            <progress aria-label="전체 도감 완성률" value={progress.all.completed} max={progress.all.total || 1} />
          </div>
          <ul className="collection-generations" aria-label="세대별 도감 완성률">
            {progress.generations.map((entry) => <li key={entry.generation}>
              <span>{GENERATION_LABELS[entry.generation].name} · {GENERATION_LABELS[entry.generation].region}</span>
              <span className="tabular">{entry.completed} / {entry.total}마리 · {entry.percent}%</span>
              <progress aria-label={`${GENERATION_LABELS[entry.generation].name} 도감 완성률`} value={entry.completed} max={entry.total || 1} />
            </li>)}
          </ul>
        </section>}
        <div className="collection-filters">
          <label>체크리스트 검색<input type="search" value={search} placeholder="이름 또는 도감 번호"
            onChange={(event) => { setSearch(event.target.value); setVisibleCount(PAGE_SIZE) }} /></label>
          <label>세대<select value={generation} onChange={(event) => { setGeneration(event.target.value); setVisibleCount(PAGE_SIZE) }}>
            <option value="">전체 세대</option>
            {GENERATIONS.map((id) => <option key={id} value={id}>{GENERATION_LABELS[id].name}</option>)}
          </select></label>
          <label>포획 상태<select value={effectiveCompletion} disabled={unknown} onChange={(event) => { setCompletion(event.target.value as CompletionFilter); setVisibleCount(PAGE_SIZE) }}>
            <option value="all">전체</option><option value="caught">포획 완료</option><option value="missing">미포획</option>
          </select></label>
        </div>
        <p role="status" className="collection-results tabular">검색 결과 {filtered.length}마리{unknown && ' · 포획 상태 확인 불가'}</p>
        {filtered.length ? <>
          <ul className="favorites-grid collection-grid" aria-label="도감 체크리스트 목록">
            {filtered.slice(0, visibleCount).map((pokemon) => <li key={pokemon.id}>
              <PokemonCard pokemon={pokemon} />
              <CollectionToggle pokemonId={pokemon.id} name={displayName(pokemon)} />
            </li>)}
          </ul>
          {visibleCount < filtered.length && <button type="button" className="button collection-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>포켓몬 더 보기</button>}
        </> : <p className="collection-empty">조건에 맞는 포켓몬이 없습니다.</p>}
      </>}
  </section>
}
