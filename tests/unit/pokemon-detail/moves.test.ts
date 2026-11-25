import { describe, expect, it } from 'vitest'
import {
  defaultGame,
  gamesWithMoves,
  levelLabel,
  machineLabel,
  movesForGame,
  toLearnset,
  type MoveData,
  type RawPokemonMoves,
} from '@/features/pokemon-detail/model/moves'

// TASK-015 / FR-27 기술 표 (OQ-23 담당자 제안 범위: 레벨업·폼 변경·기술머신·기술 가르침)
const res = (name: string) => ({ name, url: '' })
const learn = (move: string, details: [group: string, method: string, level: number][]): NonNullable<RawPokemonMoves['moves']>[number] => ({
  move: res(move),
  version_group_details: details.map(([group, method, level]) => ({
    version_group: res(group),
    move_learn_method: res(method),
    level_learned_at: level,
  })),
})

const RAW: RawPokemonMoves = {
  moves: [
    learn('flamethrower', [['scarlet-violet', 'level-up', 30], ['scarlet-violet', 'machine', 0], ['red-blue', 'machine', 0]]),
    learn('scratch', [['scarlet-violet', 'level-up', 1], ['red-blue', 'level-up', 1]]),
    learn('air-slash', [['scarlet-violet', 'level-up', 0]]),
    learn('dragon-claw', [['scarlet-violet', 'machine', 0]]),
    learn('hydro-pump', [['scarlet-violet', 'form-change', 0]]),
    learn('blast-burn', [['sword-shield', 'tutor', 0]]),
    learn('flare-blitz', [['legends-arceus', 'tutor', 0]]),
    // 범위 밖: 교배 기술, 콜로세움·Champions 판, Z-A 떠올리기
    learn('dragon-dance', [['scarlet-violet', 'egg', 0], ['colosseum', 'level-up', 1], ['champions', 'train', 0], ['legends-za', 'reminder', 0]]),
  ],
}

const DATA: MoveData = {
  moves: {
    flamethrower: ['화염방사', 'fire', 'special', 90, 100, 15],
    scratch: ['할퀴기', 'normal', 'physical', 40, 100, 35],
    'air-slash': ['에어슬래시', 'flying', 'special', 75, 95, 15],
    'dragon-claw': ['드래곤크루', 'dragon', 'physical', 80, 100, 15],
    'hydro-pump': ['하이드로펌프', 'water', 'special', 110, 80, 5],
    'blast-burn': ['블래스트번', 'fire', 'special', 150, 90, 5],
  },
  machines: { 'scarlet-violet': { flamethrower: 'tm125', 'dragon-claw': 'tm082' }, 'red-blue': {} },
}

describe('toLearnset·gamesWithMoves', () => {
  it('내 게임 범위의 판과 레벨업·폼 변경·기술머신·기술 가르침만 남긴다', () => {
    const learnset = toLearnset(RAW)
    expect(Object.keys(learnset).sort()).toEqual(['legends-arceus', 'red-blue', 'scarlet-violet', 'sword-shield'])
    expect(learnset['scarlet-violet'].some((r) => r.move === 'dragon-dance')).toBe(false)
  })

  it('기록이 있는 판을 최신 게임부터 돌려준다', () => {
    expect(gamesWithMoves(toLearnset(RAW))).toEqual(['scarlet-violet', 'legends-arceus', 'sword-shield', 'red-blue'])
  })

  it('moves 필드가 없으면 빈 기록', () => {
    expect(gamesWithMoves(toLearnset({}))).toEqual([])
  })
})

describe('defaultGame (FR-26 내 게임)', () => {
  const games = ['scarlet-violet', 'sword-shield', 'red-blue']
  it('내 게임이 없으면 가장 최신 판', () => {
    expect(defaultGame(games, null)).toEqual({ game: 'scarlet-violet', myGameMissing: false })
  })
  it('내 게임의 판을 고른다 (DLC 판은 본편 버전에 속함)', () => {
    expect(defaultGame(games, 'shield')).toEqual({ game: 'sword-shield', myGameMissing: false })
    expect(defaultGame(games, 'blue')).toEqual({ game: 'red-blue', myGameMissing: false })
  })
  it('내 게임 기록이 없으면 최신 판을 보여 주고 알린다', () => {
    expect(defaultGame(games, 'x')).toEqual({ game: 'scarlet-violet', myGameMissing: true })
  })
  it('기록이 하나도 없으면 null', () => {
    expect(defaultGame([], 'x')).toEqual({ game: null, myGameMissing: true })
  })
})

