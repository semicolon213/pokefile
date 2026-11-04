import type { PokemonType } from '@/shared/models'
import { TYPE_LABELS } from './typeLabels'

type Props = { type: PokemonType; size?: 'sm' | 'md' }

// 타입 배지: 옅은 타입 색 바탕 + 잉크 글자 (18종 모두 WCAG AA). 색만으로 구분하지 않도록 이름을 항상 표시한다.
export function TypeBadge({ type, size = 'md' }: Props) {
  return <span className={`type-badge type-badge--${size} type--${type}`}>{TYPE_LABELS[type]}</span>
}
