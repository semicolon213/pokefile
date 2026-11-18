import { useSyncExternalStore } from 'react'
import { collectionStore } from './store'

export function useCollection() {
  const snapshot = useSyncExternalStore(collectionStore.subscribe, collectionStore.getSnapshot, collectionStore.getServerSnapshot)
  return { ...snapshot, snapshot, toggle: collectionStore.toggle, reload: collectionStore.refresh, reset: collectionStore.reset }
}