describe('movesForGame', () => {
  const learnset = toLearnset(RAW)

  it('레벨업은 폼 변경 → 진화 → 레벨 순, 같은 기술을 다른 레벨에 배우면 둘 다 둔다', () => {
    const { levelUp } = movesForGame(learnset, 'scarlet-violet', DATA)
    expect(levelUp.map((r) => [levelLabel(r.level), r.label])).toEqual([
      ['폼 변경', '하이드로펌프'],
      ['진화', '에어슬래시'],
      ['Lv.1', '할퀴기'],
      ['Lv.30', '화염방사'],
    ])
    expect(levelUp[3]).toMatchObject({ type: 'fire', damageClass: 'special', power: 90, accuracy: 100, pp: 15 })
  })

  it('기술머신은 번호 순, 번호가 없으면 뒤로', () => {
    const { machine } = movesForGame(learnset, 'scarlet-violet', DATA)
    expect(machine.map((r) => [r.machine && machineLabel(r.machine), r.label])).toEqual([
      ['기술머신 82', '드래곤크루'],
      ['기술머신 125', '화염방사'],
    ])
    expect(movesForGame(learnset, 'red-blue', DATA).machine[0].machine).toBeUndefined()
  })

  it('기술 가르침 — 정적 데이터에 없는 기술은 식별자로 표시한다', () => {
    expect(movesForGame(learnset, 'sword-shield', DATA).tutor.map((r) => r.label)).toEqual(['블래스트번'])
    expect(movesForGame(learnset, 'legends-arceus', DATA).tutor[0]).toMatchObject({ label: 'flare-blitz', type: null, power: null })
  })

  it('기록이 없는 판은 빈 표', () => {
    expect(movesForGame(learnset, 'x-y', DATA)).toEqual({ levelUp: [], machine: [], tutor: [] })
  })
})

describe('movesForGame — 선택 게임 당시의 값 (QA D-015-01)', () => {
  const GAMES = ['red-blue', 'crystal', 'ruby-sapphire', 'diamond-pearl', 'black-white', 'x-y', 'sun-moon', 'scarlet-violet']
  const raw: RawPokemonMoves = {
    moves: ['flamethrower', 'bite', 'crunch', 'curse', 'tackle', 'water-shuriken'].map((move) => learn(move, GAMES.map((group) => [group, 'level-up', 1]))),
  }
  const data: MoveData = {
    moves: {
      flamethrower: ['화염방사', 'fire', 'special', 90, 100, 15, [['x-y', null, 95, null, null]]],
      bite: ['물기', 'dark', 'physical', 60, 100, 25, [['gold-silver', 'normal', null, null, null]]],
      crunch: ['깨물어부수기', 'dark', 'physical', 80, 100, 15],
      curse: ['저주', 'ghost', 'status', null, null, 10, [['black-white', 'unknown', null, null, null]]],
      // 여러 번 바뀐 기술: 2세대 전 30·명중 95, 2세대부터 50(명중 100), 6세대부터 지금 값 40·PP 35
      // 4세대 이후 분류 변경 (Showdown): 물수리검은 6세대까지 물리
      'water-shuriken': ['물수리검', 'water', 'special', 15, 100, 20, [['sun-moon', null, null, null, null, 'physical']]],
      tackle: ['몸통박치기', 'normal', 'physical', 40, 100, 35, [['x-y', null, 50, null, 35], ['gold-silver', null, 30, 95, null]]],
    },
    machines: {},
  }
  const learnset = toLearnset(raw)
  const row = (game: string, move: string) => movesForGame(learnset, game, data).levelUp.find((r) => r.name === move)!

  it('기술이 바뀐 판보다 앞선 게임은 이전 값, 그 판부터는 지금 값', () => {
    expect(row('red-blue', 'flamethrower').power).toBe(95)
    expect(row('black-white', 'flamethrower').power).toBe(95)
    expect(row('x-y', 'flamethrower').power).toBe(90)
    expect(row('scarlet-violet', 'flamethrower').power).toBe(90)
  })

  it('여러 번 바뀌었으면 선택 게임 뒤의 가장 이른 변경의 이전 값을 쓴다', () => {
    expect(row('red-blue', 'tackle')).toMatchObject({ power: 30, accuracy: 95, pp: 35 })
    expect(row('crystal', 'tackle')).toMatchObject({ power: 50, accuracy: 100, pp: 35 })
    expect(row('scarlet-violet', 'tackle')).toMatchObject({ power: 40, accuracy: 100, pp: 35 })
  })

  it('이전 타입을 쓰고, 3세대까지는 물리·특수를 타입으로 정한다', () => {
    expect(row('red-blue', 'bite')).toMatchObject({ type: 'normal', damageClass: 'physical' })
    expect(row('crystal', 'bite')).toMatchObject({ type: 'dark', damageClass: 'special' })
    expect(row('ruby-sapphire', 'crunch')).toMatchObject({ type: 'dark', damageClass: 'special' })
    expect(row('diamond-pearl', 'crunch')).toMatchObject({ type: 'dark', damageClass: 'physical' })
    expect(row('red-blue', 'flamethrower').damageClass).toBe('special')
  })

  it('4세대 이후 기술별 분류 변경도 선택 게임 기준 (QA D-015-01-R1 물수리검)', () => {
    expect(row('x-y', 'water-shuriken').damageClass).toBe('physical')
    expect(row('sun-moon', 'water-shuriken').damageClass).toBe('special')
    expect(row('scarlet-violet', 'water-shuriken').damageClass).toBe('special')
  })

  it('2~4세대 저주는 ??? 타입(unknown), 변화 기술 분류는 그대로', () => {
    expect(row('diamond-pearl', 'curse')).toMatchObject({ type: 'unknown', damageClass: 'status' })
    expect(row('black-white', 'curse').type).toBe('ghost')
  })
})

describe('라벨', () => {
  it('머신 종류와 두 자리 번호', () => {
    expect(machineLabel({ kind: 'tm', number: 1 })).toBe('기술머신 01')
    expect(machineLabel({ kind: 'hm', number: 3 })).toBe('비전머신 03')
    expect(machineLabel({ kind: 'tr', number: 12 })).toBe('기술레코드 12')
  })
})
