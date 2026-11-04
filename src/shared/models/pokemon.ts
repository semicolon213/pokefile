// DESIGN.md §7.1 공통 모델 (ADR-009·016 확정) — 변경 시 영향 담당자 전원 합의 필요
import { SCOPE } from '@/shared/config/scope'

/** 지원 범위의 마지막 전국도감 번호. 값은 shared/config/scope.json (ADR-015) */
export const MAX_POKEMON_ID = SCOPE.maxPokemonId

/** 전국도감 번호 = PokéAPI species id = 기본 폼 pokemon id */
export type PokemonId = number

export function isPokemonId(value: unknown): value is PokemonId {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_POKEMON_ID
}

/** URL 파라미터 등 문자열을 PokemonId로 변환한다. 범위 밖이거나 숫자가 아니면 null */
export function parsePokemonId(value: string | null | undefined): PokemonId | null {
  if (value == null || !/^\d+$/.test(value)) return null
  const id = Number(value)
  return isPokemonId(id) ? id : null
}

/**
 * 폼 구분 (ADR-016). 기본 폼은 'default', 그 밖의 폼은 PokéAPI pokemon 이름에서 '{종 이름}-'을 뺀 부분이다.
 * 예: charizard-mega-x → 'mega-x', charizard-gmax → 'gmax', raichu-alola → 'alola', rotom-wash → 'wash'
 */
export type FormKey = string

const FORM_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** `?form=` 값 → FormKey. 없거나 형식이 잘못된 값이면 'default'. 이 종에 있는 폼인지는 호출하는 쪽이 확인한다 (ADR-011) */
export function parseFormKey(value: string | null | undefined): FormKey {
  return value && FORM_KEY_PATTERN.test(value) ? value : 'default'
}

/** 폼 분류 (ADR-016): 메가진화 · 거다이맥스 · 리전폼 · 기타 */
export type FormCategory = 'mega' | 'gmax' | 'regional' | 'other'

/** 기본 폼이 아닌 폼 한 개. 정적 검색 인덱스의 forms 항목 */
export type PokemonForm = {
  key: Exclude<FormKey, 'default'>
  /** 폼 이름(탭 표기). 메가는 전체 이름(메가리자몽X), 그 밖은 폼 이름만(알로라의 모습, 워시로토무) */
  nameKo?: string
  nameEn: string
  category: FormCategory
  types: PokemonType[]
  /** 전투 중에만 나오는 폼 (메가·거다이맥스·달마모드 등) */
  battleOnly: boolean
}

/** PokéAPI generation 식별자 (예: 'generation-i'). 지원 세대 목록은 shared/config/scope.json */
export type Generation = string
export const GENERATIONS: readonly Generation[] = SCOPE.generations.map((g) => g.id)

/** PokéAPI 타입 식별자. 6세대 이후 타입 변경이 없어 현재 타입을 그대로 사용한다 (ADR-016) */
export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const
export type PokemonType = (typeof POKEMON_TYPES)[number]

/** 목록·검색용 요약. 정적 검색 인덱스(public/data/pokedex-index.json, ADR-010) 한 항목과 같은 형태 */
export type PokemonSummary = {
  id: PokemonId
  nameEn: string
  /** 한국어 이름이 없으면 화면에 nameEn을 표시한다 */
  nameKo?: string
  types: PokemonType[]
  generation: Generation
  /** 기본 폼이 아닌 폼 (없으면 빈 배열, ADR-016) */
  forms: PokemonForm[]
}
