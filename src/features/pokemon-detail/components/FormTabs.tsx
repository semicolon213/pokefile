import type { FormKey } from '@/shared/models'
import type { FormOption } from '../model/forms'

type Props = { forms: readonly FormOption[]; selected: FormKey; onSelect: (form: FormKey) => void }

// DESIGN.md §2.2: 폼이 있는 종만 [기본] [메가X] [거다이맥스] … 를 표시한다. 폼이 많은 종의 선택 방식은 TASK-024.
export function FormTabs({ forms, selected, onSelect }: Props) {
  if (forms.length < 2) return null
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
