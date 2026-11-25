// TASK-025 / C-01: pokemon 변형이 아니라 pokemon-form으로 제공되는 승인된 35폼.
const API = 'https://pokeapi.co/api/v2'
const TYPE_KEYS = ['bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying', 'ghost',
  'grass', 'ground', 'ice', 'poison', 'psychic', 'rock', 'steel', 'water']

export const FORM_EXTENSION_SPECIES = [
  { id: 493, name: 'arceus', keys: TYPE_KEYS },
  { id: 773, name: 'silvally', keys: TYPE_KEYS },
  { id: 1013, name: 'sinistcha', keys: ['masterpiece'] },
]

const nameIn = (names, lang) => names?.find((entry) => entry.language.name === lang)?.name

/** getJson은 생성 스크립트의 HTTP 처리 또는 테스트 fixture를 주입한다. */
export async function fetchFormExtensions(getJson, basePokemon = new Map()) {
  const jobs = []
  for (const spec of FORM_EXTENSION_SPECIES) {
    const pokemon = basePokemon.get(spec.id) ?? await getJson(`${API}/pokemon/${spec.id}`)
    if (pokemon.id !== spec.id || pokemon.name !== spec.name) throw new Error(`C-01 기본 pokemon 불일치: ${spec.name}`)
    for (const key of spec.keys) {
      const name = `${spec.name}-${key}`
      const reference = pokemon.forms.find((entry) => entry.name === name)
      if (!reference) throw new Error(`C-01 폼 참조 없음: ${name}`)
      jobs.push({ spec, key, name, url: reference.url })
    }
  }
  const result = new Map(FORM_EXTENSION_SPECIES.map(({ id }) => [id, []]))
  const typeNames = new Map()
  const forms = new Array(jobs.length)
  let next = 0
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < jobs.length) {
      const index = next++
      const { spec, key, name, url } = jobs[index]
      const form = await getJson(url)
      const types = [...form.types].sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name)
      const expectedTypes = spec.id === 1013 ? ['grass', 'ghost'] : [key]
      if (form.name !== name || form.pokemon.name !== spec.name || form.is_default
        || JSON.stringify(types) !== JSON.stringify(expectedTypes) || typeof form.is_battle_only !== 'boolean') {
        throw new Error(`C-01 폼 계약 불일치: ${name}`)
      }
      let nameKo = nameIn(form.form_names, 'ko')
      if (!nameKo && spec.id !== 1013) {
        const typeUrl = form.types[0].type.url
        if (!typeNames.has(typeUrl)) typeNames.set(typeUrl, getJson(typeUrl))
        const type = await typeNames.get(typeUrl)
        const typeKo = nameIn(type.names, 'ko')
        if (typeKo) nameKo = `${typeKo} 타입`
      }
      forms[index] = {
        key,
        ...(nameKo ? { nameKo } : {}),
        nameEn: nameIn(form.form_names, 'en') ?? key,
        category: 'other', types, battleOnly: form.is_battle_only,
        resource: { kind: 'pokemon-form', name },
      }
    }
  }))
  jobs.forEach(({ spec }, index) => result.get(spec.id).push(forms[index]))
  return result
}

/** 재실행 시 중복 없이 추가 대상 이외의 종·필드를 보존한다. */
export function mergeFormExtensions(index, extensions, generatedAt = new Date().toISOString().slice(0, 10)) {
  if (index.version !== 2 || !Array.isArray(index.pokemon)) throw new Error('C-01: 검색 인덱스 형식 오류')
  for (const id of extensions.keys()) {
    if (!index.pokemon.some((pokemon) => pokemon.id === id)) throw new Error(`C-01: #${id} 없음`)
  }
  return { ...index, generatedAt, pokemon: index.pokemon.map((pokemon) => {
    const additional = extensions.get(pokemon.id)
    if (!additional) return pokemon
    const keys = new Set(additional.map((form) => form.key))
    const existing = pokemon.forms.filter((form) => !(form.resource?.kind === 'pokemon-form' && keys.has(form.key)))
    if (existing.some((form) => keys.has(form.key))) throw new Error(`C-01: 폼 키 중복 #${pokemon.id}`)
    return { ...pokemon, forms: [...existing, ...additional] }
  }) }
}
