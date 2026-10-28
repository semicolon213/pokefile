// DESIGN.md §7.1 공통 모델 (ADR-008·009 확정) — 변경 시 영향 담당자 전원 합의 필요

/** 지원 범위: 전국도감 #1~#721 (1~6세대, ADR-008) */
export const MAX_POKEMON_ID = 721

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

/** 폼 구분. 메가는 독립 포켓몬이 아니라 기본 포켓몬의 폼이다 (6세대 메가만, ADR-008·009) */
export const FORM_KEYS = ['default', 'mega', 'mega-x', 'mega-y'] as const
export type FormKey = (typeof FORM_KEYS)[number]

/** `?form=` 값 → FormKey. 없거나 잘못된 값이면 'default' (ADR-011) */
export function parseFormKey(value: string | null | undefined): FormKey {
  return (FORM_KEYS as readonly string[]).includes(value ?? '') ? (value as FormKey) : 'default'
}

/** PokéAPI generation 식별자 (지원 범위 1~6세대) */
export const GENERATIONS = [
  'generation-i',
  'generation-ii',
  'generation-iii',
  'generation-iv',
  'generation-v',
  'generation-vi',
] as const
export type Generation = (typeof GENERATIONS)[number]

/** PokéAPI 타입 식별자. 6세대 기준이므로 현재 타입을 그대로 사용한다 (ADR-008) */
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
  /** 이 종이 가진 6세대 메가 폼 (없으면 빈 배열) */
  megaForms: Exclude<FormKey, 'default'>[]
}
