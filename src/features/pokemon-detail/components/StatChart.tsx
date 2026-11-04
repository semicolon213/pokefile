import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { BaseStat } from '../model/detail'
import { statTotal } from '../model/detail'

type Props = { stats: readonly BaseStat[] }

/** 종족값 최댓값(HP 255)에 맞춰 막대 길이를 비교 가능하게 고정한다 */
const STAT_MAX = 255

function barColor(value: number): string {
  if (value >= 120) return '#2e9e5b'
  if (value >= 90) return '#7cb342'
  if (value >= 60) return '#f2b01e'
  return '#e8743b'
}

// FR-14: 차트와 같은 수치를 텍스트로도 제공한다 (DESIGN.md §5.2).
export function StatChart({ stats }: Props) {
  return (
    <div className="detail-stats">
      <div className="detail-stats__chart" aria-hidden="true">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[...stats]} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <XAxis type="number" domain={[0, STAT_MAX]} hide />
            <YAxis type="category" dataKey="label" width={72} tickLine={false} axisLine={false} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive={false}>
              {stats.map((stat) => (
                <Cell key={stat.key} fill={barColor(stat.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="detail-stats__table">
        <caption className="detail-visually-hidden">종족값 수치</caption>
        <tbody>
          {stats.map((stat) => (
            <tr key={stat.key}>
              <th scope="row">{stat.label}</th>
              <td>{stat.value}</td>
            </tr>
          ))}
          <tr className="detail-stats__total">
            <th scope="row">합계</th>
            <td>{statTotal(stats)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
