import type { PokemonSummary } from '@/shared/models'

// FR-01~03: 한국어 이름, 영어 이름(부분 일치), 도감 번호(정확히 일치)로 검색한다.

/**
 * 소문자 + 악센트 제거 + 글자·숫자 외 문자(공백·구두점·기호) 제거.
 * Flabébé → flabebe, Mr. Mime → mrmime, Farfetch’d → farfetchd, Ho-Oh → hooh.
 * 한글은 NFC로 다시 합쳐 음절 단위를 유지한다.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
}

/** '25', '#25', '025', '#0025' → 25. 숫자 검색어가 아니면 null */
export function parseDexNumberQuery(query: string): number | null {
  const m = query.trim().match(/^#?0*(\d+)$/)
  return m ? Number(m[1]) : null
}

export function matchesQuery(pokemon: PokemonSummary, query: string): boolean {
  const trimmed = query.trim()
  if (!trimmed) return true

  const dexNumber = parseDexNumberQuery(trimmed)
  if (dexNumber !== null) return pokemon.id === dexNumber

  const q = normalizeText(trimmed)
  return normalizeText(pokemon.nameEn).includes(q) || (!!pokemon.nameKo && normalizeText(pokemon.nameKo).includes(q))
}

export function searchPokemon(list: PokemonSummary[], query: string): PokemonSummary[] {
  return list.filter((pokemon) => matchesQuery(pokemon, query))
}
