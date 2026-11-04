import type { FavoritesSnapshot } from '../model/storage'

export function FavoritesNotice({ snapshot, onReload }: { snapshot: FavoritesSnapshot; onReload: () => void }) {
  if (!snapshot.message) return null
  return (
    <div className="favorites-notice">
      <p role={snapshot.status === 'unavailable' ? 'alert' : 'status'}>{snapshot.message}</p>
      {snapshot.status === 'unavailable' && <button type="button" onClick={onReload}>저장 정보 다시 읽기</button>}
    </div>
  )
}
