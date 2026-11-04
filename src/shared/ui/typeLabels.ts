import { SCOPE } from '@/shared/config/scope'
import type { Generation, PokemonType } from '@/shared/models'

// 화면 표기는 한국어 (DESIGN.md §3.4). API 식별자는 그대로 두고 표시할 때만 변환한다. 모든 feature가 이 표 하나를 쓴다.
export const TYPE_LABELS: Record<PokemonType, string> = {
  normal: '노말',
  fire: '불꽃',
  water: '물',
  grass: '풀',
  electric: '전기',
  ice: '얼음',
  fighting: '격투',
  poison: '독',
  ground: '땅',
  flying: '비행',
  psychic: '에스퍼',
  bug: '벌레',
  rock: '바위',
  ghost: '고스트',
  dragon: '드래곤',
  dark: '악',
  steel: '강철',
  fairy: '페어리',
}

/** 세대 표기(1세대·관동지방 …)는 지원 범위 설정(shared/config/scope.json)에서 만든다 */
export const GENERATION_LABELS: Record<Generation, { name: string; region: string }> = Object.fromEntries(
  SCOPE.generations.map((g) => [g.id, { name: g.name, region: g.region }]),
)
