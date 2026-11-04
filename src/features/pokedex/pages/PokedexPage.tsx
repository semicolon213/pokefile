import { useMemo } from 'react'
import { GENERATIONS } from '@/shared/models'
import { useMyGame } from '@/shared/state'
import { ErrorState, GENERATION_LABELS, useDocumentTitle } from '@/shared/ui'
import { GenerationNav } from '../components/GenerationNav'
import { PokemonGrid } from '../components/PokemonGrid'
import { SortSelect } from '../components/SortSelect'
import { TypeFilter } from '../components/TypeFilter'
import { usePokedexFilters } from '../hooks/usePokedexFilters'
import { useRegionalDexes, useSearchIndex } from '../hooks/useSearchIndex'
import { applyFilters, countByGeneration, isDefaultFilters, toSearchParams } from '../model/filters'
import { dexesFor, editionLabel, regionalOrder } from '../model/regional'
import './PokedexPage.css'

const SKELETON_COUNT = 12

// UI-01 메인/검색·목록 — 검색어는 상단 바(HeaderSearch)에서, 필터·정렬·무한 스크롤은 이 화면에서 (TASK-003·004)
export function PokedexPage() {
  useDocumentTitle('포켓몬 도감')
  const index = useSearchIndex()
  const { filters, update, reset } = usePokedexFilters()
  const all = index.data
  const dexData = useRegionalDexes().data
  const myGame = useMyGame()
  // 지방을 고르면 그 지방 도감 전체를 지방 번호 순으로 (FR-31, ADR-017). 판은 내 게임을 따른다.
  const dexes = filters.gen ? dexesFor(filters.gen, myGame) : null
  const regional = useMemo(() => (dexes && dexData ? regionalOrder(dexes, dexData) : undefined), [dexes, dexData])
  const results = useMemo(() => (all ? applyFilters(all, filters, regional) : []), [all, filters, regional])
  const genCounts = useMemo(() => {
    if (!all) return null
    if (!dexData) return countByGeneration(all)
    return Object.fromEntries(GENERATIONS.map((g) => [g, regionalOrder(dexesFor(g, myGame), dexData).size]))
  }, [all, dexData, myGame])
  const edition = dexes && regional ? editionLabel(dexes) : ''
  const filtered = !isDefaultFilters(filters)
  // 필터가 바뀌면 목록을 처음(첫 묶음)부터 다시 보여준다
  const listKey = toSearchParams(filters).toString()

  return (
    <div className="pokedex">
      <h1 className="visually-hidden">포켓몬 도감</h1>

      {index.isPending && (
        <div className="pokedex-loading">
          <p role="status" aria-live="polite" className="pokedex-status">
            포켓몬을 불러오는 중입니다.
          </p>
          <ul className="pokedex-grid" aria-hidden="true">
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <li key={i} className="pokedex-card-skeleton">
                <div className="pokedex-card-skeleton__plate" />
                <div className="pokedex-card-skeleton__line" />
                <div className="pokedex-card-skeleton__line pokedex-card-skeleton__line--short" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {index.isError && (
        <div className="pokedex-error">
          <ErrorState message="포켓몬 정보를 불러오지 못했습니다." />
          <button type="button" className="button" onClick={() => void index.refetch()}>
            다시 시도
          </button>
        </div>
      )}

      {all && genCounts && (
        <div className="pokedex-layout">
          <GenerationNav
            selected={filters.gen}
            counts={genCounts}
            total={all.length}
            onSelect={(gen) => update({ gen })}
          />

          <section className="pokedex-results" aria-labelledby="pokedex-results-title">
            <h2 id="pokedex-results-title" className="visually-hidden">
              포켓몬 목록
            </h2>
            <TypeFilter selected={filters.types} onChange={(types) => update({ types })} />

            <div className="pokedex-toolbar">
              <p role="status" aria-live="polite" className="pokedex-count">
                {filtered ? '검색 결과 ' : ''}
                <b className="tabular">{results.length}</b>
                {filtered ? '마리' : '마리의 포켓몬'}
              </p>
              <SortSelect value={filters.sort} regional={!!regional} onChange={(sort) => update({ sort })} />
            </div>
            {filters.gen && regional && (
              <p className="pokedex-edition">
                {GENERATION_LABELS[filters.gen].region} 도감 전체 · {edition ? `${edition} 기준` : '지방 도감 기준'}
                {!myGame || !myGame.dexes.every((d) => dexes?.includes(d)) ? ' (내 게임을 고르면 그 게임의 도감으로 바뀝니다)' : ''}
              </p>
            )}

            {results.length > 0 ? (
              <PokemonGrid key={listKey} pokemon={results} regional={regional} />
            ) : (
              <div className="pokedex-empty">
                <p>검색 결과가 없습니다. 검색어나 필터를 확인해 주세요.</p>
                <button type="button" className="button" onClick={reset}>
                  검색어·필터 초기화
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
