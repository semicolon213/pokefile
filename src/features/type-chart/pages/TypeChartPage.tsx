import { useSearchParams } from 'react-router'
import { POKEMON_TYPES, type PokemonType } from '@/shared/models'
import { TYPE_LABELS, useDocumentTitle } from '@/shared/ui'
import { DefenseGroups } from '../components/DefenseGroups'
import { TypeChartTable } from '../components/TypeChartTable'
import { MAX_DEFENSE_TYPES, parseDefenseTypes } from '../model/params'
import '../TypeChart.css'

// FR-24 타입 상성 화면 (/types?type=fire&type=flying). 방어 타입 1~2개를 고르면 받는 피해를 묶어 보여 준다.
export function TypeChartPage() {
  useDocumentTitle('타입 상성')
  const [params, setParams] = useSearchParams()
  const selected = parseDefenseTypes(params)
  const full = selected.length >= MAX_DEFENSE_TYPES

  const write = (types: PokemonType[]) => {
    const next = new URLSearchParams(params)
    next.delete('type')
    for (const t of POKEMON_TYPES) if (types.includes(t)) next.append('type', t)
    setParams(next, { replace: true })
  }
  const toggle = (type: PokemonType) => {
    if (selected.includes(type)) write(selected.filter((t) => t !== type))
    else if (!full) write([...selected, type])
  }

  return (
    <div className="type-chart-page">
      <h1>타입 상성</h1>

      <section className="type-chart-page__calc" aria-labelledby="defense-picker-title">
        <h2 id="defense-picker-title">받는 피해 계산</h2>
        <div className="type-picker" role="group" aria-label="방어 타입" aria-describedby="type-picker-hint">
          {POKEMON_TYPES.map((type) => {
            const pressed = selected.includes(type)
            return (
              <button
                key={type}
                type="button"
                className={`type-picker__chip type--${type}`}
                aria-pressed={pressed}
                disabled={full && !pressed}
                onClick={() => toggle(type)}
              >
                {TYPE_LABELS[type]}
              </button>
            )
          })}
          {selected.length > 0 && (
            <button type="button" className="type-picker__clear" onClick={() => write([])}>
              선택 해제
            </button>
          )}
        </div>
        <p id="type-picker-hint" className="type-picker__hint">
          {full
            ? '타입은 2개까지 고를 수 있어요. 바꾸려면 하나를 해제하세요.'
            : '포켓몬의 타입을 1~2개 고르면 받는 피해를 계산해요.'}
        </p>

        <div className="type-chart-page__result" aria-live="polite">
          {selected.length > 0 && (
            <>
              <h3>{selected.map((t) => TYPE_LABELS[t]).join('·')} 타입이 받는 피해</h3>
              <DefenseGroups types={selected} />
            </>
          )}
        </div>
      </section>

      <section className="type-chart-page__table" aria-labelledby="type-chart-title">
        <h2 id="type-chart-title">전체 상성표</h2>
        <ul className="type-chart-legend" aria-label="범례">
          <li>
            <span className="type-chart-legend__swatch type-chart__cell--super">2</span>효과가 굉장함
          </li>
          <li>
            <span className="type-chart-legend__swatch type-chart__cell--weak">½</span>효과가 별로
          </li>
          <li>
            <span className="type-chart-legend__swatch type-chart__cell--none">0</span>효과 없음
          </li>
          <li>
            <span className="type-chart-legend__swatch" />보통
          </li>
        </ul>
        <TypeChartTable highlight={selected} />
      </section>
    </div>
  )
}
