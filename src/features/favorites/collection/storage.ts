import type { PokemonId } from '@/shared/models'
import { decodeFavorites, encodeFavorites, favoritesSnapshot } from '../model/storage'
import type { FavoritesSnapshot } from '../model/storage'

export const COLLECTION_STORAGE_KEY = 'pokefile:collection'
export type CollectionSnapshot = FavoritesSnapshot & { readonly knowledge: 'known' | 'partial' | 'unknown' }
export const EMPTY_COLLECTION: CollectionSnapshot = Object.freeze({ ...favoritesSnapshot([], 'ready'), knowledge: 'unknown' })
export const encodeCollection = encodeFavorites

export function collectionSnapshot(
  ids: readonly PokemonId[], status: FavoritesSnapshot['status'], message?: string, previous?: CollectionSnapshot,
): CollectionSnapshot {
  return Object.freeze({
    ...favoritesSnapshot(ids, status, message),
    knowledge: status === 'unavailable' ? previous?.knowledge ?? 'unknown' : 'known',
  })
}

export function decodeCollection(raw: string | null): CollectionSnapshot {
  const snapshot = decodeFavorites(raw)
  if (snapshot.status === 'recovered') {
    return snapshot.ids.length === 0
      ? Object.freeze({
        ...snapshot, knowledge: 'unknown',
        message: '저장된 도감 기록 전체를 읽을 수 없어 포획 상태와 완성률을 확인할 수 없습니다. 원본은 보존됩니다. 새로 시작하려면 기록 초기화를 선택하세요.',
      })
      : Object.freeze({
        ...snapshot, knowledge: 'partial',
        message: '저장된 도감 기록에서 잘못되거나 중복된 항목을 제외했습니다. 유효한 기록을 기준으로 표시합니다.',
      })
  }
  return Object.freeze({ ...snapshot, knowledge: 'known' })
}
