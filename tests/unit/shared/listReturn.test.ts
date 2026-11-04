import { describe, expect, it } from 'vitest'
import {
  lastListPath,
  rememberListSearch,
  rememberVisibleCount,
  resetListReturnForTest,
  savedVisibleCount,
} from '@/shared/state'

describe('목록으로 돌아오기 (필터·스크롤 유지)', () => {
  it('마지막 목록 주소를 기억한다. 없으면 /', () => {
    expect(lastListPath()).toBe('/')
    rememberListSearch('?type=fire&gen=1')
    expect(lastListPath()).toBe('/?type=fire&gen=1')
  })

  it('목록 주소별 펼친 카드 수를 기억하고, 새로고침(메모리 초기화) 후에도 탭 안에서는 유지한다', () => {
    rememberVisibleCount('type=fire', 72)
    rememberVisibleCount('', 48)
    resetListReturnForTest()
    expect(savedVisibleCount('type=fire')).toBe(72)
    expect(savedVisibleCount('')).toBe(48)
    expect(savedVisibleCount('gen=9')).toBeUndefined()
  })

  it('목록 주소는 최근 20개까지만 기억한다', () => {
    for (let i = 0; i < 25; i++) rememberVisibleCount(`gen=${i}`, 48)
    expect(savedVisibleCount('gen=0')).toBeUndefined()
    expect(savedVisibleCount('gen=24')).toBe(48)
  })

  it('저장된 값이 손상되면 무시한다', () => {
    sessionStorage.setItem('pokefile:list-return', '{broken')
    resetListReturnForTest()
    expect(lastListPath()).toBe('/')
  })
})
