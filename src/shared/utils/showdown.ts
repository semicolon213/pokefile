/**
 * PokéAPI 이름과 Smogon(data.pkmn.cc) 키를 비교하기 위한 정규화 (ADR-009).
 * 소문자 영숫자만 남긴다. 예: 'mr-mime' / 'Mr. Mime' → 'mrmime', 'charizard-mega-x' / 'Charizard-Mega-X' → 'charizardmegax'
 */
export function toShowdownId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}
