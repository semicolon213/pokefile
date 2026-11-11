import { isPokemonId, POKEMON_TYPES } from '@/shared/models'
import type { PokemonId, PokemonType } from '@/shared/models'
import type { RawEvolutionDetail, RawEvolutionNode } from '../api/pokeapi'
import { idFromResourceUrl } from '../api/pokeapi'

/**
 * 진화 조건의 한 조각. 문자열은 그대로 표시하고, 이름 참조는 화면에서 한국어 이름으로 바꾼다
 * (도구·기술: PokéAPI names[ko], 장소: 번역표, 포켓몬: 검색 인덱스, 타입: TYPE_LABELS).
 */
export type ConditionToken =
  | string
  | { kind: ConditionRefKind; name: string }
  | { kind: 'species'; id: PokemonId | null; name: string }
  | { kind: 'type'; type: PokemonType }

/** 조건 하나 = 조각 묶음들. 묶음은 ` · `로, 묶음 안 조각은 이어 붙여 표시한다 (예: [Lv.25] · [낮]) */
export type EvolutionCondition = ConditionToken[][]

export type EvolutionNode = {
  id: PokemonId
  /** PokéAPI species 식별자 (인덱스에 이름이 없을 때 대체 표시용) */
  speciesName: string
  /** 이 종으로 진화하는 조건. 여러 개면 '또는'. 루트이거나 조건 정보가 없으면 빈 배열 */
  conditions: EvolutionCondition[]
  children: EvolutionNode[]
}

/**
 * 게임(version_group) 출시 순서, 최신이 먼저 (FR-28: 최신 게임 조건만 표시, 2026-11-11 결정).
 * 목록에 없는 판은 가장 오래된 것으로 본다(새 게임이 추가되면 여기에 넣는다).
 */
export const VERSION_GROUPS_NEWEST_FIRST = [
  'legends-za',
  'the-indigo-disk',
  'the-teal-mask',
  'scarlet-violet',
  'legends-arceus',
  'brilliant-diamond-and-shining-pearl',
  'the-crown-tundra',
  'the-isle-of-armor',
  'sword-shield',
  'lets-go-pikachu-lets-go-eevee',
  'ultra-sun-ultra-moon',
  'sun-moon',
  'omega-ruby-alpha-sapphire',
  'x-y',
  'black-2-white-2',
  'black-white',
  'heartgold-soulsilver',
  'platinum',
  'diamond-pearl',
  'firered-leafgreen',
  'emerald',
  'ruby-sapphire',
  'crystal',
  'gold-silver',
  'yellow',
  'red-blue',
] as const

const versionRank = (detail: RawEvolutionDetail) => {
  const rank = (VERSION_GROUPS_NEWEST_FIRST as readonly string[]).indexOf(detail.version_group?.name ?? '')
  return rank === -1 ? VERSION_GROUPS_NEWEST_FIRST.length : rank
}

const TIME_LABELS: Record<string, string> = { day: '낮', night: '밤', dusk: '황혼', 'full-moon': '보름달' }
const PHYSICAL_STATS_LABELS: Record<number, string> = { 1: '공격 > 방어', 0: '공격 = 방어', '-1': '공격 < 방어' }

const ref = (kind: ConditionRefKind, resource: { name: string }): ConditionToken => ({ kind, name: resource.name })
const speciesRef = (resource: { name: string; url: string }): ConditionToken => {
  const id = idFromResourceUrl(resource.url)
  return { kind: 'species', id: id != null && isPokemonId(id) ? id : null, name: resource.name }
}
const typeRef = (resource: { name: string }): ConditionToken | string =>
  (POKEMON_TYPES as readonly string[]).includes(resource.name) ? { kind: 'type', type: resource.name as PokemonType } : resource.name

