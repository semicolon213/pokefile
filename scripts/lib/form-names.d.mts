// form-names.mjs 타입 선언 (단위 테스트에서 가져다 쓴다)
export type FormCategory = 'mega' | 'gmax' | 'regional' | 'other'
export function formKeyOf(pokemonName: string, speciesName: string): string
export function formCategoryOf(key: string, isMega: boolean): FormCategory
export function formNameKoOf(input: {
  pokemonName: string
  key: string
  category: FormCategory
  apiNameKo?: string
  speciesKo: string
  translations?: Record<string, string>
}): string | undefined
