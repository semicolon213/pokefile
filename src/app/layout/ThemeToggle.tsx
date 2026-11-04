import type { ComponentType } from 'react'
import { setThemePreference, useThemePreference, type ThemePreference } from '@/shared/state'
import { MonitorIcon, MoonIcon, SunIcon } from '@/shared/ui'

const OPTIONS: { value: ThemePreference; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { value: 'system', label: '시스템 설정', Icon: MonitorIcon },
  { value: 'light', label: '라이트 모드', Icon: SunIcon },
  { value: 'dark', label: '다크 모드', Icon: MoonIcon },
]

// 화면 테마 선택 (FR-32, TASK-020). 아이콘 세 개 중 하나를 고른다. 기본은 시스템 설정.
export function ThemeToggle() {
  const preference = useThemePreference()
  return (
    <div className="theme-toggle" role="group" aria-label="화면 테마">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          className="theme-toggle__button"
          aria-pressed={preference === value}
          aria-label={label}
          title={label}
          onClick={() => setThemePreference(value)}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  )
}
