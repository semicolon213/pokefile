import type { SortKey } from '../model/filters'

type Props = {
  value: SortKey
  onChange: (sort: SortKey) => void
}

// 정렬 (FR-06): 도감 번호순(기본), 이름순(한국어 이름 기준)
export function SortSelect({ value, onChange }: Props) {
  return (
    <label className="sort-select">
      <span className="visually-hidden">정렬</span>
      <select value={value} onChange={(e) => onChange(e.target.value === 'name' ? 'name' : 'id')}>
        <option value="id">도감 번호순</option>
        <option value="name">이름순</option>
      </select>
    </label>
  )
}
