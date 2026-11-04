import { POKEMON_TYPES, type PokemonType } from '@/shared/models'
import { TYPE_LABELS } from '@/shared/ui'
import { formatMultiplier, typeEffectiveness } from '../model/matchup'

const TONE: Record<number, string> = { 2: 'super', 0.5: 'weak', 0: 'none' }
const DESCRIPTION: Record<number, string> = { 2: '효과가 굉장함', 0.5: '효과가 별로', 0: '효과 없음' }

/** 18×18 상성표: 행 = 공격 타입, 열 = 방어 타입. 고른 방어 타입 열을 강조한다. */
export function TypeChartTable({ highlight }: { highlight: readonly PokemonType[] }) {
  return (
    <div className="type-chart__scroll" tabIndex={0} role="region" aria-label="전체 타입 상성표 (가로로 스크롤)">
      <table className="type-chart">
        <caption className="visually-hidden">행은 공격 타입, 열은 방어 타입. 빈 칸은 보통(×1)</caption>
        <thead>
          <tr>
            <th scope="col" className="type-chart__corner">
              <span>공격 ↓</span>
              <span>방어 →</span>
            </th>
            {POKEMON_TYPES.map((def) => (
              <th
                key={def}
                scope="col"
                className={`type-chart__col type--${def}`}
                data-highlight={highlight.includes(def) || undefined}
              >
                {TYPE_LABELS[def]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {POKEMON_TYPES.map((atk) => (
            <tr key={atk}>
              <th scope="row" className={`type-chart__row type--${atk}`}>
                {TYPE_LABELS[atk]}
              </th>
              {POKEMON_TYPES.map((def) => {
                const m = typeEffectiveness(atk, def)
                return (
                  <td
                    key={def}
                    className={TONE[m] ? `type-chart__cell type-chart__cell--${TONE[m]}` : 'type-chart__cell'}
                    data-highlight={highlight.includes(def) || undefined}
                    title={m === 1 ? undefined : `${TYPE_LABELS[atk]} → ${TYPE_LABELS[def]}: ×${formatMultiplier(m)} ${DESCRIPTION[m]}`}
                  >
                    {m === 1 ? '' : formatMultiplier(m)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
