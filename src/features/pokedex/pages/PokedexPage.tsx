import { useMemo } from 'react'
import { ErrorState } from '@/shared/ui'
import { GenerationNav } from '../components/GenerationNav'
import { PokemonGrid } from '../components/PokemonGrid'
import { SearchForm } from '../components/SearchForm'
import { SortSelect } from '../components/SortSelect'
import { TypeFilter } from '../components/TypeFilter'
import { usePokedexFilters } from '../hooks/usePokedexFilters'
import { useSearchIndex } from '../hooks/useSearchIndex'
import { applyFilters, countByGeneration, isDefaultFilters, toSearchParams } from '../model/filters'
import './PokedexPage.css'

const SKELETON_COUNT = 8

// UI-01 메인/검색·목록 — 검색(TASK-003), 필터·정렬·무한 스크롤·URL 동기화(TASK-004)
export function PokedexPage() {
  const index = useSearchIndex()
  const { filters, update, reset } = usePokedexFilters()
  const all = index.data
  const results = useMemo(() => (all ? applyFilters(all, filters) : []), [all, filters])
  const genCounts = useMemo(() => (all ? countByGeneration(all) : null), [all])
  const filtered = !isDefaultFilters(filters)
  // 필터가 바뀌면 목록을 처음(첫 묶음)부터 다시 보여준다
  const listKey = toSearchParams(filters).toString()

  return (
    <section className="pokedex" aria-labelledby="pokedex-title">
      <header className="pokedex-hero">
        <div className="pokedex-hero__text">
          <p className="pokedex-hero__eyebrow">PokeFile Pokédex</p>
          <h1 id="pokedex-title" className="pokedex-hero__title">
            포켓몬 도감
          </h1>
          <p className="pokedex-hero__lead">
            이름이나 도감 번호로 찾고, 종족값·진화·실전 세팅까지 한 번에 확인하세요.
          </p>
          {/* 뒤로 가기 등으로 URL의 검색어가 바뀌면 입력창도 맞춘다 */}
          <SearchForm
            key={filters.q}
            initialQuery={filters.q}
            disabled={!index.isSuccess}
            onSearch={(q) => update({ q })}
          />
        </div>
        <div className="pokedex-hero__ball" aria-hidden="true" />
      </header>

      {index.isPending && (
        <div className="pokedex-results">
          <p role="status" aria-live="polite" className="pokedex-results__status">
            포켓몬을 불러오는 중입니다.
          </p>
          <ul className="pokedex-grid" aria-hidden="true">
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <li key={i} className="pokedex-card-skeleton">
                <div className="pokedex-card-skeleton__image" />
                <div className="pokedex-card-skeleton__line pokedex-card-skeleton__line--short" />
                <div className="pokedex-card-skeleton__line" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {index.isError && (
        <div className="pokedex-results__error">
          <ErrorState message="포켓몬 정보를 불러오지 못했습니다." />
          <button type="button" className="pokedex-button" onClick={() => void index.refetch()}>
            다시 시도
          </button>
        </div>
      )}

      {all && genCounts && (
        <div className="pokedex-body">
          <GenerationNav
            selected={filters.gen}
            counts={genCounts}
            total={all.length}
            onSelect={(gen) => update({ gen })}
          />

          <div className="pokedex-results">
            <TypeFilter selected={filters.type} onSelect={(type) => update({ type })} />

            <div className="pokedex-results__head">
              <h2 className="pokedex-section-title">포켓몬 목록</h2>
              <p role="status" aria-live="polite" className="pokedex-results__count">
                {filtered ? `검색 결과 ${results.length}마리` : `전체 ${results.length}마리`}
              </p>
              <SortSelect value={filters.sort} onChange={(sort) => update({ sort })} />
            </div>

            {results.length > 0 ? (
              <PokemonGrid key={listKey} pokemon={results} />
            ) : (
              <div className="pokedex-results__empty">
                <p>검색 결과가 없습니다. 검색어나 필터를 확인해 주세요.</p>
                <button type="button" className="pokedex-button" onClick={reset}>
                  검색어·필터 초기화
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
