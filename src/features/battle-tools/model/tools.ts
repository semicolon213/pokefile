import { FORM_KEYS, isPokemonId, POKEMON_TYPES } from '@/shared/models'
import type { FormKey, PokemonId, PokemonType } from '@/shared/models'

export type PokemonSelection = { id: PokemonId; speciesName: string; formKey: FormKey }
export const STAT_KEYS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const
export type StatKey = typeof STAT_KEYS[number]
export type Stats = Record<StatKey, number>
export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP', attack: '공격', defense: '방어', 'special-attack': '특수공격', 'special-defense': '특수방어', speed: '스피드',
}
export const FORM_LABELS: Record<FormKey, string> = { default: '기본', mega: '메가', 'mega-x': '메가X', 'mega-y': '메가Y' }
export type PokemonTools = {
  speciesName: string
  types: PokemonType[] | null
  stats: Stats | null
  normalImages: string[]
  shinyImages: string[]
  cries: string[]
}

export function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

export function isPokemonType(value: unknown): value is PokemonType {
  return typeof value === 'string' && (POKEMON_TYPES as readonly string[]).includes(value)
}

export function generationNumber(value: unknown): number {
  const name = object(value)?.name
  const generations = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
  const index = generations.findIndex((roman) => name === `generation-${roman}`)
  if (index < 0) throw new Error('세대 정보를 확인할 수 없습니다.')
  return index + 1
}

/** past_*의 generation은 해당 값이 적용되는 마지막 세대다 (PokéAPI 공식 문서). */
export function histories(value: unknown): { data: Record<string, unknown>; generation: number }[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error('과거 데이터 형식 오류')
  return value.map((entry) => {
    const data = object(entry)
    if (!data) throw new Error('과거 데이터 형식 오류')
    return { data, generation: generationNumber(data.generation) }
  }).filter((entry) => entry.generation >= 6).sort((a, b) => a.generation - b.generation)
}

function typesFrom(value: unknown): PokemonType[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2) throw new Error('타입 형식 오류')
  const types = value.map((entry) => object(object(entry)?.type)?.name)
  if (!types.every(isPokemonType) || new Set(types).size !== types.length) throw new Error('지원하지 않는 타입')
  return types
}

function statsFrom(value: unknown, complete: boolean): Partial<Stats> {
  if (!Array.isArray(value)) throw new Error('종족값 형식 오류')
  const result: Partial<Stats> = {}
  for (const entry of value) {
    const item = object(entry)
    const name = object(item?.stat)?.name
    const stat = item?.base_stat
    if (typeof name !== 'string' || !(STAT_KEYS as readonly string[]).includes(name)
      || typeof stat !== 'number' || !Number.isInteger(stat) || stat < 1 || stat > 255
      || Object.hasOwn(result, name)) throw new Error('종족값 형식 오류')
    result[name as StatKey] = stat
  }
  if (complete && STAT_KEYS.some((key) => result[key] === undefined)) throw new Error('종족값 누락')
  return result
}

function imageUrls(...values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => {
    if (typeof value !== 'string') return false
    try { return new URL(value).protocol === 'https:' } catch { return false }
  }))]
}

export function pokemonResource(selection: PokemonSelection): string {
  if (!isPokemonId(selection.id) || !(FORM_KEYS as readonly string[]).includes(selection.formKey)) throw new Error('지원하지 않는 포켓몬입니다.')
  if (selection.formKey === 'default') return String(selection.id)
  if (!/^[a-z0-9-]+$/i.test(selection.speciesName)) throw new Error('종 이름을 확인할 수 없습니다.')
  return `${selection.speciesName.toLowerCase()}-${selection.formKey}`
}

export function normalizePokemonTools(raw: unknown, selection: PokemonSelection): PokemonTools {
  const resource = pokemonResource(selection)
  const data = object(raw)
  const species = object(data?.species)
  const speciesId = typeof species?.url === 'string' ? /\/pokemon-species\/(\d+)\/?$/.exec(species.url)?.[1] : undefined
  const speciesName = species?.name
  if (!data || Number(speciesId) !== selection.id || typeof speciesName !== 'string' || !/^[a-z0-9-]+$/.test(speciesName)
    || (selection.formKey !== 'default' && speciesName !== selection.speciesName.toLowerCase())
    || (selection.formKey === 'default' ? data.id !== selection.id : data.name !== resource)) {
    throw new Error('요청한 포켓몬·폼과 응답이 일치하지 않습니다.')
  }
  let types: PokemonType[] | null = null
  let stats: Stats | null = null
  try {
    const past = histories(data.past_types)[0]
    types = typesFrom(past ? past.data.types : data.types)
  } catch { /* 타입 영역만 정보 없음 */ }
  try {
    const values = statsFrom(data.stats, true)
    // 이력은 변경 항목만 제공한다. 가장 가까운 세대의 값이 각 항목에서 우선한다.
    for (const entry of histories(data.past_stats).reverse()) Object.assign(values, statsFrom(entry.data.stats, false))
    stats = values as Stats
  } catch { /* 미디어·상성은 계속 제공한다. */ }
  const sprites = object(data.sprites)
  const showdown = object(object(sprites?.other)?.showdown)
  const cries = object(data.cries)
  return {
    speciesName, types, stats,
    normalImages: imageUrls(showdown?.front_default, sprites?.front_default),
    shinyImages: imageUrls(showdown?.front_shiny, sprites?.front_shiny),
    cries: imageUrls(cries?.latest, cries?.legacy),
  }
}

export function statTotal(stats: Stats): number {
  return STAT_KEYS.reduce((total, key) => total + stats[key], 0)
}
