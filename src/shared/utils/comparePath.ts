import type { FormKey, PokemonId } from '@/shared/models'

/** 비교 화면 경로 (FR-25, TASK-022). 포켓몬 A(와 폼)를 미리 고른 상태로 연다 */
export function comparePath(a?: { id: PokemonId; form?: FormKey }): string {
  if (!a) return '/compare'
  const params = new URLSearchParams({ a: String(a.id) })
  if (a.form && a.form !== 'default') params.set('af', a.form)
  return `/compare?${params}`
}
