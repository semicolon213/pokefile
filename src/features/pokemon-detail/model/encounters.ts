import { SCOPE } from '@/shared/config/scope'
import type { Generation } from '@/shared/models'
import type { RawEncounter } from '../api/pokeapi'
import { encounterMethodLabel } from './encounterMethodsKo'
import LOCATION_NAMES from './locationNamesKo.json'

/**
 * 출현 장소를 표시할 게임 버전 (표시 순서). 한국어 이름은 PokéAPI `/version/{name}` `names[ko]` 실측값(2026-11-03).
 * 목록은 지원 범위 설정(shared/config/scope.json, ADR-015)에서 가져온다.
 */
export const ENCOUNTER_VERSIONS: readonly { version: string; label: string; generation: Generation }[] = SCOPE.gameVersions

export const GENERATION_NAMES: Record<Generation, string> = Object.fromEntries(SCOPE.generations.map((g) => [g.id, g.name]))

export type EncounterLocation = {
  /** PokéAPI location 식별자 (구역 location-area를 합친 단위) */
  location: string
  label: string
  minLevel: number
  maxLevel: number
  /** 만나는 방법 한국어 표기. 중복 없이 처음 나온 순서 */
  methods: string[]
}

export type VersionEncounters = {
  version: string
  label: string
  generation: Generation
  locations: EncounterLocation[]
}

/**
 * 장소 이름표 (locationNamesKo.json, OQ-18 → 2026-11-11 한국어 표기로 변경).
 * 키는 PokéAPI location 식별자. 지원 게임에 나오는 563곳: PokéAPI ko 194 · 포켓몬 위키 '국가별 지역 이름 목록'과 문서 225 ·
 * 규칙(N번도로·N번수로·배회 등) 120, 한국어를 찾지 못한 24곳은 PokéAPI 영어 이름이다.
 */
const LOCATION_NAMES_KO: Readonly<Record<string, string>> = LOCATION_NAMES
// 긴 이름부터 맞춰야 'mt-moon-square'가 'mt-moon'으로 잘못 묶이지 않는다
const LOCATION_KEYS = Object.keys(LOCATION_NAMES_KO).sort((a, b) => b.length - a.length)

/** 표에 없는 장소: API 식별자를 영문 표기로 바꾼다. 예: 'viridian-forest-area' → 'Viridian Forest' */
export function formatLocationArea(area: string): string {
  return area
    .replace(/-area$/, '')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * location-area 식별자 → 장소(location)와 표시 이름. 구역 이름은 항상 장소 이름으로 시작한다(1,424개 구역 실측).
 * 예: 'mt-moon-b1f' → { location: 'mt-moon', label: '달맞이산' }
 */
export function resolveLocation(area: string): { location: string; label: string } {
  const key = LOCATION_KEYS.find((name) => area === name || area.startsWith(`${name}-`))
  if (key) return { location: key, label: LOCATION_NAMES_KO[key] }
  const location = area.replace(/-area$/, '')
  return { location, label: formatLocationArea(area) }
}

/**
 * encounters 응답 → 지원 버전만, ADR-008 버전 순서로 묶는다.
 * 같은 장소의 여러 구역(1F·B1F·바깥 등)은 한 줄로 합치고 레벨은 최소~최대, 만나는 방법은 모두 모은다.
 */
export function toVersionEncounters(raw: readonly RawEncounter[]): VersionEncounters[] {
  return ENCOUNTER_VERSIONS.flatMap(({ version, label, generation }) => {
    const byLocation = new Map<string, EncounterLocation>()
    for (const encounter of raw) {
      const detail = encounter.version_details.find((v) => v.version.name === version)
      if (!detail || detail.encounter_details.length === 0) continue
      const { location, label: locationLabel } = resolveLocation(encounter.location_area.name)
      const entry = byLocation.get(location) ?? { location, label: locationLabel, minLevel: Infinity, maxLevel: -Infinity, methods: [] }
      for (const d of detail.encounter_details) {
        entry.minLevel = Math.min(entry.minLevel, d.min_level)
        entry.maxLevel = Math.max(entry.maxLevel, d.max_level)
        const method = encounterMethodLabel(d.method.name)
        if (!entry.methods.includes(method)) entry.methods.push(method)
      }
      byLocation.set(location, entry)
    }
    const locations = [...byLocation.values()]
    return locations.length > 0 ? [{ version, label, generation, locations }] : []
  })
}

/** 내 게임(FR-26)이 정해져 있으면 그 게임의 출현 장소만 남긴다. version이 없으면 그대로 */
export function filterEncountersByGame(entries: readonly VersionEncounters[], version: string | null): VersionEncounters[] {
  return version ? entries.filter((entry) => entry.version === version) : [...entries]
}
