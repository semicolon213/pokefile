import type { PokemonId } from '@/shared/models'

/** 도감 번호 표기: 25 → '#0025' (DESIGN.md §3.4, 앞자리 0은 화면에서만 붙인다) */
export function formatDexNumber(id: PokemonId): string {
  return `#${String(id).padStart(4, '0')}`
}

/** 화면 표시 이름: 한국어 이름 우선, 없으면 영문 이름 (ADR-011, DESIGN.md §3.4) */
export function displayName(pokemon: { nameEn: string; nameKo?: string }): string {
  return pokemon.nameKo || pokemon.nameEn
}
