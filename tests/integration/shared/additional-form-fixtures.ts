import type { PokemonForm, PokemonSummary, PokemonType } from '@/shared/models'

const API = 'https://pokeapi.co/api/v2'
const resource = (name: string, kind: string) => ({ name, url: `${API}/${kind}/${name}/` })
const names = new Map([[493, ['arceus', 'Arceus', '아르세우스']], [773, ['silvally', 'Silvally', '실버디']], [1013, ['sinistcha', 'Sinistcha', '그우린차']]])
// 브라우저 E2E의 Node 실행에서도 앱 런타임·JSON 설정을 불러오지 않는 독립 fixture.
const typeKeys: readonly PokemonType[] = ['fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']
const TYPE_LABELS: Record<PokemonType, string> = {
  normal: '노말', fire: '불꽃', water: '물', grass: '풀', electric: '전기', ice: '얼음', fighting: '격투',
  poison: '독', ground: '땅', flying: '비행', psychic: '에스퍼', bug: '벌레', rock: '바위', ghost: '고스트',
  dragon: '드래곤', dark: '악', steel: '강철', fairy: '페어리',
}
const title = (value: string) => value[0].toUpperCase() + value.slice(1)
const formLabel = (id: number, key: string) => id === 1013 ? '걸작의 모습'
  : id === 773 ? `타입:${TYPE_LABELS[key as PokemonType]}` : `${TYPE_LABELS[key as PokemonType]} 타입`

export const ADDITIONAL_INDEX: PokemonSummary[] = [...names].map(([id, [name, nameEn, nameKo]]) => ({
  id, nameEn, nameKo, generation: id === 493 ? 'generation-iv' : id === 773 ? 'generation-vii' : 'generation-ix',
  types: id === 1013 ? ['grass', 'ghost'] : ['normal'],
  forms: (id === 1013 ? ['masterpiece'] : typeKeys).map((key): PokemonForm => ({
    key, nameKo: formLabel(id, key), nameEn: id === 1013 ? 'Masterpiece Form' : `${title(key)} Type`,
    category: 'other', types: id === 1013 ? ['grass', 'ghost'] : [key as PokemonType], battleOnly: false,
    resource: { kind: 'pokemon-form', name: `${name}-${key}` },
  })),
}))

export const ADDITIONAL_RESPONSES: Record<string, unknown> = {}
export const ADDITIONAL_SMOGON: Record<string, unknown> = {}
for (const summary of ADDITIONAL_INDEX) {
  const [name] = names.get(summary.id)!
  const defaultName = summary.id === 1013 ? 'unremarkable' : 'normal'
  const stats = summary.id === 493 ? [120, 120, 120, 120, 120, 120] : summary.id === 773 ? [95, 95, 95, 95, 95, 95] : [71, 60, 106, 121, 80, 70]
  ADDITIONAL_RESPONSES[`/pokemon/${summary.id}`] = {
    id: summary.id, name, species: resource(name, 'pokemon-species'), height: 10, weight: 100,
    types: summary.types.map((type, index) => ({ slot: index + 1, type: resource(type, 'type') })),
    abilities: [], stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
      .map((name, index) => ({ base_stat: stats[index], stat: resource(name, 'stat') })),
    moves: [{ move: resource('protect', 'move'), version_group_details: [{ level_learned_at: 0,
      move_learn_method: resource('machine', 'move-learn-method'),
      version_group: resource(summary.id === 773 ? 'sword-shield' : 'scarlet-violet', 'version-group') }] }],
    sprites: { front_default: `${name}.png`, other: { showdown: { front_default: `${name}.gif` } } },
    forms: [resource(`${name}-${defaultName}`, 'pokemon-form'), ...summary.forms.map((form) => resource(form.resource!.name, 'pokemon-form')),
      ...(summary.id === 493 ? [resource('arceus-unknown', 'pokemon-form')] : [])],
  }
  ADDITIONAL_RESPONSES[`/pokemon-species/${summary.id}`] = {
    id: summary.id, name, names: [{ name: summary.nameKo, language: { name: 'ko' } }],
    genera: [], flavor_text_entries: [], evolution_chain: null,
  }
  ADDITIONAL_RESPONSES[`/pokemon/${summary.id}/encounters`] = []
  ADDITIONAL_SMOGON[summary.nameEn] = { ou: { [`${name} normal set`]: { moves: ['Protect'] } } }
  for (const form of summary.forms) {
    const formName = form.resource!.name
    ADDITIONAL_RESPONSES[`/pokemon-form/${formName}`] = {
      name: formName, pokemon: resource(name, 'pokemon'), is_default: false, is_battle_only: false,
      form_names: [{ name: form.nameEn, language: { name: 'en' } },
        ...(summary.id === 493 ? [] : [{ name: form.nameKo, language: { name: 'ko' } }])],
      types: form.types.map((type, index) => ({ slot: index + 1, type: resource(type, 'type') })),
      sprites: { front_default: `${formName}.png`, front_shiny: `${formName}-shiny.png`,
        other: { showdown: { front_default: summary.id === 1013 ? null : `${formName}.gif` } } },
    }
    ADDITIONAL_SMOGON[`${summary.nameEn}-${title(form.key)}`] = { ou: { [`${formName} set`]: { moves: ['Protect'] } } }
  }
}
for (const type of typeKeys) ADDITIONAL_RESPONSES[`/type/${type}`] = {
  name: type, names: [{ name: TYPE_LABELS[type], language: { name: 'ko' } }],
}

export function additionalFixtureForUrl(url: string): unknown {
  const path = new URL(url, API).pathname.replace(/\/$/, '')
  if (path.endsWith('/data/pokedex-index.json')) return {
    version: 2, generatedAt: '2026-11-25', count: ADDITIONAL_INDEX.length, pokemon: ADDITIONAL_INDEX,
  }
  const generation = /\/sets\/gen(\d+)\.json$/.exec(path)?.[1]
  if (generation) return Object.fromEntries(Object.entries(ADDITIONAL_SMOGON).filter(([name]) =>
    generation === '9' ? !name.startsWith('Silvally')
      : generation === '7' ? !name.startsWith('Sinistcha')
        : generation === '8' ? name.startsWith('Silvally') : name.startsWith('Arceus')))
  return ADDITIONAL_RESPONSES[path.replace('/api/v2', '')]
}
