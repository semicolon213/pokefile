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

describe('라벨', () => {
  it('머신 종류와 두 자리 번호', () => {
    expect(machineLabel({ kind: 'tm', number: 1 })).toBe('기술머신 01')
    expect(machineLabel({ kind: 'hm', number: 3 })).toBe('비전머신 03')
    expect(machineLabel({ kind: 'tr', number: 12 })).toBe('기술레코드 12')
  })
})
