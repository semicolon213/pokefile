import { Link } from 'react-router'
import { pokemonDetailPath } from '@/features/pokemon-detail'
import './PokedexPage.css'

// 필터 영역 미리보기용 정적 목록. 실제 필터 데이터는 TASK-004에서 API 기반으로 교체한다.
const TYPE_PREVIEW = [
  { key: 'normal', label: '노말' },
  { key: 'fire', label: '불꽃' },
  { key: 'water', label: '물' },
  { key: 'grass', label: '풀' },
  { key: 'electric', label: '전기' },
  { key: 'ice', label: '얼음' },
  { key: 'fighting', label: '격투' },
  { key: 'poison', label: '독' },
  { key: 'ground', label: '땅' },
  { key: 'flying', label: '비행' },
  { key: 'psychic', label: '에스퍼' },
  { key: 'bug', label: '벌레' },
  { key: 'rock', label: '바위' },
  { key: 'ghost', label: '고스트' },
  { key: 'dragon', label: '드래곤' },
  { key: 'dark', label: '악' },
  { key: 'steel', label: '강철' },
  { key: 'fairy', label: '페어리' },
]

const SKELETON_COUNT = 8

// UI-01 메인/검색·목록 — 검색·필터·카드 목록 동작은 TASK-003, TASK-004에서 구현
export function PokedexPage() {
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

          <form className="pokedex-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="pokedex-search-input" className="visually-hidden">
              포켓몬 검색
            </label>
            <input
              id="pokedex-search-input"
              className="pokedex-search__input"
              type="search"
              placeholder="피카츄, pikachu, 25…"
              disabled
              aria-describedby="pokedex-search-hint"
            />
            <button type="submit" className="pokedex-search__button" disabled>
              검색
            </button>
          </form>
          <p id="pokedex-search-hint" className="pokedex-search__hint">
            검색 기능은 준비 중입니다.
          </p>
        </div>

        <div className="pokedex-hero__ball" aria-hidden="true" />
      </header>

      <section className="pokedex-filters" aria-labelledby="pokedex-types-title">
        <h2 id="pokedex-types-title" className="pokedex-section-title">
          타입
        </h2>
        <ul className="pokedex-types">
          {TYPE_PREVIEW.map((type) => (
            <li key={type.key} className={`type-chip type-chip--${type.key}`}>
              {type.label}
            </li>
          ))}
        </ul>
      </section>

      <div className="pokedex-results">
        <div className="pokedex-results__head">
          <h2 className="pokedex-section-title">포켓몬 목록</h2>
          <Link to={pokemonDetailPath(25)} className="pokedex-results__link">
            상세 페이지 연결 확인용 링크 (#25) →
          </Link>
        </div>
        <ul className="pokedex-grid" aria-label="카드 목록 자리 (구현 예정)">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <li key={i} className="pokedex-card-skeleton" aria-hidden="true">
              <div className="pokedex-card-skeleton__image" />
              <div className="pokedex-card-skeleton__line pokedex-card-skeleton__line--short" />
              <div className="pokedex-card-skeleton__line" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
