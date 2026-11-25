import type { PokemonId } from '@/shared/models'

// ADR-013: showdown GIF → PNG. 진화 트리 노드마다 /pokemon/{id}를 요청하지 않도록
// PokéAPI sprites 저장소의 고정 경로를 사용한다(상세 대표 이미지는 응답의 sprites 필드를 사용).
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export function showdownImageUrls(id: PokemonId): string[] {
  return [`${SPRITES}/other/showdown/${id}.gif`, `${SPRITES}/${id}.png`]
}

/**
 * 기본 폼 이미지 후보: GIF → PNG → HOME 일러스트.
 * 폼 이미지가 하나도 없을 때(코라이돈·미라이돈 변신 모습 8개 등) 대신 보여 준다 (ADR-016).
 */
export function baseFormImageUrls(id: PokemonId): string[] {
  return [...showdownImageUrls(id), `${SPRITES}/other/home/${id}.png`]
}
