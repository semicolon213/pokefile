import { isPokemonId } from '@/shared/models'
import type { PokemonId } from '@/shared/models'
import type { FavoritesSnapshot } from './storage'

export type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>
export type ExternalSubscription = (refresh: () => void) => () => void
type Options<Snapshot extends FavoritesSnapshot> = {
  key: string
  empty: Snapshot
  decode: (raw: string | null) => Snapshot
  encode: (ids: readonly PokemonId[]) => string
  snapshot: (ids: readonly PokemonId[], status: FavoritesSnapshot['status'], message?: string, previous?: Snapshot) => Snapshot
  canToggle?: (snapshot: Snapshot) => boolean
  canReset?: (snapshot: Snapshot) => boolean
  unavailableMessage: string
}
const UNREAD = Symbol('unread')

/** 즐겨찾기와 포획 기록이 공유하는 ID 배열 저장·구독 구조. 키와 안내 문구는 각 기능이 소유한다. */
export function createSavedIdsStore<Snapshot extends FavoritesSnapshot>(options: Options<Snapshot>, getStorage: StorageAccess, subscribeExternal?: ExternalSubscription) {
  let current = options.empty
  let lastRaw: string | null | typeof UNREAD = UNREAD
  const listeners = new Set<() => void>()
  let disconnect: (() => void) | undefined
  const emit = () => { for (const listener of listeners) listener() }
  const unavailable = () => {
    if (current.status !== 'unavailable') current = options.snapshot(current.ids, 'unavailable', options.unavailableMessage, current)
  }
  const getSnapshot = (): Snapshot => {
    try {
      const raw = getStorage().getItem(options.key)
      if (raw !== lastRaw) { lastRaw = raw; current = options.decode(raw) }
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
  const save = (ids: readonly PokemonId[]): boolean => {
    const raw = options.encode(ids)
    try {
      getStorage().setItem(options.key, raw)
      lastRaw = raw
      current = options.snapshot(ids, 'ready')
    } catch { unavailable(); emit(); return false }
    emit()
    return true
  }
  const toggle = (id: PokemonId): boolean => {
    if (!isPokemonId(id)) return false
    const before = current
    const snapshot = getSnapshot()
    if (snapshot.status === 'unavailable' || options.canToggle?.(snapshot) === false) {
      if (current !== before) emit()
      return false
    }
    const ids = snapshot.ids.includes(id) ? snapshot.ids.filter((saved) => saved !== id) : [...snapshot.ids, id]
    return save(ids)
  }
  const reset = (expected: Snapshot): boolean => {
    const before = current
    const snapshot = getSnapshot()
    if (snapshot !== expected || snapshot.status === 'unavailable' || !options.canReset?.(snapshot)) {
      if (current !== before) emit()
      return false
    }
    return save([])
  }
  return { getSnapshot, subscribe, toggle, reset, refresh, getServerSnapshot: () => options.empty }
}
