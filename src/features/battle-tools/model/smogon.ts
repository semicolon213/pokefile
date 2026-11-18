import { ApiError } from '@/shared/api'
import type { FormKey } from '@/shared/models'
import { isGen6MegaStone, megaStoneFor, toShowdownId } from '@/shared/utils'
import { isMegaForm, supportsSmogonForm } from './generations'

export type SmogonIdentity = { speciesName: string; formKey: FormKey }

const STAT_NAMES = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const
type StatName = (typeof STAT_NAMES)[number]
export type SmogonStatSpread = Partial<Record<StatName, number>>

export type SmogonSet = {
  name: string
  moves: string[][]
  abilities: string[]
  items: string[]
  natures: string[]
  evs: SmogonStatSpread[]
  ivs: SmogonStatSpread[]
}

export type SmogonFormat = { format: string; sets: SmogonSet[] }
export type SmogonSpecies = { speciesName: string; formats: SmogonFormat[] }

// ADR-009에서 제외한 포맷. 일반 포맷의 표시 여부·우선순위는 OQ-19에서 결정한다.
const NON_STANDARD_FORMATS = new Set([
  'balancedhackmons', 'purehackmons', 'almostanyability', 'stabmons', 'cap',
  'mixandmega', 'godlygift', 'camomons', 'partnersincrime',
])

function invalidData(): never {
  throw new ApiError('parse', '실전 세팅 데이터 형식이 올바르지 않습니다.')
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return invalidData()
  return value as Record<string, unknown>
}

function choices(value: unknown): string[] {
  if (value === undefined) return []
  const values = Array.isArray(value) ? value : [value]
  return values.map((choice) => {
    if (typeof choice !== 'string' || !choice.trim()) return invalidData()
    return choice
  })
}

function spreads(value: unknown): SmogonStatSpread[] {
  if (value === undefined) return []
  const values = Array.isArray(value) ? value : [value]
  return values.map((entry) => {
    const spread = record(entry)
    for (const [stat, amount] of Object.entries(spread)) {
      if (!(STAT_NAMES as readonly string[]).includes(stat)
        || typeof amount !== 'number' || !Number.isInteger(amount) || amount < 0) {
        return invalidData()
      }
    }
    return { ...spread } as SmogonStatSpread
  })
}

function normalizeSet(name: string, value: unknown): SmogonSet {
  if (!name.trim()) return invalidData()
  const set = record(value)
  if (set.moves !== undefined && !Array.isArray(set.moves)) return invalidData()
  return {
    name,
    moves: ((set.moves ?? []) as unknown[]).map(choices),
    abilities: choices(set.ability),
    items: choices(set.item),
    natures: choices(set.nature),
    evs: spreads(set.evs),
    ivs: spreads(set.ivs),
  }
}

// API_SPEC §5: species → format → set name → fields.
// 원문의 후보를 보존한다. 번역·기본 포맷·누락 값은 추정하지 않는다.
export function normalizeSmogonSets(value: unknown): SmogonSpecies[] {
  const speciesIds = new Set<string>()
  return Object.entries(record(value)).map(([speciesName, rawFormats]) => {
    const speciesId = toShowdownId(speciesName)
    if (!speciesId || speciesIds.has(speciesId)) return invalidData()
    speciesIds.add(speciesId)
    const formats: SmogonFormat[] = []
    for (const [format, rawSets] of Object.entries(record(rawFormats))) {
      if (!format.trim()) return invalidData()
      if (NON_STANDARD_FORMATS.has(format.toLowerCase())) continue
      formats.push({
        format,
        sets: Object.entries(record(rawSets)).map(([name, set]) => normalizeSet(name, set)),
      })
    }
    return { speciesName, formats }
  })
}

export const normalizeGen6SmogonSets = normalizeSmogonSets

