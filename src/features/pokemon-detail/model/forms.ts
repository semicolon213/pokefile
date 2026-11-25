import { parseFormKey } from '@/shared/models'
import type { FormCategory, FormKey, PokemonForm, PokemonId } from '@/shared/models'
import { formLabel } from '@/shared/utils'

/** 폼 탭 한 개. 기본 폼의 분류는 'default' */
export type FormOption = { key: FormKey; label: string; category: FormCategory | 'default' }

/**
 * 폼(기본 포함)이 이 수보다 많으면 탭 대신 분류별로 묶은 선택 상자로 보여 준다 (TASK-024).
 * 현재 해당 종은 피카츄(17)·메테노(14)뿐이고, 그다음으로 많은 종은 6개라 탭이 한두 줄에 들어간다.
 */
export const FORM_SELECT_THRESHOLD = 8

/** 선택 상자의 분류 묶음 이름과 순서 */
export const FORM_CATEGORY_LABELS: Readonly<Record<FormOption['category'], string>> = {
  default: '기본',
  mega: '메가진화',
  gmax: '거다이맥스',
  regional: '리전폼',
  other: '기타 폼',
}

/** 폼 탭 표기. 단순 메가는 DESIGN.md §2.2대로 짧게 [메가] [메가X], 나머지는 인덱스의 폼 이름 (ADR-016) */
function tabLabel(form: PokemonForm): string {
  const mega = form.category === 'mega' ? form.key.match(/^mega(?:-([xyz]))?$/) : null
  return mega ? `메가${(mega[1] ?? '').toUpperCase()}` : formLabel(form)
}

/** 종이 가진 폼 목록. CR-025-D04-DETAIL: 파밀리쥐는 세 식구를 먼저 표시한다. */
export function availableForms(forms: readonly PokemonForm[], pokemonId?: PokemonId): FormOption[] {
  const options = forms.map((form) => ({ key: form.key, label: tabLabel(form), category: form.category }))
  if (pokemonId === 925) {
    const three = options.find(({ key }) => key === 'family-of-three')
    return [
      ...(three ? [three] : []),
      { key: 'default', label: '네 식구', category: 'default' },
      ...options.filter(({ key }) => key !== 'family-of-three'),
    ]
  }
  return [
    { key: 'default', label: '기본', category: 'default' },
    ...options,
  ]
}

/** 선택 상자용: 분류 순서(FORM_CATEGORY_LABELS)대로 묶고, 묶음 안은 인덱스 순서. 빈 분류는 뺀다 */
export function groupFormsByCategory(forms: readonly FormOption[]): { category: FormOption['category']; label: string; forms: FormOption[] }[] {
  return (Object.keys(FORM_CATEGORY_LABELS) as FormOption['category'][]).flatMap((category) => {
    const inCategory = forms.filter((form) => form.category === category)
    return inCategory.length > 0 ? [{ category, label: FORM_CATEGORY_LABELS[category], forms: inCategory }] : []
  })
}

/** 없거나 잘못된 값은 첫 폼으로. 명시적 default는 실제 기본 폼을 유지한다. */
export function resolveFormKey(param: string | null | undefined, available: readonly FormOption[]): FormKey {
  const initial = available[0]?.key ?? 'default'
  if (!param) return initial
  const requested = parseFormKey(param)
  if (requested === 'default' && param !== 'default') return initial
  return available.some((form) => form.key === requested) ? requested : initial
}

/** PokéAPI `/pokemon/{name}` 조회용 이름. `{species-name}-{formKey}` (ADR-016, 326개 폼 실측 일치) */
export function pokemonResourceName(speciesName: string, formKey: Exclude<FormKey, 'default'>): string {
  return `${speciesName}-${formKey}`
}
