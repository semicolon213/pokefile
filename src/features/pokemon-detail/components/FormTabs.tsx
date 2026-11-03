import type { FormKey } from '@/shared/models'
import { FORM_LABELS } from '../model/labels'

type Props = { forms: readonly FormKey[]; selected: FormKey; onSelect: (form: FormKey) => void }

// DESIGN.md §2.2: 메가진화가 있는 종만 [기본] [메가] / [기본] [메가X] [메가Y]를 표시한다.
export function FormTabs({ forms, selected, onSelect }: Props) {
  if (forms.length < 2) return null
  return (
    <div className="detail-form-tabs" role="group" aria-label="폼 선택">
      {forms.map((form) => (
        <button
          key={form}
          type="button"
          className="detail-form-tab"
          aria-pressed={form === selected}
          onClick={() => onSelect(form)}
        >
          {FORM_LABELS[form]}
        </button>
      ))}
    </div>
  )
}
