import { SCOPE } from '@/shared/config/scope'
import { POKEMON_TYPES } from '@/shared/models'
import type { PokemonType } from '@/shared/models'
import type { RawAbility, RawPokemon, RawPokemonForm, RawSpecies } from '../api/pokeapi'
import { idFromResourceUrl } from '../api/pokeapi'
import { ABILITY_DESCRIPTIONS_KO, ABILITY_NAMES_KO } from './abilityDescriptionsKo'
import { baseFormImageUrls } from './images'

export const STAT_KEYS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const
export type StatKey = (typeof STAT_KEYS)[number]

export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  attack: '공격',
  defense: '방어',
  'special-attack': '특수공격',
  'special-defense': '특수방어',
  speed: '스피드',
}

export type BaseStat = { key: StatKey; label: string; value: number }

/** 폼 단위 정보: 이미지·타입·특성·종족값은 폼마다 다르다 (DESIGN.md §2.2) */
export type PokemonFormDetail = {
  resourceName: string
  /** 키(m) */
  heightM: number
  /** 몸무게(kg) */
  weightKg: number
  types: PokemonType[]
  abilities: { name: string; hidden: boolean }[]
  stats: BaseStat[]
  /** ADR-016: showdown GIF → PNG → HOME 일러스트. 기본이 아닌 폼에 이미지가 하나도 없으면 기본 폼 이미지. 대체 아이콘은 화면에서 처리 */
  imageUrls: string[]
  /** FR-23: 같은 폼의 이로치 후보. 일반 이미지로 대체하지 않는다. */
  shinyImageUrls: string[]
  cryUrls: string[]
  formResourceName?: string
}

/** 종 단위 정보: 이름·분류·도감 설명·진화는 폼과 무관하다 */
export type SpeciesDetail = {
  id: number
  name: string
  nameKo?: string
  nameEn: string
  genus?: string
  flavorText?: string
  evolutionChainId: number | null
}

const isPokemonType = (value: string): value is PokemonType => (POKEMON_TYPES as readonly string[]).includes(value)

function localized<T extends { language: { name: string } }>(entries: T[], lang: string): T | undefined {
  return entries.find((entry) => entry.language.name === lang)
}

const presentUrls = (urls: readonly (string | null | undefined)[]): string[] => [
  ...new Set(urls.filter((url): url is string => !!url)),
]

/**
 * 폼 이미지 후보. 기본 폼 이미지는 선택한 폼의 이미지가 하나도 없을 때만 쓴다 (ADR-016, 예: 코라이돈 변신 모습).
 * 폼 이미지가 하나라도 있으면 기본 폼 후보를 붙이지 않는다: 움직임 줄이기에서 정적 이미지를 앞으로 옮기면
 * 선택 폼의 GIF보다 기본 폼 PNG가 먼저 나와 다른 모습을 보여 주게 된다 (#44 QA).
 */
function formImageUrls(own: (string | null | undefined)[], baseId: number | undefined): string[] {
  const urls = presentUrls(own)
  return urls.length === 0 && baseId !== undefined ? baseFormImageUrls(baseId) : urls
}

/** baseId: 기본이 아닌 폼이면 그 종의 번호. 폼 이미지가 모두 없을 때 기본 폼 이미지로 대신한다 (ADR-016) */
export function toFormDetail(raw: RawPokemon, baseId?: number): PokemonFormDetail {
  const { showdown, home } = raw.sprites.other ?? {}
  return {
    resourceName: raw.name,
    // PokéAPI 단위: height = 데시미터, weight = 헥토그램
    heightM: raw.height / 10,
    weightKg: raw.weight / 10,
    types: [...raw.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name).filter(isPokemonType),
    abilities: [...raw.abilities]
      .sort((a, b) => a.slot - b.slot)
      .map((a) => ({ name: a.ability.name, hidden: a.is_hidden })),
    stats: STAT_KEYS.flatMap((key) => {
      const stat = raw.stats.find((s) => s.stat.name === key)
      return stat ? [{ key, label: STAT_LABELS[key], value: stat.base_stat }] : []
    }),
    imageUrls: formImageUrls([showdown?.front_default, raw.sprites.front_default, home?.front_default], baseId),
    // 이로치는 같은 폼의 이미지만 쓴다(일반·기본 폼 이미지로 대체하지 않음, FR-23)
    shinyImageUrls: presentUrls([showdown?.front_shiny, raw.sprites.front_shiny, home?.front_shiny]),
    cryUrls: presentUrls([raw.cries?.latest, raw.cries?.legacy]),
    formResourceName: raw.forms[0]?.name,
  }
}

