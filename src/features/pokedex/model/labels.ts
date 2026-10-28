import type { Generation, PokemonType } from '@/shared/models'

// 화면 표기는 한국어 (DESIGN.md §3.4). API 식별자는 그대로 두고 표시할 때만 변환한다.
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

export const GENERATION_LABELS: Record<Generation, { name: string; region: string }> = {
  'generation-i': { name: '1세대', region: '관동지방' },
  'generation-ii': { name: '2세대', region: '성도지방' },
  'generation-iii': { name: '3세대', region: '호연지방' },
  'generation-iv': { name: '4세대', region: '신오지방' },
  'generation-v': { name: '5세대', region: '하나지방' },
  'generation-vi': { name: '6세대', region: '칼로스지방' },
}
