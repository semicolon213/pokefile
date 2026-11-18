import { createSavedIdsStore } from '../model/savedIdsStore'
import type { StorageAccess, ExternalSubscription } from '../model/savedIdsStore'
import { COLLECTION_STORAGE_KEY, collectionSnapshot, decodeCollection, EMPTY_COLLECTION, encodeCollection } from './storage'

export function createCollectionStore(getStorage: StorageAccess, subscribeExternal?: ExternalSubscription) {
  return createSavedIdsStore({
    key: COLLECTION_STORAGE_KEY, empty: EMPTY_COLLECTION, decode: decodeCollection, encode: encodeCollection,
    snapshot: collectionSnapshot,
    canToggle: (snapshot) => snapshot.knowledge !== 'unknown',
    canReset: (snapshot) => snapshot.status === 'recovered' && snapshot.knowledge === 'unknown',
    unavailableMessage: '브라우저 저장 공간을 사용할 수 없어 포획 기록을 변경할 수 없습니다.',
  }, getStorage, subscribeExternal)
}

export const collectionStore = createCollectionStore(() => window.localStorage, (refresh) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== COLLECTION_STORAGE_KEY) return
    try { if (event.storageArea && event.storageArea !== window.localStorage) return } catch { /* refresh가 읽기 오류를 표시한다. */ }
    refresh()
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
})
