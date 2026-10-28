import { GENERATIONS, type Generation } from '@/shared/models'
import { GENERATION_LABELS } from '../model/labels'

type Props = {
  selected: Generation | null
  counts: Record<Generation, number>
  total: number
  onSelect: (gen: Generation | null) => void
}

// 좌측 세대별 메뉴 (DESIGN.md §2.1). 선택 상태는 색과 aria-pressed로 함께 표시한다.
export function GenerationNav({ selected, counts, total, onSelect }: Props) {
  const items: { gen: Generation | null; name: string; region?: string; count: number }[] = [
    { gen: null, name: '전체', count: total },
    ...GENERATIONS.map((gen) => ({ gen, ...GENERATION_LABELS[gen], count: counts[gen] })),
  ]

  return (
    <nav className="generation-nav" aria-label="세대별 보기">
      <h2 className="generation-nav__title">세대별 보기</h2>
      <ul className="generation-nav__list">
        {items.map((item) => (
          <li key={item.gen ?? 'all'}>
            <button
              type="button"
              className="generation-nav__item"
              aria-pressed={selected === item.gen}
              onClick={() => onSelect(item.gen)}
            >
              <span className="generation-nav__name">
                {item.name}
                {item.region && <span className="generation-nav__region">{item.region}</span>}
              </span>
              <span className="generation-nav__count">{item.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
