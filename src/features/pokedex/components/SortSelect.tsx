import type { SortKey } from '../model/filters'

type Props = {
  value: SortKey
  /** 지방을 골랐으면 도감 번호순은 지방 도감 순이 되고, 전국 도감 번호순을 따로 고를 수 있다 (ADR-017) */
  regional: boolean
  onChange: (sort: SortKey) => void
}

// 정렬 (FR-06·31): 도감 번호순(기본), 이름순(한국어 이름 기준)
export function SortSelect({ value, regional, onChange }: Props) {
  const current = !regional && value === 'national' ? 'id' : value
  return (
    <label className="sort-select">
      <span className="visually-hidden">정렬</span>
      <select value={current} onChange={(e) => onChange(e.target.value as SortKey)}>
        <option value="id">{regional ? '지방 도감 순' : '도감 번호순'}</option>
        {regional && <option value="national">전국 도감 번호순</option>}
        <option value="name">이름순</option>
      </select>
    </label>
  )
}
