import { useEffect, useState } from 'react'
import { DEFAULT_MIN, STAT_KEYS, STAT_LABELS, isStatKey, statMax, type StatMin } from '../model/stats'

type Props = {
  value: StatMin | null
  onChange: (min: StatMin | null) => void
}

/**
 * 종족값 하한 조건 (FR-34): 능력치를 고르고 값을 넣으면 '그 값 이상'만 남긴다.
 * 값은 입력 중에는 주소를 바꾸지 않고, Enter·포커스 이동 때 반영한다(입력할 때마다 기록이 쌓이지 않도록).
 */
export function StatFilter({ value, onChange }: Props) {
  const [draft, setDraft] = useState(value ? String(value.value) : '')
  // 주소가 바뀌면(뒤로 가기·초기화) 입력값도 맞춘다
  useEffect(() => setDraft(value ? String(value.value) : ''), [value])

  const commit = () => {
    if (!value) return
    const n = Number(draft)
    if (Number.isInteger(n) && n >= 1 && n <= statMax(value.stat)) {
      if (n !== value.value) onChange({ stat: value.stat, value: n })
    } else setDraft(String(value.value))
  }

  return (
    <div className="stat-filter" role="group" aria-label="종족값 조건">
      <label className="stat-filter__stat">
        <span className="visually-hidden">종족값 조건 능력치</span>
        <select
          value={value?.stat ?? ''}
          onChange={(e) => {
            const stat = e.target.value
            onChange(isStatKey(stat) ? { stat, value: value?.stat === stat ? value.value : DEFAULT_MIN[stat] } : null)
          }}
        >
          <option value="">종족값 조건 없음</option>
          {STAT_KEYS.map((stat) => (
            <option key={stat} value={stat}>
              {STAT_LABELS[stat]}
            </option>
          ))}
        </select>
      </label>
      {value && (
        <label className="stat-filter__value">
          <span className="visually-hidden">{STAT_LABELS[value.stat]} 최솟값</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={statMax(value.stat)}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
            }}
          />
          <span aria-hidden="true">이상</span>
        </label>
      )}
    </div>
  )
}
