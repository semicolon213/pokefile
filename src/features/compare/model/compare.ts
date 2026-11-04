import { parseFormKey, parsePokemonId, type FormKey, type PokemonId, type PokemonType } from '@/shared/models'

// FR-25 두 포켓몬 능력치 비교 (TASK-022). 종족값을 나란히 놓고 차이를 보여 준다.

export const STATS = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: '공격' },
  { key: 'defense', label: '방어' },
  { key: 'special-attack', label: '특수공격' },
  { key: 'special-defense', label: '특수방어' },
  { key: 'speed', label: '스피드' },
] as const
export type StatKey = (typeof STATS)[number]['key']

/** 막대 길이 기준: 종족값 최댓값 255 (상세 종족값 차트와 같은 고정 눈금) */
export const STAT_MAX = 255

export type CompareStats = {
  /** PokéAPI species 이름 (폼 리소스 이름을 만들 때 쓴다) */
  speciesName: string
  types: PokemonType[]
  stats: Record<StatKey, number>
  imageUrls: string[]
}

export type Slot = 'a' | 'b'
export type Selection = { id: PokemonId; form: FormKey }

/** URL: /compare?a=6&af=mega-x&b=9 — 폼이 기본이면 af/bf를 쓰지 않는다 */
export function parseSelection(params: URLSearchParams, slot: Slot): Selection | null {
  const id = parsePokemonId(params.get(slot))
  return id === null ? null : { id, form: parseFormKey(params.get(`${slot}f`)) }
}

/** 한쪽을 바꾼 URL. 공유 링크가 늘 같은 모양이 되도록 a·af·b·bf 순서로 쓰고, 그 밖의 쿼리(game 등)는 뒤에 둔다 */
export function writeSelection(params: URLSearchParams, slot: Slot, selection: Selection | null): URLSearchParams {
  const picked = { a: parseSelection(params, 'a'), b: parseSelection(params, 'b'), [slot]: selection }
  const next = new URLSearchParams()
  for (const s of ['a', 'b'] as const) {
    const sel = picked[s]
    if (!sel) continue
    next.set(s, String(sel.id))
    if (sel.form !== 'default') next.set(`${s}f`, sel.form)
  }
  params.forEach((value, key) => {
    if (!['a', 'af', 'b', 'bf'].includes(key)) next.append(key, value)
  })
  return next
}

export function statTotal(stats: Record<StatKey, number>): number {
  return STATS.reduce((sum, { key }) => sum + stats[key], 0)
}

/** 'a'가 더 높으면 'a', 같으면 'tie' */
export function winner(a: number, b: number): Slot | 'tie' {
  return a === b ? 'tie' : a > b ? 'a' : 'b'
}
