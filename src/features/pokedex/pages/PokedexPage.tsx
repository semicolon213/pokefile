import { useMemo, useState } from 'react'
import { ErrorState } from '@/shared/ui'
import { PokemonCard } from '../components/PokemonCard'
import { SearchForm } from '../components/SearchForm'
import { useSearchIndex } from '../hooks/useSearchIndex'
import { searchPokemon } from '../model/search'
import './PokedexPage.css'

const SKELETON_COUNT = 8

// UI-01 메인/검색·목록 — 검색(TASK-003). 필터·정렬·무한 스크롤은 TASK-004.
export function PokedexPage() {
  const index = useSearchIndex()
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchPokemon(index.data ?? [], query), [index.data, query])

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
          <SearchForm initialQuery={query} disabled={!index.isSuccess} onSearch={setQuery} />
        </div>
        <div className="pokedex-hero__ball" aria-hidden="true" />
      </header>

      <div className="pokedex-results">
        {index.isPending && (
          <>
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
          </>
        )}

        {index.isError && (
          <div className="pokedex-results__error">
            <ErrorState message="포켓몬 정보를 불러오지 못했습니다." />
            <button type="button" className="pokedex-button" onClick={() => void index.refetch()}>
              다시 시도
            </button>
          </div>
        )}

        {index.isSuccess && (
          <>
            <div className="pokedex-results__head">
              <h2 className="pokedex-section-title">포켓몬 목록</h2>
              <p role="status" aria-live="polite" className="pokedex-results__count">
                {query ? `검색 결과 ${results.length}마리` : `전체 ${results.length}마리`}
              </p>
            </div>
            {results.length > 0 ? (
              <ul className="pokedex-grid">
                {results.map((pokemon) => (
                  <li key={pokemon.id}>
                    <PokemonCard pokemon={pokemon} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pokedex-results__empty">검색 결과가 없습니다. 검색어나 필터를 확인해 주세요.</p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
