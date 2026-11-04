import { describe, expect, it, vi } from 'vitest'
import { createFavoritesStore } from '@/features/favorites/model/store'
import { FAVORITES_STORAGE_KEY } from '@/features/favorites/model/storage'

function memoryStorage(initial: string | null = null) {
  let value = initial
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => { value = next }),
  }
}

describe('즐겨찾기 상태와 저장 실패 (TC-07·09)', () => {
  it('추가·해제·다시 추가 시 순서와 새 store의 저장 값을 유지한다', () => {
    const storage = memoryStorage()
    const store = createFavoritesStore(() => storage)
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    expect(store.toggle(25)).toBe(true)
    store.toggle(133)
    store.toggle(25)
    store.toggle(25)
    expect(store.getSnapshot().ids).toEqual([133, 25])
    expect(createFavoritesStore(() => storage).getSnapshot().ids).toEqual([133, 25])
    expect(storage.setItem).toHaveBeenLastCalledWith(FAVORITES_STORAGE_KEY, '{"version":1,"ids":[133,25]}')
    expect(listener).toHaveBeenCalledTimes(4)
    unsubscribe()
  })

  it('외부 변경 뒤 최신 저장 값에 추가하고 같은 값에는 같은 snapshot을 반환한다', () => {
    const storage = memoryStorage('{"version":1,"ids":[25]}')
    const store = createFavoritesStore(() => storage)
    const before = store.getSnapshot()
    expect(store.getSnapshot()).toBe(before)
    storage.setItem(FAVORITES_STORAGE_KEY, '{"version":1,"ids":[25,133]}')
    store.toggle(6)
    expect(store.getSnapshot().ids).toEqual([25, 133, 6])
  })

  it('손상된 값을 읽기만 할 때 덮어쓰지 않고 다음 저장에서 정상 스키마를 쓴다', () => {
    const storage = memoryStorage('broken')
    const store = createFavoritesStore(() => storage)
    expect(store.getSnapshot().status).toBe('recovered')
    expect(storage.setItem).not.toHaveBeenCalled()
    store.toggle(25)
    expect(store.getSnapshot()).toMatchObject({ ids: [25], status: 'ready' })
  })

  it('읽기 접근 실패는 예외 대신 저장 불가 상태가 된다', () => {
    const store = createFavoritesStore(() => { throw new DOMException('blocked', 'SecurityError') })
    expect(store.getSnapshot()).toMatchObject({ ids: [], status: 'unavailable' })
    expect(store.toggle(25)).toBe(false)
  })

  it('쓰기 실패 시 기존 목록을 유지하고 성공한 것처럼 보이지 않는다', () => {
    const storage = memoryStorage('{"version":1,"ids":[25]}')
    const store = createFavoritesStore(() => storage)
    const listener = vi.fn()
    store.subscribe(listener)
    store.getSnapshot()
    storage.setItem.mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
    expect(store.toggle(133)).toBe(false)
    expect(store.getSnapshot()).toMatchObject({ ids: [25], status: 'unavailable' })
    expect(store.toggle(25)).toBe(false)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('외부 구독을 공유하고 마지막 소비자가 떠나면 정리한다', () => {
    const disconnect = vi.fn()
    const external = vi.fn(() => disconnect)
    const store = createFavoritesStore(() => memoryStorage(), external)
    const a = store.subscribe(vi.fn())
    const b = store.subscribe(vi.fn())
    expect(external).toHaveBeenCalledOnce()
    a()
    expect(disconnect).not.toHaveBeenCalled()
    b()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it.each([0, 722, 25.5, NaN])('범위 밖 ID %s는 저장하지 않는다', (id) => {
    const storage = memoryStorage()
    const store = createFavoritesStore(() => storage)
    expect(store.toggle(id)).toBe(false)
    expect(storage.setItem).not.toHaveBeenCalled()
  })
})
