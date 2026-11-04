// 폼 키·분류·한국어 폼 이름 규칙 (ADR-016). build-pokedex-index.mjs와 단위 테스트가 함께 쓴다.

const REGION_KO = { alola: '알로라', galar: '가라르', hisui: '히스이', paldea: '팔데아' }
const BREED_KO = { combat: '컴뱃종', blaze: '블레이즈종', aqua: '워터종' }

/** 폼 키: pokemon 이름에서 '{종 이름}-'을 뺀 부분. 'charizard-mega-x' → 'mega-x', 'rotom-wash' → 'wash' */
export function formKeyOf(pokemonName, speciesName) {
  if (!pokemonName.startsWith(`${speciesName}-`)) throw new Error(`폼 이름이 종 이름으로 시작하지 않음: ${pokemonName}`)
  return pokemonName.slice(speciesName.length + 1)
}

/** 폼 분류: mega · gmax · regional · other */
export function formCategoryOf(key, isMega) {
  if (isMega) return 'mega'
  if (key === 'gmax' || key.endsWith('-gmax')) return 'gmax'
  if (/^(alola|galar|hisui|paldea)$/.test(key) || key === 'galar-standard' || /^paldea-\w+-breed$/.test(key)) return 'regional'
  return 'other'
}

/**
 * 한국어 폼 이름: 번역표 → API form_names[ko] → 규칙 → undefined(화면에서 영문 표시).
 * 번역표는 API 값이 없거나 다른 폼과 겹치는 폼만 둔다(scripts/data/form-names-ko.json, OQ-26).
 * 규칙: 메가 = '메가' + 종 이름 + X/Y/Z, 거다이맥스 = '거다이맥스', 리전폼 = '{지방}의 모습'(팔데아 켄타로스는 품종을 붙인다)
 */
export function formNameKoOf({ pokemonName, key, category, apiNameKo, speciesKo, translations = {} }) {
  if (Object.hasOwn(translations, pokemonName)) return translations[pokemonName]
  if (apiNameKo) return apiNameKo
  if (category === 'mega' && /^mega(-[xyz])?$/.test(key)) return `메가${speciesKo}${key.slice(5).toUpperCase()}`
  if (category === 'gmax' && key === 'gmax') return '거다이맥스'
  if (category === 'regional') {
    const [, region, breed] = key.match(/^(\w+)(?:-(\w+)-breed)?/)
    if (!REGION_KO[region]) return undefined
    return `${REGION_KO[region]}의 모습${breed ? `·${BREED_KO[breed]}` : ''}`
  }
  return undefined
}
