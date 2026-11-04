import { isPokemonId } from '@/shared/models'
import type { PokemonId } from '@/shared/models'

export const FAVORITES_STORAGE_KEY = 'pokefile:favorites'
export type FavoritesSnapshot = {
  readonly ids: readonly PokemonId[]
  readonly status: 'ready' | 'recovered' | 'unavailable'
  readonly message?: string
}

export function favoritesSnapshot(
  ids: readonly PokemonId[], status: FavoritesSnapshot['status'], message?: string,
): FavoritesSnapshot {
  return Object.freeze({ ids: Object.freeze([...ids]), status, message })
}

export const EMPTY_FAVORITES = favoritesSnapshot([], 'ready')

function validIds(values: readonly unknown[]): PokemonId[] {
  return [...new Set(values.filter(isPokemonId))]
}

/** ADR-012: 손상·다른 버전은 빈 목록과 안내. 읽기만으로 기존 저장 값을 덮어쓰지 않는다. */
export function decodeFavorites(raw: string | null): FavoritesSnapshot {
  if (raw === null) return EMPTY_FAVORITES
  let data: unknown
  try { data = JSON.parse(raw) } catch { data = null }
  if (data === null || typeof data !== 'object' || Array.isArray(data)
    || !('version' in data) || data.version !== 1 || !('ids' in data) || !Array.isArray(data.ids)) {
    return favoritesSnapshot([], 'recovered', '저장된 즐겨찾기를 읽을 수 없어 빈 목록으로 시작합니다.')
  }
  const ids = validIds(data.ids)
  return ids.length === data.ids.length
    ? favoritesSnapshot(ids, 'ready')
    : favoritesSnapshot(ids, 'recovered', '잘못되거나 중복된 즐겨찾기 정보를 제외했습니다.')
}

export function encodeFavorites(ids: readonly PokemonId[]): string {
  return JSON.stringify({ version: 1, ids: validIds(ids) })
}
