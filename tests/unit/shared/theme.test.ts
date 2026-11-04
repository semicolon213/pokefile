import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, resetThemeForTest, setThemePreference, useThemePreference } from '@/shared/state'

const html = document.documentElement

describe('화면 테마 (FR-32, TASK-020)', () => {
  it('기본은 시스템 설정이고 <html>에 테마 속성을 두지 않는다', () => {
    const { result } = renderHook(() => useThemePreference())
    expect(result.current).toBe('system')
    expect(html.hasAttribute('data-theme')).toBe(false)
  })

  it('다크·라이트를 고르면 저장하고 <html data-theme>에 적용, 시스템 설정으로 돌리면 지운다', () => {
    const { result } = renderHook(() => useThemePreference())
    act(() => setThemePreference('dark'))
    expect(result.current).toBe('dark')
    expect(html.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    act(() => setThemePreference('light'))
    expect(html.dataset.theme).toBe('light')
    act(() => setThemePreference('system'))
    expect(html.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('저장된 잘못된 값은 시스템 설정으로 본다', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    resetThemeForTest()
    const { result } = renderHook(() => useThemePreference())
    expect(result.current).toBe('system')
  })

  it('저장소가 막혀도 이번 세션에서는 선택이 유지된다', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const { result } = renderHook(() => useThemePreference())
    act(() => setThemePreference('dark'))
    expect(result.current).toBe('dark')
    expect(html.dataset.theme).toBe('dark')
    spy.mockRestore()
  })
})
