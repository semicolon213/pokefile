import type { FormKey } from '@/shared/models'

// 화면 표기는 한국어 (DESIGN.md §3.4). API 식별자는 그대로 두고 표시할 때만 변환한다.
// 타입 표기는 공통 표(@/shared/ui TYPE_LABELS)를 쓴다.

/** 폼 탭 표기 (DESIGN.md §2.2) */
export const FORM_LABELS: Record<FormKey, string> = {
  default: '기본',
  mega: '메가',
  'mega-x': '메가X',
  'mega-y': '메가Y',
}
