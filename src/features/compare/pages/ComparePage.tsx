import { useSearchParams } from 'react-router'
import { useSearchIndex } from '@/features/pokedex'
import type { PokemonSummary } from '@/shared/models'
import { ErrorState, SwapIcon, useDocumentTitle } from '@/shared/ui'
import { displayName, formFullName } from '@/shared/utils'
import { CompareTable } from '../components/CompareTable'
import { PokemonPicker } from '../components/PokemonPicker'
import { useCompareStats } from '../hooks/useCompareStats'
import { parseSelection, writeSelection, type Selection, type Slot } from '../model/compare'
import '../Compare.css'

/** 화면에 쓸 이름: 기본 폼이면 종 이름, 아니면 폼까지 붙인 이름(메가리자몽X, 라이츄 (알로라의 모습)) */
function nameOf(summary: PokemonSummary | undefined, selection: Selection | null): string {
  if (!summary || !selection) return ''
  const form = summary.forms.find((f) => f.key === selection.form)
  return form ? formFullName(displayName(summary), form) : displayName(summary)
}

// FR-25 두 포켓몬 능력치 비교 (/compare?a=6&af=mega-x&b=9)
export function ComparePage() {
  useDocumentTitle('포켓몬 비교')
  const [params, setParams] = useSearchParams()
  const index = useSearchIndex()
  const selA = parseSelection(params, 'a')
  const selB = parseSelection(params, 'b')
  const byId = (sel: Selection | null) => (sel ? index.data?.find((p) => p.id === sel.id) : undefined)
  const sumA = byId(selA)
  const sumB = byId(selB)
  // 인덱스를 읽은 뒤, 인덱스에 있는 폼만 인정한다(잘못된 ?af=는 기본 폼). 그 전에는 조회하지 않는다.
  const valid = (sel: Selection | null, sum: PokemonSummary | undefined): Selection | null =>
    !sel || !sum ? null : sel.form === 'default' || sum.forms.some((f) => f.key === sel.form) ? sel : { ...sel, form: 'default' }
  const a = valid(selA, sumA)
  const b = valid(selB, sumB)
  const statsA = useCompareStats(a)
  const statsB = useCompareStats(b)

  const set = (slot: Slot, selection: Selection | null) =>
    setParams((prev) => writeSelection(prev, slot, selection), { replace: true })
  const swap = () =>
    setParams((prev) => writeSelection(writeSelection(prev, 'a', selB), 'b', selA), { replace: true })

  if (index.isError) {
    return (
      <div className="compare-page">
        <h1>포켓몬 비교</h1>
        <ErrorState message="포켓몬 목록을 불러오지 못했습니다." />
        <button type="button" className="button" onClick={() => void index.refetch()}>
          다시 시도
        </button>
      </div>
    )
  }

  const nameA = nameOf(sumA, a)
  const nameB = nameOf(sumB, b)
  const failed = statsA.isError || statsB.isError

  return (
    <div className="compare-page">
      <h1>포켓몬 비교</h1>
      {!index.data ? (
        <p role="status" className="compare-status">
          포켓몬 목록을 불러오는 중입니다.
        </p>
      ) : (
        <>
          <div className="compare-pickers">
            <PokemonPicker slot="a" label="포켓몬 A" index={index.data} selection={a} summary={sumA} stats={statsA.data} onChange={(s) => set('a', s)} />
            <button
              type="button"
              className="compare-swap"
              onClick={swap}
              disabled={!selA && !selB}
              aria-label="A와 B 바꾸기"
              title="A와 B 바꾸기"
            >
              <SwapIcon size={20} />
            </button>
            <PokemonPicker slot="b" label="포켓몬 B" index={index.data} selection={b} summary={sumB} stats={statsB.data} onChange={(s) => set('b', s)} />
          </div>

          <section className="compare-result" aria-labelledby="compare-result-title">
            <h2 id="compare-result-title">종족값 비교</h2>
            {!a || !b ? (
              <p className="compare-status">비교할 포켓몬 두 마리를 고르세요.</p>
            ) : failed ? (
              <div className="compare-status">
                <ErrorState message="종족값을 불러오지 못했습니다." />
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    if (statsA.isError) void statsA.refetch()
                    if (statsB.isError) void statsB.refetch()
                  }}
                >
                  다시 시도
                </button>
              </div>
            ) : statsA.data && statsB.data ? (
              <CompareTable a={{ name: nameA, stats: statsA.data }} b={{ name: nameB, stats: statsB.data }} />
            ) : (
              <p role="status" className="compare-status">
                종족값을 불러오는 중입니다.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
