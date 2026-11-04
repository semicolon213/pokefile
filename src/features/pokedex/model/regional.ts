import { SCOPE, type GameVersionInfo } from '@/shared/config/scope'
import type { Generation, PokemonId } from '@/shared/models'

// 지방 도감 (FR-31, TASK-019, ADR-017). 지방을 고르면 그 지방 도감 전체를 지방 번호 순으로 보여 준다.
// 판은 내 게임이 그 지방 게임이면 그 게임의 도감, 아니면 그 지방에서 가장 많이 수록한 판(scope.json defaultDexes).

/** 검색 인덱스의 지방 도감: 도감 이름 → 시작 번호(0 또는 1)와 지방 번호 순서의 전국도감 번호 */
export type RegionalDexData = Record<string, { start: number; ids: PokemonId[] }>

export type RegionalEntry = { label: string; number: number; order: number }

const DEX_INFO = new Map(SCOPE.pokedexes.map((d) => [d.name, d]))
const regionOf = (dexes: readonly string[]) => DEX_INFO.get(dexes[0])?.region

/** 이 세대(지방)를 고를 때 쓸 도감 이름들 */
export function dexesFor(gen: Generation, myGame: GameVersionInfo | null): readonly string[] {
  const defaults = SCOPE.generations.find((g) => g.id === gen)?.defaultDexes ?? []
  if (myGame && regionOf(myGame.dexes) === regionOf(defaults)) return myGame.dexes
  return defaults
}

/**
 * 도감들을 이어 붙인 순서. 여러 도감에 있는 종은 처음 나온 도감의 번호를 쓴다(본편 → DLC 순).
 * 인덱스에 없는 도감은 건너뛴다.
 */
export function regionalOrder(dexes: readonly string[], data: RegionalDexData): Map<PokemonId, RegionalEntry> {
  const order = new Map<PokemonId, RegionalEntry>()
  for (const name of dexes) {
    const dex = data[name]
    const label = DEX_INFO.get(name)?.label ?? name
    if (!dex) continue
    dex.ids.forEach((id, i) => {
      if (!order.has(id)) order.set(id, { label, number: dex.start + i, order: order.size })
    })
  }
  return order
}

/** 카드 표기: '성도 #010' */
export function formatRegionalNumber(entry: RegionalEntry): string {
  return `${entry.label} #${String(entry.number).padStart(3, '0')}`
}

/** 어느 판인지 안내: 이 도감 조합을 쓰는 게임 이름 ('하트골드·소울실버') */
export function editionLabel(dexes: readonly string[]): string {
  const key = dexes.join('|')
  return SCOPE.gameVersions
    .filter((g) => g.dexes.join('|') === key)
    .map((g) => g.label)
    .join('·')
}
