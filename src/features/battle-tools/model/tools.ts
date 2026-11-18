import { isPokemonId, parseFormKey } from '@/shared/models'
import type { FormKey, PokemonId } from '@/shared/models'

export type PokemonSelection = { id: PokemonId; speciesName: string; formKey: FormKey }
export const FORM_LABELS: Record<FormKey, string> = { default: '기본', mega: '메가', 'mega-x': '메가X', 'mega-y': '메가Y' }
export type PokemonTools = {
  speciesName: string
  normalImages: string[]
  shinyImages: string[]
  cries: string[]
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function imageUrls(...values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => {
    if (typeof value !== 'string') return false
    try { return new URL(value).protocol === 'https:' } catch { return false }
  }))]
}

export function pokemonResource(selection: PokemonSelection): string {
  if (!isPokemonId(selection.id) || parseFormKey(selection.formKey) !== selection.formKey) throw new Error('지원하지 않는 포켓몬입니다.')
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
  const sprites = object(data.sprites)
  const showdown = object(object(sprites?.other)?.showdown)
  const cries = object(data.cries)
  return {
    speciesName,
    normalImages: imageUrls(showdown?.front_default, sprites?.front_default),
    shinyImages: imageUrls(showdown?.front_shiny, sprites?.front_shiny),
    cries: imageUrls(cries?.latest, cries?.legacy),
  }
}
