import { useId } from 'react'
import type { FormKey } from '@/shared/models'
import { FORM_SELECT_THRESHOLD, groupFormsByCategory, type FormOption } from '../model/forms'

type Props = { forms: readonly FormOption[]; selected: FormKey; onSelect: (form: FormKey) => void }

// DESIGN.md §2.2: 폼이 있는 종만 [기본] [메가X] [거다이맥스] … 를 표시한다.
// TASK-024: 폼이 많은 종(피카츄·메테노)은 탭이 여러 줄로 늘어나므로 분류별로 묶은 선택 상자로 보여 준다.
export function FormTabs({ forms, selected, onSelect }: Props) {
  const selectId = useId()
  if (forms.length < 2) return null
  if (forms.length > FORM_SELECT_THRESHOLD) {
    return (
      <div className="detail-form-select">
        <label htmlFor={selectId}>폼 선택</label>
        <select id={selectId} value={selected} onChange={(e) => onSelect(e.target.value)}>
          {groupFormsByCategory(forms).map((group) => (
            <optgroup key={group.category} label={group.label}>
              {group.forms.map((form) => (
                <option key={form.key} value={form.key}>
                  {form.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <span className="detail-form-select__count">폼 {forms.length}개</span>
      </div>
    )
  }
  return (
    <div className="detail-form-tabs" role="group" aria-label="폼 선택">
      {forms.map((form) => (
        <button
          key={form.key}
          type="button"
          className="detail-form-tab"
          aria-pressed={form.key === selected}
          onClick={() => onSelect(form.key)}
        >
          {form.label}
        </button>
      ))}
    </div>
  )
}
