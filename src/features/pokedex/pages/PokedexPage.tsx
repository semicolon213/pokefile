import { Link } from 'react-router'
import { pokemonDetailPath } from '@/features/pokemon-detail'

// UI-01 메인/검색·목록 — TASK-003, TASK-004에서 구현
export function PokedexPage() {
  return (
    <section aria-labelledby="pokedex-title">
      <h1 id="pokedex-title">포켓몬 도감</h1>
      <p>검색·필터·정렬·카드 목록·무한 스크롤 영역 (구현 예정)</p>
      <Link to={pokemonDetailPath(25)}>상세 페이지 연결 확인용 링크 (#25)</Link>
    </section>
  )
}
