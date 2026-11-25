import { describe, expect, it } from 'vitest'
import { normalizeSmogonSets, selectSmogonSets } from '@/features/battle-tools/model/smogon'
import indexJson from '../../../public/data/pokedex-index.json?raw'

const pokemonIndex = (JSON.parse(indexJson) as {
  pokemon: { id: number; nameEn: string; forms: { key: string }[] }[]
}).pokemon

const candidate = { moves: ['Protect'], item: 'Leftovers' }

describe('세대별 폼 매핑 (TASK-025 / FR-17·18 / TC-06)', () => {
  it.each([
    ['raichu', 'alola', 'Raichu-Alola'],
    ['darmanitan', 'galar-standard', 'Darmanitan-Galar'],
    ['darmanitan', 'galar-zen', 'Darmanitan-Galar-Zen'],
    ['tauros', 'paldea-combat-breed', 'Tauros-Paldea-Combat'],
    ['tauros', 'paldea-blaze-breed', 'Tauros-Paldea-Blaze'],
    ['tauros', 'paldea-aqua-breed', 'Tauros-Paldea-Aqua'],
    ['indeedee', 'female', 'Indeedee-F'],
    ['meowstic', 'female', 'Meowstic-F'],
    ['basculegion', 'female', 'Basculegion-F'],
    ['oinkologne', 'female', 'Oinkologne-F'],
    ['urshifu', 'single-strike-gmax', 'Urshifu-Gmax'],
    ['urshifu', 'rapid-strike-gmax', 'Urshifu-Rapid-Strike-Gmax'],
    ['giratina', 'origin', 'Giratina-Origin'],
    ['necrozma', 'dusk', 'Necrozma-Dusk-Mane'],
    ['necrozma', 'dawn', 'Necrozma-Dawn-Wings'],
    ['ogerpon', 'wellspring-mask', 'Ogerpon-Wellspring'],
    ['ogerpon', 'hearthflame-mask', 'Ogerpon-Hearthflame'],
    ['ogerpon', 'cornerstone-mask', 'Ogerpon-Cornerstone'],
  ])('%s / %s를 정확한 %s 키에 연결한다', (speciesName, formKey, key) => {
    const data = normalizeSmogonSets({ [key]: { ou: { Exact: candidate } }, [speciesName]: { ou: { Base: candidate } } })
    const result = selectSmogonSets(data, { speciesName, formKey }, 9)
    expect(result.flatMap(({ sets }) => sets.map((set) => set.name))).toEqual(['Exact'])
    expect(selectSmogonSets(data, { speciesName, formKey: `${formKey}-unknown` }, 9)).toEqual([])
  })

  it('인덱스의 실제 네크로즈마·오거폰 폼이 기본·형제 폼 세팅과 섞이지 않는다 (D-01)', () => {
    const externalNames = new Map([
      ['dusk', 'Necrozma-Dusk-Mane'], ['dawn', 'Necrozma-Dawn-Wings'],
      ['wellspring-mask', 'Ogerpon-Wellspring'], ['hearthflame-mask', 'Ogerpon-Hearthflame'],
      ['cornerstone-mask', 'Ogerpon-Cornerstone'],
    ])
    let checked = 0
    for (const pokemon of pokemonIndex.filter(({ id }) => id === 800 || id === 1017)) {
      const raw = Object.fromEntries([
        [pokemon.nameEn, { ou: { Base: candidate } }],
        ...pokemon.forms.filter(({ key }) => externalNames.has(key))
          .map(({ key }) => [externalNames.get(key)!, { ou: { [key]: candidate } }]),
      ])
      const data = normalizeSmogonSets(raw)
      for (const { key } of pokemon.forms.filter(({ key }) => externalNames.has(key))) {
        const result = selectSmogonSets(data, { speciesName: pokemon.nameEn, formKey: key }, pokemon.id === 800 ? 7 : 9)
        expect(result.flatMap(({ sets }) => sets.map(({ name }) => name)), `${pokemon.nameEn}/${key}`).toEqual([key])
        checked++
      }
    }
    expect(checked).toBe(5)
  })

  it('전체 인덱스 폼을 조회할 때 세팅이 없으면 기본·알 수 없는 폼으로 대체하지 않는다', () => {
    let checked = 0
    for (const pokemon of pokemonIndex) {
      // D-04: PokéAPI의 파밀리쥐 기본 폼은 Smogon의 Maushold-Four다.
      const baseName = pokemon.id === 925 ? 'Maushold-Four' : pokemon.nameEn
      const data = normalizeSmogonSets({ [baseName]: { ou: { Base: candidate } } })
      for (const form of pokemon.forms) {
        for (const generation of [9, 8, 7, 6]) {
          const identity = { speciesName: pokemon.nameEn, formKey: form.key }
          expect(selectSmogonSets(data, identity, generation), `${pokemon.nameEn}/${form.key}/gen${generation}`).toEqual([])
          expect(selectSmogonSets(data, { ...identity, formKey: `${form.key}-unknown` }, generation)).toEqual([])
        }
        checked++
      }
    }
    expect(checked).toBe(361)
  })

  it('최신 메가는 정확한 키가 있는 지원 세대만 연결하고 기본 폼으로 대체하지 않는다', () => {
    const data = normalizeSmogonSets({ 'Raichu-Mega-X': { ou: { Exact: candidate } }, Raichu: { ou: { Base: candidate } } })
    const identity = { speciesName: 'raichu', formKey: 'mega-x' }
    expect(selectSmogonSets(data, identity, 7)[0].sets[0].name).toBe('Exact')
    expect(selectSmogonSets(data, identity, 9)).toEqual([])
    expect(selectSmogonSets(data, { ...identity, formKey: 'mega-y' }, 7)).toEqual([])
  })

  it('이름의 중간에 mega가 있는 최신 폼도 정확히 연결한다', () => {
    const data = normalizeSmogonSets({ 'Meowstic-F-Mega': { ou: { Exact: candidate } } })
    const identity = { speciesName: 'meowstic', formKey: 'female-mega' }
    expect(selectSmogonSets(data, identity, 7)[0].sets[0].name).toBe('Exact')
    expect(selectSmogonSets(data, identity, 9)).toEqual([])
  })

  it.each([
    ['family-of-three', 'Three'],
    ['default', 'Four'],
  ])('D-04: 파밀리쥐 %s 폼에 %s 세팅만 연결한다', (formKey, expectedName) => {
    const data = normalizeSmogonSets({
      Maushold: { ou: { Three: candidate } },
      'Maushold-Four': { ru: { Four: candidate } },
    })
    const original = JSON.stringify(data)
    expect(selectSmogonSets(data, { speciesName: 'maushold', formKey }, 9)
      .flatMap(({ sets }) => sets.map(({ name }) => name))).toEqual([expectedName])
    expect(JSON.stringify(data)).toBe(original)
  })

  it.each([
    ['default', 'Maushold'],
    ['family-of-three', 'Maushold-Four'],
  ])('D-04: %s 세팅이 없을 때 다른 가족 폼(%s)으로 대체하지 않는다', (formKey, otherName) => {
    const data = normalizeSmogonSets({ [otherName]: { ou: { Other: candidate } } })
    expect(selectSmogonSets(data, { speciesName: 'maushold', formKey }, 9)).toEqual([])
  })

  it('메가레쿠쟈는 6·7세대 anythinggoes의 화룡점정 후보만 표시한다', () => {
    const data = normalizeSmogonSets({ Rayquaza: {
      anythinggoes: {
        Mega: { moves: [['Dragon Ascent', 'Outrage'], 'Extreme Speed'], item: 'Life Orb' },
        Base: { moves: ['Outrage'] },
      },
      ubers: { Normal: { moves: ['Dragon Ascent'] } },
    } })
    const original = JSON.stringify(data)
    for (const generation of [6, 7]) {
      const mega = selectSmogonSets(data, { speciesName: 'rayquaza', formKey: 'mega' }, generation)
      expect(mega.map((entry) => entry.format)).toEqual(['anythinggoes'])
      expect(mega[0].sets.map((set) => set.name)).toEqual(['Mega'])
      expect(mega[0].sets[0].moves[0]).toEqual(['Dragon Ascent'])
      const base = selectSmogonSets(data, { speciesName: 'rayquaza', formKey: 'default' }, generation)
      expect(base.flatMap((entry) => entry.sets.map((set) => set.name))).toEqual(['Base', 'Normal'])
    }
    expect(selectSmogonSets(data, { speciesName: 'rayquaza', formKey: 'mega' }, 8)).toEqual([])
    expect(selectSmogonSets(data, { speciesName: 'rayquaza', formKey: 'default' }, 8)[0].sets).toHaveLength(2)
    expect(JSON.stringify(data)).toBe(original)
  })

  it('D-03: 8세대 National Dex AG 화룡점정 후보만 기본 레쿠쟈에서 제외한다', () => {
    const data = normalizeSmogonSets({ Rayquaza: {
      dlc1nationaldexag: {
        'Choice Band': { moves: ['Dragon Ascent', 'Extreme Speed', 'V-create', ['Earthquake', 'Outrage', 'Draco Meteor']] },
        'Mixed Life Orb': { moves: [['Draco Meteor', 'Dragon Ascent'], 'V-create', 'Extreme Speed'] },
        'Setup Sweeper': { moves: [['Dragon Dance', 'Swords Dance'], 'Dragon Ascent', 'Extreme Speed'] },
        'Without Dragon Ascent': { moves: ['Outrage', 'Extreme Speed'] },
      },
      anythinggoes: { 'Dynamax Sweeper': { moves: [['Swords Dance', 'Dragon Dance'], 'Dragon Ascent', 'V-create'] } },
      ubers: { 'Regular attacker': { moves: ['Dragon Ascent', 'Draco Meteor'] } },
    } })
    const original = JSON.stringify(data)
    const result = selectSmogonSets(data, { speciesName: 'rayquaza', formKey: 'default' }, 8)
    expect(result.map(({ format, sets }) => [format, sets.map(({ name }) => name)])).toEqual([
      ['dlc1nationaldexag', ['Without Dragon Ascent']],
      ['anythinggoes', ['Dynamax Sweeper']],
      ['ubers', ['Regular attacker']],
    ])
    expect(selectSmogonSets(data, { speciesName: 'rayquaza', formKey: 'mega' }, 8)).toEqual([])
    expect(selectSmogonSets(data, { speciesName: 'rayquaza', formKey: 'mega' }, 9)).toEqual([])
    expect(JSON.stringify(data)).toBe(original)
  })

  it('ADR-016의 변칙 포맷 9종을 제거하고 일반 포맷을 유지한다', () => {
    const excluded = ['balancedhackmons', 'purehackmons', 'almostanyability', 'stabmons', 'cap',
      'mixandmega', 'godlygift', 'camomons', 'partnersincrime']
    const formats = Object.fromEntries([...excluded, 'ou', 'anythinggoes'].map((format) => [format, { Candidate: candidate }]))
    const data = normalizeSmogonSets({ Pikachu: formats })
    expect(selectSmogonSets(data, { speciesName: 'pikachu', formKey: 'default' }, 9).map((entry) => entry.format))
      .toEqual(['ou', 'anythinggoes'])
  })
})
