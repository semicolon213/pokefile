// DESIGN.md §6 공통 모델 초안 — 변경 시 영향 담당자 전원 합의 필요
export type PokemonId = number

export type PokemonSummary = {
  id: PokemonId
  nameEn: string
  nameKo?: string
  types: string[]
  generation?: string
  imageUrl?: string
}
