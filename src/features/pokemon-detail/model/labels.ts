import type { FormKey, PokemonType } from '@/shared/models'

// 화면 표기는 한국어 (DESIGN.md §3.4). API 식별자는 그대로 두고 표시할 때만 변환한다.
// TODO(CHANGE REQUEST): 타입 표기는 pokedex의 TYPE_LABELS와 같은 표다. DESIGN §3.4 "단일 매핑 표" 원칙에 따라
// shared로 옮기는 공통 PR(관리자 김형균)이 병합되면 이 사본을 제거한다.
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

/** 폼 탭 표기 (DESIGN.md §2.2) */
export const FORM_LABELS: Record<FormKey, string> = {
  default: '기본',
  mega: '메가',
  'mega-x': '메가X',
  'mega-y': '메가Y',
}
