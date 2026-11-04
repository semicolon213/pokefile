import { Link } from 'react-router'
import type { PokemonType } from '@/shared/models'
import { TYPE_LABELS } from '@/shared/ui'
import { typeChartPath } from '../model/params'
import { DefenseGroups } from './DefenseGroups'
import '../TypeChart.css'

/**
 * 상세 화면의 타입 상성 섹션 (FR-24, TASK-021). 선택한 폼의 타입 기준으로 받는 피해를 보여 준다.
 * 상세 화면 연결부는 상세 담당(임지섭)이 확인한다 (TASKS 교차 규칙).
 */
export function TypeMatchups({ types }: { types: readonly PokemonType[] }) {
  if (types.length === 0) return null
  return (
    <section className="type-matchups" aria-labelledby="type-matchups-title">
      <div className="type-matchups__head">
        <h2 id="type-matchups-title">타입 상성</h2>
        <Link to={typeChartPath(types)} className="type-matchups__more">
          전체 상성표
        </Link>
      </div>
      <p className="type-matchups__lead">{types.map((t) => TYPE_LABELS[t]).join('·')} 타입이 받는 피해</p>
      <DefenseGroups types={types} />
    </section>
  )
}
