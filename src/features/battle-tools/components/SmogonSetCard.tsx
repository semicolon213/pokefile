import { Fragment } from 'react'
import type { SmogonSet, SmogonStatSpread } from '../model/smogon'

const STAT_LABELS = {
  hp: 'HP', atk: '공격', def: '방어', spa: '특수공격', spd: '특수방어', spe: '스피드',
} as const

function Choices({ values }: { values: string[] }) {
  return values.length > 0 ? <>{values.map((value, index) => (
    <Fragment key={`${value}:${index}`}>{index > 0 && ' 또는 '}<span lang="en">{value}</span></Fragment>
  ))}</> : <>정보 없음</>
}

function Spreads({ values }: { values: SmogonStatSpread[] }) {
  if (values.length === 0) return <>정보 없음</>
  return (
    <ul className="smogon-spreads">
      {values.map((spread, index) => (
        <li key={index}>
          {index > 0 && <span className="smogon-or">또는 </span>}
          {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[])
            .filter((stat) => spread[stat] !== undefined)
            .map((stat) => `${STAT_LABELS[stat]} ${spread[stat]}`)
            .join(' / ') || '정보 없음'}
        </li>
      ))}
    </ul>
  )
}

export function SmogonSetCard({ set }: { set: SmogonSet }) {
  return (
    <article className="smogon-card" aria-label={set.name}>
      <h3 lang="en">{set.name}</h3>
      <dl className="smogon-fields">
        <div><dt>성격</dt><dd><Choices values={set.natures} /></dd></div>
        <div><dt>특성</dt><dd><Choices values={set.abilities} /></dd></div>
        <div><dt>도구</dt><dd><Choices values={set.items} /></dd></div>
        <div><dt>노력치</dt><dd><Spreads values={set.evs} /></dd></div>
        <div><dt>개체값</dt><dd><Spreads values={set.ivs} /></dd></div>
      </dl>
      <h4>기술</h4>
      {set.moves.length > 0 ? (
        <ol className="smogon-moves">
          {set.moves.map((slot, index) => <li key={index}><Choices values={slot} /></li>)}
        </ol>
      ) : <p>정보 없음</p>}
    </article>
  )
}
