import { parseFormKey } from '@/shared/models'
import type { FormKey, PokemonForm } from '@/shared/models'
import { formLabel } from '@/shared/utils'

/** 폼 탭 한 개 */
export type FormOption = { key: FormKey; label: string }

/** 폼 탭 표기. 단순 메가는 DESIGN.md §2.2대로 짧게 [메가] [메가X], 나머지는 인덱스의 폼 이름 (ADR-016) */
function tabLabel(form: PokemonForm): string {
  const mega = form.category === 'mega' ? form.key.match(/^mega(?:-([xyz]))?$/) : null
  return mega ? `메가${(mega[1] ?? '').toUpperCase()}` : formLabel(form)
}

/** 종이 가진 폼 목록: 항상 기본 폼이 먼저, 그다음 인덱스 순서 (ADR-011·016) */
export function availableForms(forms: readonly PokemonForm[]): FormOption[] {
  return [{ key: 'default', label: '기본' }, ...forms.map((form) => ({ key: form.key, label: tabLabel(form) }))]
}

/** `?form=` 값 → 실제 표시할 폼. 없거나 잘못되었거나 이 종에 없는 폼이면 기본 폼 (ADR-011) */
export function resolveFormKey(param: string | null | undefined, available: readonly FormOption[]): FormKey {
  const requested = parseFormKey(param)
  return available.some((form) => form.key === requested) ? requested : 'default'
}

/** PokéAPI `/pokemon/{name}` 조회용 이름. `{species-name}-{formKey}` (ADR-016, 326개 폼 실측 일치) */
export function pokemonResourceName(speciesName: string, formKey: Exclude<FormKey, 'default'>): string {
  return `${speciesName}-${formKey}`
}