/**
 * 한국어 도감 설명 버전 우선순위 (OQ-17 제안값: x, 없으면 omega-ruby, 그다음 scope.json 순서).
 * #899~#1025는 PokéAPI에 ko 설명이 없어 undefined(정보 없음)가 된다 (ADR-016).
 */
export const FLAVOR_TEXT_VERSIONS = SCOPE.flavorTextVersions

export function pickFlavorText(entries: RawSpecies['flavor_text_entries']): string | undefined {
  const ko = entries.filter((entry) => entry.language.name === 'ko')
  for (const version of FLAVOR_TEXT_VERSIONS) {
    const entry = ko.find((e) => e.version.name === version)
    if (entry) return entry.flavor_text.replace(/[\s­]+/g, ' ').trim()
  }
  return undefined
}

export function toSpeciesDetail(raw: RawSpecies): SpeciesDetail {
  return {
    id: raw.id,
    name: raw.name,
    nameKo: localized(raw.names, 'ko')?.name,
    nameEn: localized(raw.names, 'en')?.name ?? raw.name,
    genus: localized(raw.genera, 'ko')?.genus ?? localized(raw.genera, 'en')?.genus,
    flavorText: pickFlavorText(raw.flavor_text_entries),
    evolutionChainId: raw.evolution_chain ? idFromResourceUrl(raw.evolution_chain.url) : null,
  }
}

/** 메가 폼 한국어 이름 (예: 메가리자몽X). `pokemon-form.form_names[ko]` (ADR-009) */
export function formNameKo(raw: RawPokemonForm): string | undefined {
  return localized(raw.form_names, 'ko')?.name
}

/** 특성 이름과 효과 설명 (FR-12, FR-30) */
export type AbilityInfo = {
  /** API 한국어 → 보충 이름표 → 영어 → API 식별자 */
  name: string
  /** 한국어 설명: API ko → 보충 설명표. 둘 다 없으면 undefined → 화면에서 '정보 없음' */
  description?: string
}

/** 특성 설명은 최신 판 문구를 우선한다(효과가 판마다 보정됨). 목록에 없는 판의 ko가 생기면 그중 마지막 것을 쓴다 */
export const ABILITY_TEXT_VERSION_GROUPS = [
  'sword-shield',
  'lets-go-pikachu-lets-go-eevee',
  'ultra-sun-ultra-moon',
  'sun-moon',
  'omega-ruby-alpha-sapphire',
  'x-y',
] as const

export function pickAbilityDescription(entries: RawAbility['flavor_text_entries']): string | undefined {
  const ko = entries.filter((entry) => entry.language.name === 'ko')
  const entry =
    ABILITY_TEXT_VERSION_GROUPS.map((group) => ko.find((e) => e.version_group.name === group)).find((e) => e) ?? ko.at(-1)
  return entry?.flavor_text.replace(/[\s­]+/g, ' ').trim() || undefined
}

export function toAbilityInfo(raw: RawAbility): AbilityInfo {
  return {
    name: localized(raw.names, 'ko')?.name ?? ABILITY_NAMES_KO[raw.name] ?? localized(raw.names, 'en')?.name ?? raw.name,
    description: pickAbilityDescription(raw.flavor_text_entries ?? []) ?? ABILITY_DESCRIPTIONS_KO[raw.name],
  }
}

export function statTotal(stats: readonly BaseStat[]): number {
  return stats.reduce((sum, stat) => sum + stat.value, 0)
}
