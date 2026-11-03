import { POKEMON_TYPES } from '@/shared/models'
import type { PokemonType } from '@/shared/models'
import type { RawAbility, RawPokemon, RawPokemonForm, RawSpecies } from '../api/pokeapi'
import { idFromResourceUrl } from '../api/pokeapi'

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
  /** ADR-013: showdown GIF → PNG 순서. 대체 아이콘은 화면에서 처리 */
  imageUrls: string[]
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

export function toFormDetail(raw: RawPokemon): PokemonFormDetail {
  const showdown = raw.sprites.other?.showdown?.front_default
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
    imageUrls: [showdown, raw.sprites.front_default].filter((url): url is string => !!url),
    formResourceName: raw.forms[0]?.name,
  }
}

/**
 * 한국어 도감 설명 버전 우선순위 (OQ-17 제안값: x, 없으면 omega-ruby).
 * 실측상 721종 모두 x·y·omega-ruby·alpha-sapphire에 ko 설명이 있으므로 같은 6세대 버전을 이어서 찾는다.
 */
export const FLAVOR_TEXT_VERSIONS = ['x', 'omega-ruby', 'y', 'alpha-sapphire'] as const

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

/** 특성 표시 이름: 한국어 → 영어 → API 식별자 */
export function abilityNameKo(raw: RawAbility): string {
  return localized(raw.names, 'ko')?.name ?? localized(raw.names, 'en')?.name ?? raw.name
}

export function statTotal(stats: readonly BaseStat[]): number {
  return stats.reduce((sum, stat) => sum + stat.value, 0)
}
