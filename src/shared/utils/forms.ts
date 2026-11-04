import type { PokemonForm } from '@/shared/models'

/** 폼 탭 표기: 한국어 폼 이름, 없으면 영문 (ADR-016) */
export function formLabel(form: Pick<PokemonForm, 'nameKo' | 'nameEn'>): string {
  return form.nameKo ?? form.nameEn
}

/**
 * 폼까지 붙인 포켓몬 이름 (ADR-016).
 * 메가·워시로토무처럼 폼 이름에 종 이름이 이미 들어 있으면 그대로, 거다이맥스는 '거다이맥스 리자몽',
 * 그 밖은 '라이츄 (알로라의 모습)'처럼 종 이름 뒤에 괄호로 붙인다.
 */
export function formFullName(speciesName: string, form: Pick<PokemonForm, 'nameKo' | 'nameEn' | 'category'>): string {
  const label = formLabel(form)
  if (form.category === 'gmax' && form.nameKo === '거다이맥스') return `거다이맥스 ${speciesName}`
  if (label.includes(speciesName)) return label
  return `${speciesName} (${label})`
}
