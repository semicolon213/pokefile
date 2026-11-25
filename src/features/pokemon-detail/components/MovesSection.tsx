import { useId, useMemo, useState } from 'react'
import type { FormKey, PokemonId } from '@/shared/models'
import { useMyGame } from '@/shared/state'
import { TypeBadge } from '@/shared/ui'
import { useMoveData, usePokemonMoves } from '../hooks/useMoves'
import { versionGroupLabel } from '../model/evolution'
import {
  DAMAGE_CLASS_LABELS,
  defaultGame,
  gamesWithMoves,
  levelLabel,
  machineLabel,
  movesForGame,
  type GameMoves,
  type MoveRow,
} from '../model/moves'
import { SectionState } from './SectionState'
import './MovesSection.css'

type Props = { pokemonId: PokemonId; formKey: FormKey | null; speciesName: string | undefined }
type Method = keyof GameMoves

const METHODS: { key: Method; label: string }[] = [
  { key: 'levelUp', label: '레벨업' },
  { key: 'machine', label: '기술머신' },
  { key: 'tutor', label: '기술 가르침' },
]

// FR-27 기술 표: 게임(판)을 고르면 그 게임의 레벨업(레벨 순)·기술머신·기술 가르침 기술을 보여 준다 (TASK-015, OQ-23).
// FR-26: 내 게임이 있으면 그 게임으로 시작한다. 선택한 폼에 그 게임 기록이 없으면 다른 게임 기록으로 대신하지 않고 알린다.
export function MovesSection({ pokemonId, formKey, speciesName }: Props) {
  const learnsetQuery = usePokemonMoves(pokemonId, formKey, speciesName)
  const dataQuery = useMoveData()
  const myGame = useMyGame()
  const [chosenGame, setChosenGame] = useState<string | null>(null)
  const [method, setMethod] = useState<Method>('levelUp')
  const selectId = useId()

  const games = useMemo(() => (learnsetQuery.data ? gamesWithMoves(learnsetQuery.data) : []), [learnsetQuery.data])
  const { game: initialGame, myGameMissing } = defaultGame(games, myGame?.version)
  // 사용자가 고른 게임이 이 폼에 없으면(폼 전환 등) 기본 게임으로 돌아간다
  const game = chosenGame && games.includes(chosenGame) ? chosenGame : initialGame
  const moves = useMemo(
    () => (learnsetQuery.data && dataQuery.data && game ? movesForGame(learnsetQuery.data, game, dataQuery.data) : null),
    [learnsetQuery.data, dataQuery.data, game],
  )

  let body
  if (learnsetQuery.isError || dataQuery.isError)
    body = (
      <SectionState
        status="error"
        message="기술 정보를 불러오지 못했습니다."
        onRetry={() => {
          if (learnsetQuery.isError) void learnsetQuery.refetch()
          if (dataQuery.isError) void dataQuery.refetch()
        }}
      />
    )
  else if (!learnsetQuery.data || !dataQuery.data)
    body = <SectionState status="loading" message="기술 정보를 불러오는 중입니다." />
  else if (!game || !moves) body = <SectionState status="empty" message="등록된 기술 정보가 없습니다." />
  else {
    const rows = moves[method]
    const current = METHODS.find((m) => m.key === method)!
    body = (
      <>
        {myGame && (
          <p className="moves__notice">
            {myGameMissing
              ? `내 게임 ${myGame.label}에는 이 모습의 기술 데이터가 없습니다. 다른 게임을 고를 수 있습니다.`
              : game === initialGame
                ? `내 게임 ${myGame.label} 기준입니다.`
                : `내 게임은 ${myGame.label}입니다.`}
          </p>
        )}
        <div className="moves__controls">
          <label htmlFor={selectId}>게임</label>
          <select id={selectId} value={game} onChange={(event) => setChosenGame(event.target.value)}>
            {games.map((g) => (
              <option key={g} value={g}>
                {versionGroupLabel(g)}
              </option>
            ))}
          </select>
          <div className="moves__methods" role="group" aria-label="배우는 방법">
            {METHODS.map((m) => (
              <button key={m.key} type="button" aria-pressed={method === m.key} onClick={() => setMethod(m.key)}>
                {m.label} <span className="moves__count">{moves[m.key].length}</span>
              </button>
            ))}
          </div>
        </div>
        {rows.length > 0 ? (
          <MoveTable rows={rows} method={method} caption={`${versionGroupLabel(game)} ${current.label} 기술`} />
        ) : (
          <SectionState status="empty" message={`${versionGroupLabel(game)}에서 ${current.label}으로 배우는 기술이 없습니다.`} />
        )}
      </>
    )
  }

  return (
    <section className="detail-section" aria-labelledby="detail-moves-title">
      <h2 id="detail-moves-title">기술</h2>
      {body}
    </section>
  )
}

function MoveTable({ rows, method, caption }: { rows: MoveRow[]; method: Method; caption: string }) {
  const firstColumn = method === 'levelUp' ? '레벨' : method === 'machine' ? '번호' : null
  return (
    // 좁은 화면에서는 표 안에서만 가로로 스크롤한다 (NFR-01: 페이지 전체는 넘치지 않게)
    <div className="moves__table-wrap" tabIndex={0} role="region" aria-label="기술 표">
      <table className="moves__table">
        <caption className="detail-visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {firstColumn && <th scope="col">{firstColumn}</th>}
            <th scope="col">기술</th>
            <th scope="col">타입</th>
            <th scope="col">분류</th>
            <th scope="col" className="moves__num">위력</th>
            <th scope="col" className="moves__num">명중</th>
            <th scope="col" className="moves__num">PP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.name}:${i}`}>
              {method === 'levelUp' && <td className="moves__first">{levelLabel(row.level)}</td>}
              {method === 'machine' && <td className="moves__first">{row.machine ? machineLabel(row.machine) : '—'}</td>}
              <th scope="row" className="moves__name">
                {row.label}
              </th>
              <td>{row.type ? <TypeBadge type={row.type} size="sm" /> : '—'}</td>
              <td>{row.damageClass ? DAMAGE_CLASS_LABELS[row.damageClass] : '—'}</td>
              <td className="moves__num">{row.power ?? '—'}</td>
              <td className="moves__num">{row.accuracy ?? '—'}</td>
              <td className="moves__num">{row.pp ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