/** 진화 방법(trigger) 자체를 나타내는 묶음. 레벨업은 다른 조건이 없을 때만 '레벨업'을 붙인다 */
function triggerPart(detail: RawEvolutionDetail): ConditionToken[] | null {
  switch (detail.trigger.name) {
    case 'level-up':
      return detail.min_level != null ? [`Lv.${detail.min_level}`] : null
    case 'in-battle-level-up':
      return detail.min_level != null ? [`배틀 중 Lv.${detail.min_level}`] : ['배틀 중 레벨업']
    case 'use-item':
      return detail.item ? [ref('item', detail.item), ' 사용'] : ['도구 사용']
    case 'trade':
      if (detail.trade_species) return [speciesRef(detail.trade_species), '와(과) 통신교환']
      return detail.held_item ? [ref('item', detail.held_item), ' 지니고 통신교환'] : ['통신교환']
    case 'use-move':
    case 'strong-style-move':
    case 'agile-style-move': {
      const style = detail.trigger.name === 'strong-style-move' ? '강공 스타일로 ' : detail.trigger.name === 'agile-style-move' ? '속공 스타일로 ' : ''
      const count = detail.min_move_count ? ` ${detail.min_move_count}회` : ''
      return detail.used_move ? [style, ref('move', detail.used_move), `${count} 사용`] : [`${style}기술${count} 사용`]
    }
    case 'spin':
      // 마휘핑: 사탕공예 종류·시간·회전 방향에 따라 모습만 달라진다 → 공통 조건만 표시
      return ['사탕공예를 지니고 회전']
    case 'shed':
      // 껍질몬: 토중몬이 아이스크(#291)로 진화할 때 파티에 빈자리와 몬스터볼이 있으면 함께 생긴다
      return ['토중몬 진화 때 파티 빈자리·몬스터볼']
    case 'three-critical-hits':
      return ['한 배틀에서 급소 3번']
    case 'recoil-damage':
      return [detail.min_damage_taken ? `반동 데미지 ${detail.min_damage_taken} 이상 받기` : '반동 데미지 받기']
    case 'take-damage':
      // 데스판(가라르 데스마스의 진화): 데미지를 누적해 받은 뒤 모래먼지구덩이의 바위 아치 아래를 지나간다
      return [detail.min_damage_taken ? `데미지 ${detail.min_damage_taken} 이상 받은 뒤 바위 아치 통과` : '데미지 받은 뒤 바위 아치 통과']
    case 'three-defeated-bisharp':
      return ['대장의징표를 지닌 절각참 3마리 쓰러뜨리기']
    case 'gimmighoul-coins':
      return ['모으령의 코인 999개']
    case 'meltan-candies':
      return ['멜탄의 사탕 400개 (Pokémon GO)']
    case 'tower-of-darkness':
      return ['악의 탑 수련']
    case 'tower-of-waters':
      return ['물의 탑 수련']
    default:
      return ['특수 조건']
  }
}

/** API 진화 조건 하나 → 표시용 조건. ignoreGender면 성별 조건을 뺀다(양쪽 성별 모두 진화하는 경우) */
export function toEvolutionCondition(detail: RawEvolutionDetail, { ignoreGender = false } = {}): EvolutionCondition {
  const parts: ConditionToken[][] = []
  const trigger = triggerPart(detail)
  if (trigger) parts.push(trigger)
  if (detail.trigger.name === 'spin') return parts
  const trade = detail.trigger.name === 'trade'
  if (detail.held_item && !trade) parts.push([ref('item', detail.held_item), ' 지니고'])
  if (detail.known_move) parts.push([ref('move', detail.known_move), ' 배운 상태'])
  if (detail.known_move_type) parts.push([typeRef(detail.known_move_type), '타입 기술 배운 상태'])
  if (detail.min_happiness != null) parts.push(['친밀도 높음'])
  if (detail.min_affection != null) parts.push(['절친도 높음'])
  if (detail.min_beauty != null) parts.push(['아름다움 높음'])
  if (detail.time_of_day && TIME_LABELS[detail.time_of_day]) parts.push([TIME_LABELS[detail.time_of_day]])
  if (detail.location) parts.push([ref('location', detail.location), '에서'])
  if (detail.near_special_rock) parts.push(['특별한 바위 근처'])
  if (detail.gender === 1 && !ignoreGender) parts.push(['암컷'])
  if (detail.gender === 2 && !ignoreGender) parts.push(['수컷'])
  if (detail.party_species) parts.push(['파티에 ', speciesRef(detail.party_species)])
  if (detail.party_type) parts.push(['파티에 ', typeRef(detail.party_type), '타입'])
  if (detail.relative_physical_stats != null) parts.push([PHYSICAL_STATS_LABELS[detail.relative_physical_stats] ?? ''])
  if (detail.min_steps) parts.push([`${detail.min_steps.toLocaleString('ko-KR')}걸음 걷기`])
  if (detail.needs_overworld_rain) parts.push(['비가 올 때'])
  if (detail.turn_upside_down) parts.push(['게임기를 뒤집기'])
  if (detail.needs_multiplayer) parts.push(['통신 플레이 중'])
  // 레벨 없이 다른 조건만 있는 레벨업 진화는 끝에 '레벨업'을 붙인다 (예: 친밀도 높음 · 낮 · 레벨업)
  if (detail.trigger.name === 'level-up' && detail.min_level == null) parts.push(['레벨업'])
  return parts.filter((part) => part.some((token) => token !== ''))
}

