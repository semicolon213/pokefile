import { Link } from 'react-router'
import { PokemonCard, useSearchIndex } from '@/features/pokedex'
import { pokemonDetailPath } from '@/features/pokemon-detail'
import type { PokemonId } from '@/shared/models'
import { ErrorState, LoadingState } from '@/shared/ui'
import { formatDexNumber } from '@/shared/utils'
import { FavoriteToggle } from '../components/FavoriteToggle'
import { FavoritesNotice } from '../components/FavoritesNotice'
import { useFavorites } from '../hooks/useFavorites'
import { favoriteEntries } from '../model/list'
import './FavoritesPage.css'

// UI-03 / FR-19~22: 같은 도감 카드를 공개 API로 재사용하고 저장 순서를 유지한다.
export function FavoritesPage() {
  const favorites = useFavorites()
  return (
    <section className="favorites-page" aria-labelledby="favorites-title">
      <h1 id="favorites-title">즐겨찾기</h1>
      <p className="favorites-page__intro">이 브라우저에 저장한 포켓몬을 확인하고 관리할 수 있습니다.</p>
      <FavoritesNotice snapshot={favorites} onReload={favorites.reload} />
      {favorites.ids.length > 0 ? (
        <>
          <p role="status">저장한 포켓몬 {favorites.ids.length}마리</p>
          <SavedPokemonList ids={favorites.ids} />
          <Link to="/">도감으로 이동</Link>
        </>
      ) : (
        <div className="favorites-empty">
          <p>{favorites.status === 'unavailable'
            ? '도감에서 포켓몬을 계속 탐색할 수 있습니다.'
            : '즐겨찾기한 포켓몬이 없습니다.'}</p>
          <Link to="/">도감으로 이동</Link>
        </div>
      )}
    </section>
  )
}

function SavedPokemonList({ ids }: { ids: readonly PokemonId[] }) {
  const index = useSearchIndex()
  const entries = favoriteEntries(ids, index.data ?? [])
  const missing = index.isSuccess && entries.some((entry) => !entry.pokemon)

  if (index.isPending) return <LoadingState message="즐겨찾기 포켓몬을 불러오는 중입니다." />
  return (
    <>
      {index.isError && (
        <div>
          <ErrorState message="포켓몬 정보를 불러오지 못했습니다. 저장한 번호로 계속 확인하거나 해제할 수 있습니다." />
          <button type="button" onClick={() => void index.refetch()}>다시 시도</button>
        </div>
      )}
      {missing && <p role="status">일부 포켓몬 정보를 찾지 못했습니다. 저장한 번호로 확인하거나 해제할 수 있습니다.</p>}
      <ul className="favorites-grid" aria-label="저장한 포켓몬">
        {entries.map(({ id, pokemon }) => (
          <li key={id}>
            {pokemon ? <PokemonCard pokemon={pokemon} /> : <FavoriteFallbackCard pokemonId={id} />}
          </li>
        ))}
      </ul>
    </>
  )
}

function FavoriteFallbackCard({ pokemonId }: { pokemonId: PokemonId }) {
  const number = formatDexNumber(pokemonId)
  return (
    <article className="favorites-fallback" aria-label={`${number} 정보 없음`}>
      <Link to={pokemonDetailPath(pokemonId)}>포켓몬 {number} 상세 보기</Link>
      <p>포켓몬 정보를 확인할 수 없습니다.</p>
      <FavoriteToggle pokemonId={pokemonId} />
    </article>
  )
}
