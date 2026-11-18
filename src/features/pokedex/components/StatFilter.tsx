import { useEffect, useRef, useState } from 'react'
import { DEFAULT_MIN, STAT_KEYS, STAT_LABELS, isStatKey, statMax, type StatMin } from '../model/stats'

type Props = {
  value: StatMin | null
  /** replace: 입력 중 반영(방문 기록을 늘리지 않음) */
  onChange: (min: StatMin | null, options?: { replace?: boolean }) => void
}

/** 입력을 멈춘 뒤 이만큼 지나면 반영한다 */
const TYPING_DELAY = 300

/**
 * 종족값 하한 조건 (FR-34): 능력치를 고르고 값을 넣으면 '그 값 이상'만 남긴다.
 * 값은 입력하는 대로(잠깐 멈추면) 반영하고, 입력 중 반영은 방문 기록을 늘리지 않는다(replace).
 * 범위 밖·빈 값은 반영하지 않고, 포커스가 빠지면 마지막으로 반영된 값으로 되돌린다.
 */
export function StatFilter({ value, onChange }: Props) {
  const [draft, setDraft] = useState(value ? String(value.value) : '')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // 주소가 바뀌면(뒤로 가기·초기화) 입력값도 맞춘다. 입력 중인 값과 같으면 그대로 둔다
  useEffect(() => setDraft((d) => (value && Number(d) === value.value ? d : value ? String(value.value) : '')), [value])
  useEffect(() => () => clearTimeout(timer.current), [])

  const valid = (text: string, stat: StatMin['stat']) => {
    const n = Number(text)
    return text.trim() !== '' && Number.isInteger(n) && n >= 1 && n <= statMax(stat) ? n : null
  }

  const commit = (text: string, replace: boolean) => {
    clearTimeout(timer.current)
    if (!value) return
    const n = valid(text, value.stat)
    if (n !== null && n !== value.value) onChange({ stat: value.stat, value: n }, { replace })
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
            onChange={(e) => {
              const text = e.target.value
              setDraft(text)
              clearTimeout(timer.current)
              timer.current = setTimeout(() => commit(text, true), TYPING_DELAY)
            }}
            onBlur={() => {
              commit(draft, true)
              if (valid(draft, value.stat) === null) setDraft(String(value.value))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(draft, true)
            }}
          />
          <span aria-hidden="true">이상</span>
        </label>
      )}
    </div>
  )
}
