import type { PokemonId } from '@/shared/models'

// ADR-013: showdown 애니메이션 GIF → 기본 PNG → 대체 아이콘 순서.
// 목록 카드마다 /pokemon/{id}를 요청하지 않도록 PokéAPI sprites 저장소의 고정 경로를 사용한다.
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export function pokemonImageUrls(id: PokemonId): string[] {
  return [`${SPRITES}/other/showdown/${id}.gif`, `${SPRITES}/${id}.png`]
}
