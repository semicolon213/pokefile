import { damageTaken, typeEffectiveness } from '@/features/type-chart'
import { POKEMON_TYPES, isPokemonId, parseFormKey } from '@/shared/models'
import type { FormKey, PokemonId, PokemonSummary, PokemonType } from '@/shared/models'
import { displayName, formFullName } from '@/shared/utils'

// FR-33 파티 타입 분석 (TASK-026, DESIGN §2.4.3).
// 타입만으로 계산한다: 특성(부유·저수 등)·테라스탈·실제 기술은 반영하지 않는다.

export const TEAM_SIZE = 6
export const TEAM_PARAM = 'p'
export const TEAM_STORAGE_KEY = 'pokefile:team'

/** 파티 한 자리: 종 번호 + 폼 ('default'는 기본 폼) */
export type Member = { id: PokemonId; form: FormKey }

/** 'id' 또는 'id:form' 한 개 → 자리. 형식이 틀리면 null */
export function parseMember(value: string): Member | null {
  const [idText, formText, ...rest] = value.split(':')
  if (rest.length > 0 || !/^\d+$/.test(idText)) return null
  const id = Number(idText)
  if (!isPokemonId(id)) return null
  return { id, form: formText === undefined ? 'default' : parseFormKey(formText) }
}

export const formatMember = (member: Member) => (member.form === 'default' ? String(member.id) : `${member.id}:${member.form}`)

/** URL·저장값의 자리 목록 → 파티. 형식이 틀린 값은 버리고 6자리까지만 쓴다 */
export function parseTeam(values: readonly string[]): Member[] {
  return values
    .map(parseMember)
    .filter((m): m is Member => m !== null)
    .slice(0, TEAM_SIZE)
}

/** 주소의 파티를 바꾼 새 쿼리. 다른 쿼리(game 등)는 그대로 둔다 */
export function writeTeam(params: URLSearchParams, team: readonly Member[]): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete(TEAM_PARAM)
  team.forEach((member) => next.append(TEAM_PARAM, formatMember(member)))
  return next
}

export type TeamEntry = { member: Member; summary: PokemonSummary; types: PokemonType[] }

/** 파티 자리의 표시 이름: 기본 폼이면 종 이름, 아니면 폼까지 붙인 이름 (메가리자몽X, 라이츄 (알로라의 모습)) */
export function memberName({ member, summary }: Pick<TeamEntry, 'member' | 'summary'>): string {
  const form = summary.forms.find((f) => f.key === member.form)
  return form ? formFullName(displayName(summary), form) : displayName(summary)
}

/**
 * 인덱스에 맞춘 파티: 인덱스에 없는 번호는 버리고, 없는 폼은 기본 폼으로 본다.
 * 각 자리의 요약·타입을 함께 돌려준다.
 */
export function resolveTeam(
  team: readonly Member[],
  index: readonly PokemonSummary[],
): TeamEntry[] {
  const byId = new Map(index.map((p) => [p.id, p]))
  return team.flatMap((member) => {
    const summary = byId.get(member.id)
    if (!summary) return []
    const form = member.form === 'default' ? undefined : summary.forms.find((f) => f.key === member.form)
    return [{ member: { id: member.id, form: form ? form.key : 'default' }, summary, types: form ? form.types : summary.types }]
  })
}

export type DefenseRow = {
  attack: PokemonType
  /** 파티 순서대로 받는 피해 배율 */
  multipliers: number[]
  /** 약점(2배 이상) 마릿수 */
  weak: number
  /** 반감·무효(½배 이하) 마릿수 */
  resist: number
  /** 주의 타입: 약점 3마리 이상, 또는 약점 2마리 이상이면서 반감·무효 0마리 */
  caution: boolean
}

export function defenseRows(teamTypes: readonly (readonly PokemonType[])[]): DefenseRow[] {
  return POKEMON_TYPES.map((attack) => {
    const multipliers = teamTypes.map((types) => damageTaken(attack, types))
    const weak = multipliers.filter((m) => m >= 2).length
    const resist = multipliers.filter((m) => m <= 0.5).length
    return { attack, multipliers, weak, resist, caution: weak >= 3 || (weak >= 2 && resist === 0) }
  })
}

export type Suggestion = {
  type: PokemonType
  /** 이 타입이 반감·무효로 받는 주의 타입 */
  covers: PokemonType[]
  /** 이 타입의 약점 수 (18개 공격 타입 중) */
  weaknesses: number
}

/**
 * 보완 추천: 주의 타입을 반감·무효로 받는 단일 타입. 많이 막는 순, 같으면 약점이 적은 순, 그다음 타입 순서. 최대 3개.
 */
export function suggestTypes(cautions: readonly PokemonType[], limit = 3): Suggestion[] {
  if (cautions.length === 0) return []
  return POKEMON_TYPES.map((type) => ({
    type,
    covers: cautions.filter((attack) => typeEffectiveness(attack, type) <= 0.5),
    weaknesses: POKEMON_TYPES.filter((attack) => typeEffectiveness(attack, type) >= 2).length,
  }))
    .filter((s) => s.covers.length > 0)
    .sort((a, b) => b.covers.length - a.covers.length || a.weaknesses - b.weaknesses)
    .slice(0, limit)
}

/**
 * 자속 공격 범위: 파티 포켓몬의 타입으로 공격했을 때 효과가 굉장한(2배 이상) 단일 방어 타입과 닿지 않는 타입.
 */
export function stabCoverage(teamTypes: readonly (readonly PokemonType[])[]): {
  covered: PokemonType[]
  uncovered: PokemonType[]
} {
  const attacks = new Set(teamTypes.flat())
  const covered = POKEMON_TYPES.filter((defense) => [...attacks].some((attack) => typeEffectiveness(attack, defense) >= 2))
  return { covered, uncovered: POKEMON_TYPES.filter((t) => !covered.includes(t)) }
}

/** 저장된 파티. 저장소가 막히면 빈 파티 */
export function readStoredTeam(): Member[] {
  try {
    const raw = localStorage.getItem(TEAM_STORAGE_KEY)
    return raw ? parseTeam(raw.split(',')) : []
  } catch {
    return []
  }
}

export function storeTeam(team: readonly Member[]) {
  try {
    if (team.length > 0) localStorage.setItem(TEAM_STORAGE_KEY, team.map(formatMember).join(','))
    else localStorage.removeItem(TEAM_STORAGE_KEY)
  } catch {
    // 저장소가 막혀도 주소의 파티로 계속 동작한다
  }
}