/** 리전폼 접미사 (폼 이름 규칙, ADR-016) */
const REGIONAL_FORM = /-(alola|galar|hisui|paldea)(-|$)/

/**
 * 리전폼 진화 조건인지. `region`이 붙거나, 진화 전·후 폼이 리전폼이다
 * (예: 식스테일(알로라) → 나인테일(알로라)는 region 없이 required_pokemon_form=vulpix-alola로만 온다, 2026-11-11 실측).
 */
function isRegionalFormDetail(detail: RawEvolutionDetail): boolean {
  return (
    !!detail.region ||
    REGIONAL_FORM.test(detail.required_pokemon_form?.name ?? '') ||
    REGIONAL_FORM.test(detail.evolved_pokemon_form?.name ?? '')
  )
}

/**
 * 표시할 진화 조건 고르기 (FR-28, 2026-11-11 결정):
 * 1. 리전폼 진화 조건은 빼고 기본 폼 진화만 본다(리전폼 진화는 TASK-024). 다 빠지면(예: 가라르 나옹 → 나이킹) 원래 목록을 쓴다.
 * 2. 가장 최신 게임(version_group)의 조건만 남긴다.
 * 3. 수컷·암컷 모두 진화하면 성별 조건은 뺀다(예: 냐오닉스).
 * 4. 표시가 같은 조건은 하나로 합친다. 서로 다르면 '또는'으로 모두 보여준다(예: 루가루암 낮/밤/황혼).
 */
export function pickEvolutionConditions(details: readonly RawEvolutionDetail[]): EvolutionCondition[] {
  if (details.length === 0) return []
  const baseForm = details.filter((detail) => !isRegionalFormDetail(detail))
  const candidates = baseForm.length > 0 ? baseForm : [...details]
  const newest = Math.min(...candidates.map(versionRank))
  const latest = candidates.filter((detail) => versionRank(detail) === newest)
  const ignoreGender = latest.some((detail) => detail.gender === 1) && latest.some((detail) => detail.gender === 2)
  const conditions = latest.map((detail) => toEvolutionCondition(detail, { ignoreGender }))
  const seen = new Set<string>()
  return conditions.filter((condition) => {
    const key = JSON.stringify(condition)
    if (seen.has(key) || condition.length === 0) return false
    seen.add(key)
    return true
  })
}

/**
 * evolution-chain 응답 → 지원 범위(#1~MAX_POKEMON_ID) 진화 트리 (ADR-016).
 * 지원 범위 밖 종은 그 아래 가지까지 함께 제외한다. 루트가 범위 밖이면 null.
 */
export function toEvolutionTree(raw: RawEvolutionNode): EvolutionNode | null {
  const id = idFromResourceUrl(raw.species.url)
  if (id == null || !isPokemonId(id)) return null
  return {
    id,
    speciesName: raw.species.name,
    conditions: pickEvolutionConditions(raw.evolution_details),
    children: raw.evolves_to.map(toEvolutionTree).filter((node): node is EvolutionNode => node !== null),
  }
}

export type ConditionRefKind = 'item' | 'move' | 'location'

/** 트리에 나오는 이름 참조(도구·기술·장소) 목록. 화면에서 한국어 이름을 한 번씩만 조회하기 위함 */
export function collectConditionRefs(tree: EvolutionNode | null | undefined): { kind: ConditionRefKind; name: string }[] {
  const refs = new Map<string, { kind: ConditionRefKind; name: string }>()
  const visit = (node: EvolutionNode) => {
    for (const condition of node.conditions)
      for (const part of condition)
        for (const token of part)
          if (typeof token !== 'string' && (token.kind === 'item' || token.kind === 'move' || token.kind === 'location'))
            refs.set(`${token.kind}:${token.name}`, { kind: token.kind, name: token.name })
    node.children.forEach(visit)
  }
  if (tree) visit(tree)
  return [...refs.values()]
}

/** 진화하지 않는 종(트리가 자기 자신 하나뿐)인지 */
export function isSingleStage(tree: EvolutionNode): boolean {
  return tree.children.length === 0
}
