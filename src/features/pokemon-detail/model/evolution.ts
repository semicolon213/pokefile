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
  /** 앞 이름의 받침에 따라 고르는 조사 (예: 쪼마리와 / 딱정곤과) */
  | { kind: 'josa'; consonant: string; vowel: string }

/** 조건 하나 = 조각 묶음들. 묶음은 ` · `로, 묶음 안 조각은 이어 붙여 표시한다 (예: [Lv.25] · [낮]) */
export type EvolutionCondition = ConditionToken[][]

/** 진화 방법 하나와 PokéAPI가 그 방법을 기록한 게임(version_group, 출시 순) */
export type GameCondition = { parts: EvolutionCondition; versionGroups: string[] }

export type EvolutionNode = {
  id: PokemonId
  /** PokéAPI species 식별자 (인덱스에 이름이 없을 때 대체 표시용) */
  speciesName: string
  /** 이 종으로 진화하는 방법(게임별). 여러 개면 '또는'. 루트이거나 조건 정보가 없으면 빈 배열 */
  conditions: GameCondition[]
  children: EvolutionNode[]
}

/**
 * 게임(version_group) 출시 순서와 표시 이름 (FR-28 게임별 진화 방법, 2026-11-18 결정).
 * versions는 scope.json의 버전(내 게임) → 판 연결이다. DLC 판은 본편 버전에 함께 속한다.
 * 목록에 없는 판은 맨 뒤로 보내고 식별자를 그대로 쓴다(새 게임이 추가되면 여기에 넣는다).
 */
export const VERSION_GROUPS: readonly { name: string; label: string; versions: readonly string[] }[] = [
  { name: 'red-blue', label: '레드·블루', versions: ['red', 'blue'] },
  { name: 'red-green-japan', label: '레드·그린(일본)', versions: [] },
  { name: 'blue-japan', label: '블루(일본)', versions: [] },
  { name: 'yellow', label: '피카츄', versions: ['yellow'] },
  { name: 'gold-silver', label: '골드·실버', versions: ['gold', 'silver'] },
  { name: 'crystal', label: '크리스탈', versions: ['crystal'] },
  { name: 'ruby-sapphire', label: '루비·사파이어', versions: ['ruby', 'sapphire'] },
  { name: 'emerald', label: '에메랄드', versions: ['emerald'] },
  { name: 'firered-leafgreen', label: '파이어레드·리프그린', versions: ['firered', 'leafgreen'] },
  { name: 'colosseum', label: '콜로세움', versions: [] },
  { name: 'xd', label: 'XD', versions: [] },
  { name: 'diamond-pearl', label: '디아루가·펄기아', versions: ['diamond', 'pearl'] },
  { name: 'platinum', label: '기라티나', versions: ['platinum'] },
  { name: 'heartgold-soulsilver', label: '하트골드·소울실버', versions: ['heartgold', 'soulsilver'] },
  { name: 'black-white', label: '블랙·화이트', versions: ['black', 'white'] },
  { name: 'black-2-white-2', label: '블랙 2·화이트 2', versions: ['black-2', 'white-2'] },
  { name: 'x-y', label: 'X·Y', versions: ['x', 'y'] },
  { name: 'omega-ruby-alpha-sapphire', label: '오메가루비·알파사파이어', versions: ['omega-ruby', 'alpha-sapphire'] },
  { name: 'sun-moon', label: '썬·문', versions: ['sun', 'moon'] },
  { name: 'ultra-sun-ultra-moon', label: '울트라썬·울트라문', versions: ['ultra-sun', 'ultra-moon'] },
  { name: 'lets-go-pikachu-lets-go-eevee', label: '레츠고! 피카츄·이브이', versions: ['lets-go-pikachu', 'lets-go-eevee'] },
  { name: 'sword-shield', label: '소드·실드', versions: ['sword', 'shield'] },
  { name: 'the-isle-of-armor', label: '소드·실드 갑옷의 외딴섬', versions: ['sword', 'shield'] },
  { name: 'the-crown-tundra', label: '소드·실드 왕관의 설원', versions: ['sword', 'shield'] },
  { name: 'brilliant-diamond-shining-pearl', label: '브릴리언트 다이아몬드·샤이닝 펄', versions: ['brilliant-diamond', 'shining-pearl'] },
  { name: 'legends-arceus', label: 'LEGENDS 아르세우스', versions: ['legends-arceus'] },
  { name: 'scarlet-violet', label: '스칼렛·바이올렛', versions: ['scarlet', 'violet'] },
  { name: 'the-teal-mask', label: '스칼렛·바이올렛 벽록의 가면', versions: ['scarlet', 'violet'] },
  { name: 'the-indigo-disk', label: '스칼렛·바이올렛 남청의 원반', versions: ['scarlet', 'violet'] },
  { name: 'legends-za', label: 'LEGENDS Z-A', versions: ['legends-za'] },
  { name: 'mega-dimension', label: 'LEGENDS Z-A 추가 콘텐츠', versions: ['legends-za'] },
  { name: 'champions', label: 'Pokémon Champions', versions: [] },
]

