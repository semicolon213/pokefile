import { formatMultiplier } from '@/features/type-chart'
import { TYPE_LABELS } from '@/shared/ui'
import type { DefenseRow } from '../model/team'

type Props = {
  rows: DefenseRow[]
  /** 파티 순서대로 열 머리에 쓸 이름 */
  names: string[]
}

const cellClass = (m: number) =>
  m >= 2 ? 'team-defense__cell team-defense__cell--weak' : m <= 0.5 ? 'team-defense__cell team-defense__cell--resist' : 'team-defense__cell'

/**
 * 받는 피해 표: 행 = 공격 타입, 열 = 파티 포켓몬 + 약점·반감 수 (DESIGN §2.4.3).
 * 방어 관점이라 상성표의 초록·빨강 대신 약점은 경고 면 + 굵은 글자, 반감·무효는 보조 글자색으로 구분하고 배율을 항상 적는다.
 */
export function DefenseTable({ rows, names }: Props) {
  return (
    <div className="team-defense__scroll" tabIndex={0} role="region" aria-label="받는 피해 표 (가로로 스크롤)">
      <table className="team-defense">
        <caption className="visually-hidden">공격 타입별로 파티 포켓몬이 받는 피해 배율. 빈 칸은 보통(1배)</caption>
        <thead>
          <tr>
            <th scope="col" className="team-defense__corner">
              공격 타입
            </th>
            {names.map((name, i) => (
              <th key={i} scope="col" className="team-defense__member">
                {name}
              </th>
            ))}
            <th scope="col" className="team-defense__count">
              약점
            </th>
            <th scope="col" className="team-defense__count">
              반감
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.attack} data-caution={row.caution || undefined}>
              <th scope="row" className={`team-defense__type type--${row.attack}`}>
                {TYPE_LABELS[row.attack]}
                {row.caution && <span className="team-defense__caution">주의</span>}
              </th>
              {row.multipliers.map((m, i) => (
                <td key={i} className={cellClass(m)}>
                  {m === 1 ? <span className="visually-hidden">1</span> : formatMultiplier(m)}
                </td>
              ))}
              <td className={`team-defense__total${row.weak > 0 ? ' team-defense__total--weak' : ''}`}>{row.weak}</td>
              <td className="team-defense__total">{row.resist}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
