import { useSyncExternalStore } from 'react'
import { favoritesStore } from '../model/store'

/** 같은 문서에서는 store 구독으로, 다른 탭에서는 storage 이벤트로 갱신한다. */
export function useFavorites() {
  const snapshot = useSyncExternalStore(
    favoritesStore.subscribe, favoritesStore.getSnapshot, favoritesStore.getServerSnapshot,
  )
  return { ...snapshot, toggle: favoritesStore.toggle, reload: favoritesStore.refresh }
}
