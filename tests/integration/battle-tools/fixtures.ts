export const SMOGON_FIXTURE = {
  Charizard: { ou: {
    'Base attacker': {
      moves: ['Flamethrower', ['Air Slash', 'Roost']], ability: 'Blaze', item: ['Leftovers', 'Life Orb'],
      nature: ['Timid', 'Modest'], evs: [{ spa: 252, spe: 252 }, { hp: 252, spa: 252 }], ivs: { atk: 0 },
    },
    'Mega X attacker': { moves: ['Dragon Claw'], item: 'Charizardite X', ability: 'Blaze', nature: 'Jolly', evs: { atk: 252, spe: 252 } },
    'Mega Y attacker': { moves: ['Fire Blast'], item: 'Charizardite Y', ability: 'Blaze', nature: 'Timid', evs: { spa: 252, spe: 252 } },
  }, ubers: { 'Ubers attacker': { moves: ['Flamethrower'], item: 'Leftovers' } } },
  'Charizard-Mega-X': { ou: { 'Direct X attacker': { moves: ['Dragon Dance'], item: 'Charizardite X' } } },
}

const api = 'https://pokeapi.co/api/v2'
const resource = (name: string) => ({ name, url: '' })
const language = (name: string) => ({ language: resource('ko'), name })
const image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const pokemon = (name: string, types: string[]) => ({
  id: name === 'charizard' ? 6 : 10034, name, height: 17, weight: 905,
  types: types.map((type, index) => ({ slot: index + 1, type: resource(type) })), abilities: [],
  stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
    .map((name) => ({ base_stat: 80, stat: resource(name) })),
  sprites: { front_default: image, other: { showdown: { front_default: image } } }, forms: [resource(name)],
})

export const DETAIL_FIXTURES: Record<string, unknown> = {
  '/data/pokedex-index.json': { version: 2, generatedAt: '2026-11-03', count: 1, pokemon: [
    { id: 6, nameEn: 'Charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', forms: [{ key: 'mega-x', nameKo: '메가리자몽X', nameEn: 'Mega Charizard X', category: 'mega', types: ['fire', 'dragon'], battleOnly: true }, { key: 'mega-y', nameKo: '메가리자몽Y', nameEn: 'Mega Charizard Y', category: 'mega', types: ['fire', 'flying'], battleOnly: true }] },
  ] },
  '/sets/gen6.json': SMOGON_FIXTURE,
  '/pokemon-species/6': { id: 6, name: 'charizard', names: [language('리자몽')], genera: [], flavor_text_entries: [], evolution_chain: null },
  '/pokemon/6': pokemon('charizard', ['fire', 'flying']),
  '/pokemon/charizard-mega-x': pokemon('charizard-mega-x', ['fire', 'dragon']),
  '/pokemon/charizard-mega-y': pokemon('charizard-mega-y', ['fire', 'flying']),
  '/pokemon-form/charizard-mega-x': { name: 'charizard-mega-x', form_names: [language('메가리자몽X')] },
  '/pokemon-form/charizard-mega-y': { name: 'charizard-mega-y', form_names: [language('메가리자몽Y')] },
  '/pokemon/6/encounters': [],
}

export function fixtureForUrl(url: string): unknown {
  const pathname = new URL(url, api).pathname
  const path = pathname.endsWith('/data/pokedex-index.json')
    ? '/data/pokedex-index.json' : pathname.replace('/api/v2', '')
  return DETAIL_FIXTURES[path]
}
