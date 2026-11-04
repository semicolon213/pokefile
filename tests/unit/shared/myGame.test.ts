import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MY_GAME_STORAGE_KEY, findGameVersion, resetMyGameForTest, setMyGame, useMyGame } from '@/shared/state'

describe('내 게임 (FR-26)', () => {
  afterEach(() => vi.restoreAllMocks())

  it('지원 범위의 게임 버전만 인정한다', () => {
    expect(findGameVersion('black-2')).toMatchObject({ version: 'black-2', label: '블랙 2', generation: 'generation-v' })
    expect(findGameVersion('sun')).toBeNull()
    expect(findGameVersion(null)).toBeNull()
  })

  it('선택을 저장하고 구독 중인 화면에 알린다', () => {
    const { result } = renderHook(() => useMyGame())
    expect(result.current).toBeNull()
    act(() => setMyGame('x'))
    expect(result.current?.label).toBe('X')
    expect(localStorage.getItem(MY_GAME_STORAGE_KEY)).toBe('x')
    act(() => setMyGame(null))
    expect(result.current).toBeNull()
    expect(localStorage.getItem(MY_GAME_STORAGE_KEY)).toBeNull()
  })

  it('저장된 잘못된 값은 무시한다', () => {
    localStorage.setItem(MY_GAME_STORAGE_KEY, 'scarlet')
    resetMyGameForTest()
    const { result } = renderHook(() => useMyGame())
    expect(result.current).toBeNull()
  })

  it('저장소가 막혀도 이번 세션에서는 선택이 유지된다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useMyGame())
    act(() => setMyGame('red'))
    expect(result.current?.label).toBe('레드')
  })
})
