import { describe, expect, it, vi } from 'vitest'
import { GENERATIONS, MAX_POKEMON_ID } from '@/shared/models'
import type { PokemonSummary } from '@/shared/models'
import { COLLECTION_STORAGE_KEY, decodeCollection, encodeCollection } from '@/features/favorites/collection/storage'
import { createCollectionStore } from '@/features/favorites/collection/store'
import { collectionProgress, collectionSpecies } from '@/features/favorites/collection/progress'
import index from '../../../public/data/pokedex-index.json'

const pokemon = (id: number, generation = GENERATIONS[0]): PokemonSummary => ({ id, generation, nameEn: String(id), types: ['normal'], forms: [] })
const memoryStorage = (raw: string | null = null) => ({
  getItem: vi.fn(() => raw),
  setItem: vi.fn((_key: string, next: string) => { raw = next }),
})

describe('포획 기록 영속화 (FR-29 / TC-14·09)', () => {
  it.each([null, '{"version":1,"ids":[]}'])('빈 기록 %s를 읽는다', (raw) => {
    expect(decodeCollection(raw)).toMatchObject({ ids: [], status: 'ready' })
  })
  it.each(['broken', '{"version":2,"ids":[25]}', 'null', '[]', '{"version":1,"ids":null}'])('손상된 기록 %s는 안내하고 임의 저장하지 않는다', (raw) => {
    const storage = memoryStorage(raw)
    const store = createCollectionStore(() => storage)
    expect(store.getSnapshot()).toMatchObject({ ids: [], status: 'recovered', message: expect.stringContaining('도감 기록') })
    expect(storage.setItem).not.toHaveBeenCalled()
  })
  it('중복·잘못된 번호·폼 ID를 제외하고 범위의 마지막 종을 유지한다', () => {
    expect(decodeCollection(JSON.stringify({ version: 1, ids: [25, 25, 0, '6', 10034, MAX_POKEMON_ID, MAX_POKEMON_ID + 1] })))
      .toMatchObject({ ids: [25, MAX_POKEMON_ID], status: 'recovered' })
    expect(JSON.parse(encodeCollection([25, 25, MAX_POKEMON_ID]))).toEqual({ version: 1, ids: [25, MAX_POKEMON_ID] })
  })
  it('체크·해제·새 저장소에서 복원하며 즐겨찾기 키를 사용하지 않는다', () => {
    const storage = memoryStorage()
    const store = createCollectionStore(() => storage)
    const listener = vi.fn()
    store.subscribe(listener)
    store.toggle(25)
    store.toggle(MAX_POKEMON_ID)
    store.toggle(25)
    expect(createCollectionStore(() => storage).getSnapshot().ids).toEqual([MAX_POKEMON_ID])
    expect(storage.setItem).toHaveBeenLastCalledWith(COLLECTION_STORAGE_KEY, JSON.stringify({ version: 1, ids: [MAX_POKEMON_ID] }))
    expect(listener).toHaveBeenCalledTimes(3)
  })
  it('쓰기 실패 시 기존 체크를 유지하고 재읽기 후 복구한다', () => {
    const storage = memoryStorage('{"version":1,"ids":[25]}')
    const store = createCollectionStore(() => storage)
    storage.setItem.mockImplementationOnce(() => { throw new Error('full') })
    expect(store.toggle(6)).toBe(false)
    const snapshot = store.getSnapshot()
    expect(snapshot).toMatchObject({ ids: [25], status: 'unavailable', message: expect.stringContaining('포획 기록') })
    expect(store.getSnapshot()).toBe(snapshot)
    expect(store.toggle(25)).toBe(false)
    store.refresh()
    expect(store.toggle(6)).toBe(true)
    expect(store.getSnapshot().ids).toEqual([25, 6])
  })
  it('읽기 차단을 처리하고 잘못된 ID를 저장하지 않는다', () => {
    const store = createCollectionStore(() => { throw new Error('blocked') })
    expect(store.getSnapshot().status).toBe('unavailable')
    expect(store.toggle(25)).toBe(false)
    const storage = memoryStorage()
    const valid = createCollectionStore(() => storage)
    for (const id of [0, NaN, 1.5, MAX_POKEMON_ID + 1]) expect(valid.toggle(id)).toBe(false)
    expect(storage.setItem).not.toHaveBeenCalled()
  })
  it('외부 변경을 읽고 마지막 구독 해제 시 이벤트를 정리한다', () => {
    const storage = memoryStorage()
    let refresh!: () => void
    const disconnect = vi.fn()
    const store = createCollectionStore(() => storage, (callback) => { refresh = callback; return disconnect })
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    storage.setItem(COLLECTION_STORAGE_KEY, '{"version":1,"ids":[25]}')
    refresh()
    expect(listener).toHaveBeenCalled()
    expect(store.getSnapshot().ids).toEqual([25])
    store.toggle(6)
    expect(store.getSnapshot().ids).toEqual([25, 6])
    unsubscribe()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('D-A: 최초 읽기 실패와 읽은 뒤 장애를 구분하고 재읽기로 복구한다', () => {
    const storage = memoryStorage('{"version":1,"ids":[25,6]}')
    storage.getItem.mockImplementationOnce(() => { throw new Error('blocked') })
    const store = createCollectionStore(() => storage)
    expect(store.getSnapshot()).toMatchObject({ knowledge: 'unknown', status: 'unavailable' })
    store.refresh()
    expect(store.getSnapshot()).toMatchObject({ ids: [25, 6], knowledge: 'known', status: 'ready' })
    storage.getItem.mockImplementation(() => { throw new Error('blocked') })
    expect(store.getSnapshot()).toMatchObject({ ids: [25, 6], knowledge: 'known', status: 'unavailable' })
  })

  it.each(['broken', '{"version":2,"ids":[25]}', '{"version":1,"ids":[0,"25"]}'])('D-B: 읽을 수 없는 전체 기록 %s는 토글로 덮어쓰지 않는다', (raw) => {
    const storage = memoryStorage(raw)
    const store = createCollectionStore(() => storage)
    const snapshot = store.getSnapshot()
    expect(snapshot).toMatchObject({ knowledge: 'unknown', status: 'recovered' })
    expect(snapshot.message).toContain('전체를 읽을 수 없어')
    expect(store.toggle(25)).toBe(false)
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(storage.getItem()).toBe(raw)
    expect(store.reset(snapshot)).toBe(true)
    expect(storage.getItem()).toBe('{"version":1,"ids":[]}')
    expect(store.getSnapshot()).toMatchObject({ ids: [], status: 'ready', knowledge: 'known' })
    expect(store.toggle(25)).toBe(true)
  })

  it('D-B: 일부 항목 제외와 저장 값 부재는 전체 손상과 구분한다', () => {
    expect(decodeCollection('{"version":1,"ids":[25,25,0]}')).toMatchObject({
      ids: [25], knowledge: 'partial', message: expect.stringContaining('잘못되거나 중복된'),
    })
    expect(decodeCollection(null)).toMatchObject({ ids: [], knowledge: 'known', status: 'ready' })
  })

  it('D-B: 초기화 확인 중 외부에서 바뀐 기록을 덮어쓰지 않는다', () => {
    const storage = memoryStorage('broken')
    const store = createCollectionStore(() => storage)
    const snapshot = store.getSnapshot()
    storage.setItem(COLLECTION_STORAGE_KEY, '{"version":1,"ids":[25]}')
    storage.setItem.mockClear()
    expect(store.reset(snapshot)).toBe(false)
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(store.getSnapshot().ids).toEqual([25])
  })

  it('D-B: 초기화 저장 실패 시에도 원본을 보존한다', () => {
    const storage = memoryStorage('broken')
    const store = createCollectionStore(() => storage)
    const snapshot = store.getSnapshot()
    storage.setItem.mockImplementationOnce(() => { throw new Error('full') })
    expect(store.reset(snapshot)).toBe(false)
    expect(storage.getItem()).toBe('broken')
    expect(store.getSnapshot()).toMatchObject({ knowledge: 'unknown', status: 'unavailable' })
  })
})

describe('도감 완성률 (FR-29 / TC-14)', () => {
  it('폼·중복·지원 밖 항목을 별도 종으로 세지 않는다', () => {
    const list = [pokemon(25), pokemon(25), pokemon(MAX_POKEMON_ID, GENERATIONS.at(-1)!), pokemon(10034), pokemon(6, 'unknown')]
    expect(collectionSpecies(list).map((entry) => entry.id)).toEqual([25, MAX_POKEMON_ID])
    expect(collectionProgress(list, [25, 25, 10034]).all).toEqual({ completed: 1, total: 2, percent: 50 })
  })
  it('세대별·전체 비율과 0건을 정확히 계산한다', () => {
    const result = collectionProgress([pokemon(1), pokemon(2), pokemon(3), pokemon(MAX_POKEMON_ID, GENERATIONS.at(-1)!)], [1, MAX_POKEMON_ID])
    expect(result.all).toEqual({ completed: 2, total: 4, percent: 50 })
    expect(result.generations[0]).toMatchObject({ completed: 1, total: 3, percent: 33.3 })
    expect(result.generations.at(-1)).toMatchObject({ completed: 1, total: 1, percent: 100 })
    expect(collectionProgress([], []).all).toEqual({ completed: 0, total: 0, percent: 0 })
  })
  it('실제 정적 인덱스의 모든 세대를 공통 설정에 맞춰 집계한다', () => {
    const species = index.pokemon as PokemonSummary[]
    const result = collectionProgress(species, species.map((entry) => entry.id))
    expect(result.all).toEqual({ completed: MAX_POKEMON_ID, total: MAX_POKEMON_ID, percent: 100 })
    expect(result.generations.map((entry) => entry.generation)).toEqual(GENERATIONS)
    expect(result.generations.reduce((sum, entry) => sum + entry.total, 0)).toBe(MAX_POKEMON_ID)
    expect(result.generations.every((entry) => entry.total > 0 && entry.percent === 100)).toBe(true)
  })
})
