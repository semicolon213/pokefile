import { parseFormKey } from '@/shared/models'
import type { FormKey } from '@/shared/models'

/** 종이 가진 폼 목록: 항상 기본 폼이 먼저, 그다음 6세대 메가 (ADR-008·011) */
export function availableForms(megaForms: readonly Exclude<FormKey, 'default'>[]): FormKey[] {
  return ['default', ...megaForms]
}

/** `?form=` 값 → 실제 표시할 폼. 없거나 잘못되었거나 이 종에 없는 폼이면 기본 폼 (ADR-011) */
export function resolveFormKey(param: string | null | undefined, available: readonly FormKey[]): FormKey {
  const requested = parseFormKey(param)
  return available.includes(requested) ? requested : 'default'
}

/** PokéAPI `/pokemon/{name}` 조회용 이름. 메가는 `{species-name}-{formKey}` (ADR-009, 48종 실측 일치) */
export function pokemonResourceName(speciesName: string, formKey: Exclude<FormKey, 'default'>): string {
  return `${speciesName}-${formKey}`
}
