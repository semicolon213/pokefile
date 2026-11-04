import type { PokemonId } from '@/shared/models'
import { prefersReducedMotion } from '@/shared/ui'

// ADR-013: showdown 애니메이션 GIF → 기본 PNG → 대체 아이콘 순서.
// 목록 카드마다 /pokemon/{id}를 요청하지 않도록 PokéAPI sprites 저장소의 고정 경로를 사용한다.
// 움직임 줄이기 설정이면 정적 PNG를 먼저 쓴다(카드 수십 장이 동시에 움직이지 않도록).
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export function pokemonImageUrls(id: PokemonId): string[] {
  const gif = `${SPRITES}/other/showdown/${id}.gif`
  const png = `${SPRITES}/${id}.png`
  return prefersReducedMotion() ? [png, gif] : [gif, png]
}
