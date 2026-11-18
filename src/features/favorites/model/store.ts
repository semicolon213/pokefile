import {
  decodeFavorites, EMPTY_FAVORITES, encodeFavorites, FAVORITES_STORAGE_KEY, favoritesSnapshot,
} from './storage'
import { createSavedIdsStore } from './savedIdsStore'
import type { StorageAccess, ExternalSubscription } from './savedIdsStore'

export function createFavoritesStore(getStorage: StorageAccess, subscribeExternal?: ExternalSubscription) {
  return createSavedIdsStore({
    key: FAVORITES_STORAGE_KEY, empty: EMPTY_FAVORITES, decode: decodeFavorites, encode: encodeFavorites,
    snapshot: favoritesSnapshot,
    unavailableMessage: '브라우저 저장 공간을 사용할 수 없어 즐겨찾기를 변경할 수 없습니다.',
  }, getStorage, subscribeExternal)
}

export const favoritesStore = createFavoritesStore(
  () => window.localStorage,
  (refresh) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== FAVORITES_STORAGE_KEY) return
      try {
        if (event.storageArea && event.storageArea !== window.localStorage) return
      } catch { /* 실제 읽기 실패는 refresh가 상태로 전달한다. */ }
      refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  },
)
