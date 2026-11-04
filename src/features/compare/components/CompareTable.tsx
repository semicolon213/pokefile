import { STATS, STAT_MAX, statTotal, winner, type CompareStats } from '../model/compare'

type Side = { name: string; stats: CompareStats }

/**
 * 종족값 비교표: 행마다 A·B 값과 같은 눈금(0~255)의 막대 한 쌍, 차이.
 * 더 높은 값은 굵은 글자로 표시한다(색은 포켓몬 구분에만 쓴다). 표 자체가 접근 가능한 데이터 보기다.
 */
export function CompareTable({ a, b }: { a: Side; b: Side }) {
  const rows = [
    ...STATS.map(({ key, label }) => ({ key, label, av: a.stats.stats[key], bv: b.stats.stats[key], bar: true })),
    { key: 'total', label: '합계', av: statTotal(a.stats.stats), bv: statTotal(b.stats.stats), bar: false },
  ]

  return (
    <div className="compare-table-wrap">
      <ul className="compare-legend" aria-label="범례">
        <li className="compare-legend__item compare-legend__item--a">
          <span className="compare-swatch" aria-hidden="true" />
          {a.name}
        </li>
        <li className="compare-legend__item compare-legend__item--b">
          <span className="compare-swatch" aria-hidden="true" />
          {b.name}
        </li>
      </ul>
      <table className="compare-table">
        <caption className="visually-hidden">
          {a.name}와 {b.name}의 종족값 비교. 막대는 0~{STAT_MAX} 눈금
        </caption>
        <thead>
          <tr>
            <th scope="col">능력치</th>
            {/* 이름은 바로 위 범례에 있으므로 열 머리는 색 칩 + A/B로 짧게 (화면 낭독기는 이름을 읽는다) */}
            <th scope="col" className="compare-table__num compare-table__head--a">
              <span className="compare-swatch" aria-hidden="true" />
              <span aria-hidden="true">A</span>
              <span className="visually-hidden">{a.name}</span>
            </th>
            <th scope="col" className="compare-table__bars">
              <span className="visually-hidden">막대</span>
            </th>
            <th scope="col" className="compare-table__num compare-table__head--b">
              <span className="compare-swatch" aria-hidden="true" />
              <span aria-hidden="true">B</span>
              <span className="visually-hidden">{b.name}</span>
            </th>
            <th scope="col" className="compare-table__diff">차이</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label, av, bv, bar }) => {
            const win = winner(av, bv)
            const diff = Math.abs(av - bv)
            return (
              <tr key={key} className={bar ? undefined : 'compare-table__total'}>
                <th scope="row">{label}</th>
                <td className="compare-table__num tabular" data-win={win === 'a' || undefined}>
                  {av}
                </td>
                <td className="compare-table__bars" aria-hidden="true">
                  {bar && (
                    <span className="compare-bars">
                      <span className="compare-bar compare-bar--a" style={{ width: `${(av / STAT_MAX) * 100}%` }} />
                      <span className="compare-bar compare-bar--b" style={{ width: `${(bv / STAT_MAX) * 100}%` }} />
                    </span>
                  )}
                </td>
                <td className="compare-table__num tabular" data-win={win === 'b' || undefined}>
                  {bv}
                </td>
                <td className="compare-table__diff tabular">
                  {win === 'tie' ? '같음' : `${win === 'a' ? a.name : b.name} +${diff}`}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