// PokéAPI와 Showdown의 이름 차이. pkmn/smogon 세대 파일과 Showdown pokedex의 이름을 대조한다.
const FORM_NAMES: Readonly<Record<string, string>> = {
  darmanitangalarstandard: 'Darmanitan-Galar',
  darmanitangalarzen: 'Darmanitan-Galar-Zen',
  taurospaldeacombatbreed: 'Tauros-Paldea-Combat',
  taurospaldeablazebreed: 'Tauros-Paldea-Blaze',
  taurospaldeaaquabreed: 'Tauros-Paldea-Aqua',
  indeedeefemale: 'Indeedee-F',
  meowsticfemale: 'Meowstic-F',
  meowsticmalemega: 'Meowstic-Mega',
  meowsticfemalemega: 'Meowstic-F-Mega',
  basculegionfemale: 'Basculegion-F',
  oinkolognefemale: 'Oinkologne-F',
  urshifusinglestrikegmax: 'Urshifu-Gmax',
  necrozmadusk: 'Necrozma-Dusk-Mane',
  necrozmadawn: 'Necrozma-Dawn-Wings',
  ogerponwellspringmask: 'Ogerpon-Wellspring',
  ogerponhearthflamemask: 'Ogerpon-Hearthflame',
  ogerponcornerstonemask: 'Ogerpon-Cornerstone',
}

function smogonFormName({ speciesName, formKey }: SmogonIdentity): string {
  const name = `${speciesName}-${formKey}`
  return FORM_NAMES[toShowdownId(name)] ?? name
}

function isMegaRayquazaSet(format: string, set: SmogonSet): boolean {
  return format.toLowerCase() === 'anythinggoes'
    && set.moves.some((slot) => slot.some((move) => toShowdownId(move) === 'dragonascent'))
}

/** species.name과 정확히 매핑된 후보. 폼 판별·메가스톤 병합·표시 포맷 선택은 수행하지 않는다. */
export function findSpeciesSmogonSets(data: SmogonSpecies[], speciesName: string): SmogonFormat[] {
  const id = toShowdownId(speciesName)
  if (!id) return []
  return data.find((entry) => toShowdownId(entry.speciesName) === id)?.formats ?? []
}

/** ADR-009: 선택한 폼에 맞는 후보만 합친다. 원본 데이터와 다른 폼의 후보는 변경하지 않는다. */
export function selectSmogonSets(data: SmogonSpecies[], identity: SmogonIdentity, generation = 6): SmogonFormat[] {
  const { speciesName, formKey } = identity
  if (!supportsSmogonForm(generation, formKey)) return []
  const base = findSpeciesSmogonSets(data, speciesName)
  const merged = new Map<string, SmogonSet[]>()
  const fingerprints = new Map<string, Set<string>>()
  const add = (format: string, set: SmogonSet) => {
    const key = JSON.stringify(set)
    const seen = fingerprints.get(format) ?? new Set<string>()
    if (seen.has(key)) return
    seen.add(key)
    fingerprints.set(format, seen)
    merged.set(format, [...(merged.get(format) ?? []), set])
  }

  if (formKey === 'default') {
    for (const { format, sets } of base) for (const set of sets) {
      if (toShowdownId(speciesName) === 'rayquaza' && (generation === 6 || generation === 7)
        && isMegaRayquazaSet(format, set)) continue
      const items = set.items.filter((item) => !isGen6MegaStone(item))
      if (set.items.length > 0 && items.length === 0) continue
      add(format, { ...set, items })
    }
  } else if (isMegaForm(formKey)) {
    if (toShowdownId(speciesName) === 'rayquaza' && formKey === 'mega') {
      for (const { format, sets } of base) for (const set of sets) {
        if (isMegaRayquazaSet(format, set)) add(format, {
          ...set,
          moves: set.moves.map((slot) => slot.some((move) => toShowdownId(move) === 'dragonascent')
            ? slot.filter((move) => toShowdownId(move) === 'dragonascent') : slot),
        })
      }
      return [...merged].map(([format, sets]) => ({ format, sets }))
    }
    const stone = megaStoneFor(speciesName, formKey)
    for (const { format, sets } of base) for (const set of sets) {
      if (!stone) continue
      const items = set.items.filter((item) => toShowdownId(item) === toShowdownId(stone))
      if (items.length > 0) add(format, { ...set, items })
    }
    const exactForm = findSpeciesSmogonSets(data, smogonFormName(identity))
    for (const { format, sets } of exactForm) for (const set of sets) add(format, set)
  } else {
    for (const { format, sets } of findSpeciesSmogonSets(data, smogonFormName(identity))) {
      for (const set of sets) add(format, set)
    }
  }
  return [...merged].map(([format, sets]) => ({ format, sets }))
}
