import { SCOPE } from '@/shared/config/scope'
import type { Generation } from '@/shared/models'
import type { RawEncounter } from '../api/pokeapi'

/**
 * 출현 장소를 표시할 게임 버전 (표시 순서). 한국어 이름은 PokéAPI `/version/{name}` `names[ko]` 실측값(2026-11-03).
 * 목록은 지원 범위 설정(shared/config/scope.json, ADR-015)에서 가져온다.
 */
export const ENCOUNTER_VERSIONS: readonly { version: string; label: string; generation: Generation }[] = SCOPE.gameVersions

export const GENERATION_NAMES: Record<Generation, string> = Object.fromEntries(SCOPE.generations.map((g) => [g.id, g.name]))

export type EncounterLocation = {
  area: string
  label: string
  minLevel: number
  maxLevel: number
}

export type VersionEncounters = {
  version: string
  label: string
  generation: Generation
  locations: EncounterLocation[]
}

/**
 * location-area 식별자 → 화면 표기.
 * OQ-18(장소 한국어 이름) 결정 전 임시: 1~5세대 지역은 API에 ko 이름이 없으므로
 * 임의 번역 없이 API 식별자를 영문 표기로만 바꾼다. 예: 'viridian-forest-area' → 'Viridian Forest'
 */
export function formatLocationArea(area: string): string {
  return area
    .replace(/-area$/, '')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** encounters 응답 → 지원 버전만, ADR-008 버전 순서로 묶는다. 장소별 레벨은 최소~최대로 합친다 */
export function toVersionEncounters(raw: readonly RawEncounter[]): VersionEncounters[] {
  return ENCOUNTER_VERSIONS.flatMap(({ version, label, generation }) => {
    const locations: EncounterLocation[] = []
    for (const encounter of raw) {
      const detail = encounter.version_details.find((v) => v.version.name === version)
      if (!detail || detail.encounter_details.length === 0) continue
      const area = encounter.location_area.name
      locations.push({
        area,
        label: formatLocationArea(area),
        minLevel: Math.min(...detail.encounter_details.map((d) => d.min_level)),
        maxLevel: Math.max(...detail.encounter_details.map((d) => d.max_level)),
      })
    }
    return locations.length > 0 ? [{ version, label, generation, locations }] : []
  })
}

/** 내 게임(FR-26)이 정해져 있으면 그 게임의 출현 장소만 남긴다. version이 없으면 그대로 */
export function filterEncountersByGame(entries: readonly VersionEncounters[], version: string | null): VersionEncounters[] {
  return version ? entries.filter((entry) => entry.version === version) : [...entries]
}
