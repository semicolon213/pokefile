import { isPokemonId } from '@/shared/models'
import type { PokemonId } from '@/shared/models'
import {
  decodeFavorites, EMPTY_FAVORITES, encodeFavorites, favoritesSnapshot, FAVORITES_STORAGE_KEY,
} from './storage'
import type { FavoritesSnapshot } from './storage'

type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>
type ExternalSubscription = (refresh: () => void) => () => void
const UNREAD = Symbol('unread')
const UNAVAILABLE_MESSAGE = '브라우저 저장 공간을 사용할 수 없어 즐겨찾기를 변경할 수 없습니다.'

export function createFavoritesStore(getStorage: StorageAccess, subscribeExternal?: ExternalSubscription) {
  let current: FavoritesSnapshot = EMPTY_FAVORITES
  let lastRaw: string | null | typeof UNREAD = UNREAD
  const listeners = new Set<() => void>()
  let disconnect: (() => void) | undefined
  const emit = () => { for (const listener of listeners) listener() }
  const unavailable = () => {
    if (current.status !== 'unavailable') current = favoritesSnapshot(current.ids, 'unavailable', UNAVAILABLE_MESSAGE)
  }

  const getSnapshot = (): FavoritesSnapshot => {
    try {
      const raw = getStorage().getItem(FAVORITES_STORAGE_KEY)
      // 같은 값이면 같은 snapshot을 반환한다. 쓰기 실패 상태도 명시적 재읽기 전까지 유지한다.
      if (raw !== lastRaw) {
        lastRaw = raw
        current = decodeFavorites(raw)
      }
    } catch { unavailable() }
    return current
  }

  const refresh = () => {
    const previous = current
    lastRaw = UNREAD
    getSnapshot()
    if (current !== previous) emit()
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    if (listeners.size === 1 && subscribeExternal) disconnect = subscribeExternal(refresh)
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) { disconnect?.(); disconnect = undefined }
    }
  }

  const toggle = (id: PokemonId): boolean => {
    if (!isPokemonId(id)) return false
    const before = current
    const snapshot = getSnapshot() // 다른 탭·소비자의 최신 저장 값을 기준으로 변경한다.
    if (snapshot.status === 'unavailable') {
      if (current !== before) emit()
      return false
    }
    const ids = snapshot.ids.includes(id) ? snapshot.ids.filter((saved) => saved !== id) : [...snapshot.ids, id]
    const raw = encodeFavorites(ids)
    try {
      getStorage().setItem(FAVORITES_STORAGE_KEY, raw)
      lastRaw = raw
      current = favoritesSnapshot(ids, 'ready')
    } catch {
      unavailable()
      emit()
      return false
    }
    emit()
    return true
  }

  return { getSnapshot, subscribe, toggle, refresh, getServerSnapshot: () => EMPTY_FAVORITES }
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