const versionRank = (group: string) => {
  const rank = VERSION_GROUPS.findIndex((g) => g.name === group)
  return rank === -1 ? VERSION_GROUPS.length : rank
}

/** 판 표시 이름. 목록에 없으면 식별자 */
export const versionGroupLabel = (group: string) => VERSION_GROUPS.find((g) => g.name === group)?.label ?? group

/** 내 게임(버전)이 속한 판들 (DLC 포함) */
export const versionGroupsOf = (version: string) =>
  VERSION_GROUPS.filter((g) => g.versions.includes(version)).map((g) => g.name)

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
      if (detail.trade_species) return [speciesRef(detail.trade_species), { kind: 'josa', consonant: '과', vowel: '와' }, ' 통신교환']
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
      // 데스판(가라르 데스마스의 진화): 데미지를 누적해 받은 뒤 정해진 장소의 아치를 지나간다
      // (소드·실드 모래먼지구덩이, LEGENDS Z-A 미르시티). 장소는 아래 장소 조건으로 붙는다
      return [detail.min_damage_taken ? `데미지 ${detail.min_damage_taken} 이상 받은 뒤` : '데미지 받은 뒤']
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
  if (detail.location)
    parts.push([ref('location', detail.location), detail.trigger.name === 'take-damage' ? '의 아치 통과' : '에서'])
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
 * 진화 방법을 게임별로 정리하기 (FR-28, 2026-11-18 결정: 게임마다 다른 방법을 게임 이름과 함께 모두 보여 준다).
 * 1. 리전폼 진화 조건은 빼고 기본 폼 진화만 본다(리전폼 진화는 TASK-024). 다 빠지면(예: 가라르 나옹 → 나이킹) 원래 목록을 쓴다.
 * 2. 수컷·암컷 모두 진화하면 성별 조건은 뺀다(예: 냐오닉스).
 * 3. 표시가 같은 조건은 하나로 합치고 기록된 게임을 모은다. 서로 다르면 '또는'으로 모두 보여준다(예: 루가루암 낮/밤/황혼).
 * 4. 방법은 처음 기록된 게임 순, 게임은 출시 순으로 둔다.
 * PokéAPI는 방법이 처음 생기거나 바뀐 게임에만 기록하는 경우가 많다(예: 후딘 통신교환은 레드·블루만, 2026-11-18 실측).
 * 그래서 게임 표시는 '그 게임에서만'이 아니라 '기록된 게임'이다.
 */
export function pickEvolutionConditions(details: readonly RawEvolutionDetail[]): GameCondition[] {
  const baseForm = details.filter((detail) => !isRegionalFormDetail(detail))
  const candidates = baseForm.length > 0 ? baseForm : details
  const ignoreGender = candidates.some((detail) => detail.gender === 1) && candidates.some((detail) => detail.gender === 2)
  const byKey = new Map<string, GameCondition>()
  for (const detail of candidates) {
    const parts = toEvolutionCondition(detail, { ignoreGender })
    if (parts.length === 0) continue
    const key = JSON.stringify(parts)
    const entry = byKey.get(key) ?? { parts, versionGroups: [] }
    byKey.set(key, entry)
    const group = detail.version_group?.name
    if (group && !entry.versionGroups.includes(group)) entry.versionGroups.push(group)
  }
  const conditions = [...byKey.values()]
  conditions.forEach((condition) => condition.versionGroups.sort((x, y) => versionRank(x) - versionRank(y)))
  const firstRank = (condition: GameCondition) => Math.min(VERSION_GROUPS.length, ...condition.versionGroups.map(versionRank))
  return conditions.sort((x, y) => firstRank(x) - firstRank(y))
}

/**
 * 내 게임(FR-26)에 맞는 진화 방법. 그 게임(DLC 포함)에 기록된 방법이 있으면 그것만, 없으면 전체를 돌려준다.
 * matched: 내 게임 기록으로 좁혔는지 (좁혔으면 화면에서 게임 이름을 생략한다)
 */
export function conditionsForGame(
  conditions: readonly GameCondition[],
  version: string | null | undefined,
): { conditions: readonly GameCondition[]; matched: boolean } {
  if (!version) return { conditions, matched: false }
  const groups = versionGroupsOf(version)
  const mine = conditions.filter((condition) => condition.versionGroups.some((group) => groups.includes(group)))
  return mine.length > 0 ? { conditions: mine, matched: true } : { conditions, matched: false }
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
      for (const part of condition.parts)
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
