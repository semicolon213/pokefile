import { useSyncExternalStore } from 'react'

/**
 * 화면 테마 (FR-32, TASK-020, OQ-24). 사용자가 시스템 설정 / 라이트 / 다크 중에서 고르고, 기본은 시스템 설정이다.
 * 고른 값은 <html data-theme="light|dark">로 적용한다(시스템 설정이면 속성을 지우고 prefers-color-scheme을 따른다).
 * 첫 화면이 깜빡이지 않도록 index.html의 인라인 스크립트가 같은 키를 읽어 렌더 전에 먼저 적용한다.
 */
export const THEME_STORAGE_KEY = 'pokefile:theme'
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

const isPreference = (value: unknown): value is ThemePreference =>
  (THEME_PREFERENCES as readonly unknown[]).includes(value)

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

function readStored(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return isPreference(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

// 저장소가 막힌 환경에서도 이번 세션 안에서는 선택이 유지되도록 메모리 값을 함께 둔다
let memory: ThemePreference | undefined

function current(): ThemePreference {
  return memory ?? readStored()
}

/** <html>에 테마를 적용하고 브라우저 UI 색(theme-color)도 맞춘다 */
export function applyTheme(preference: ThemePreference) {
  const root = document.documentElement
  if (preference === 'system') root.removeAttribute('data-theme')
  else root.dataset.theme = preference
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--color-surface').trim() || meta.content
}

export function setThemePreference(preference: ThemePreference) {
  const valid = isPreference(preference) ? preference : 'system'
  memory = valid
  try {
    if (valid === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, valid)
  } catch {
    // 저장 실패는 무시한다 (메모리 값으로 이번 세션은 유지)
  }
  applyTheme(valid)
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // 다른 탭에서 바꾸면 따라간다
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY || e.key === null) {
      memory = undefined
      applyTheme(readStored())
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, current, () => 'system')
}

/** 테스트용: 메모리 값을 비우고 <html> 테마 속성을 지운다 */
export function resetThemeForTest() {
  memory = undefined
  document.documentElement.removeAttribute('data-theme')
}
