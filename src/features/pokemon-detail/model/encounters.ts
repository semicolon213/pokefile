import type { Generation } from '@/shared/models'
import type { RawEncounter } from '../api/pokeapi'

/**
 * 출현 장소를 표시할 6세대 이하 게임 버전 (ADR-008 목록 순서).
 * 한국어 이름은 PokéAPI `/version/{name}` `names[ko]` 실측값(2026-11-03)이다.
 */
export const ENCOUNTER_VERSIONS = [
  { version: 'red', label: '레드', generation: 'generation-i' },
  { version: 'blue', label: '블루', generation: 'generation-i' },
  { version: 'yellow', label: '피카츄', generation: 'generation-i' },
  { version: 'gold', label: '골드', generation: 'generation-ii' },
  { version: 'silver', label: '실버', generation: 'generation-ii' },
  { version: 'crystal', label: '크리스탈', generation: 'generation-ii' },
  { version: 'ruby', label: '루비', generation: 'generation-iii' },
  { version: 'sapphire', label: '사파이어', generation: 'generation-iii' },
  { version: 'emerald', label: '에메랄드', generation: 'generation-iii' },
  { version: 'firered', label: '파이어레드', generation: 'generation-iii' },
  { version: 'leafgreen', label: '리프그린', generation: 'generation-iii' },
  { version: 'diamond', label: '디아루가', generation: 'generation-iv' },
  { version: 'pearl', label: '펄기아', generation: 'generation-iv' },
  { version: 'platinum', label: '기라티나', generation: 'generation-iv' },
  { version: 'heartgold', label: '하트골드', generation: 'generation-iv' },
  { version: 'soulsilver', label: '소울실버', generation: 'generation-iv' },
  { version: 'black', label: '블랙', generation: 'generation-v' },
  { version: 'white', label: '화이트', generation: 'generation-v' },
  { version: 'black-2', label: '블랙 2', generation: 'generation-v' },
  { version: 'white-2', label: '화이트 2', generation: 'generation-v' },
  { version: 'x', label: 'X', generation: 'generation-vi' },
  { version: 'y', label: 'Y', generation: 'generation-vi' },
  { version: 'omega-ruby', label: '오메가루비', generation: 'generation-vi' },
  { version: 'alpha-sapphire', label: '알파사파이어', generation: 'generation-vi' },
] as const satisfies readonly { version: string; label: string; generation: Generation }[]

export const GENERATION_NAMES: Record<Generation, string> = {
  'generation-i': '1세대',
  'generation-ii': '2세대',
  'generation-iii': '3세대',
  'generation-iv': '4세대',
  'generation-v': '5세대',
  'generation-vi': '6세대',
}

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
