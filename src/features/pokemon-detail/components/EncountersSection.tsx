import { useId, useState } from 'react'
import { ApiError } from '@/shared/api'
import type { PokemonId } from '@/shared/models'
import { useMyGame } from '@/shared/state'
import { useEncounters } from '../hooks/useDetailQueries'
import { GENERATION_NAMES, filterEncountersByGame, type VersionEncounters } from '../model/encounters'
import { SectionState } from './SectionState'

type Props = { pokemonId: PokemonId }

// FR-16 세대·게임별 출현 장소 (지원 범위 게임만, ADR-008). FR-18·DR-05: 데이터 없음과 요청 실패를 구분한다.
// 장소는 한국어 이름으로, 같은 장소의 구역은 합치고 만나는 방법(풀숲·낚시 등)을 함께 표시한다 (TASK-006 재구현, OQ-18).
// FR-26: 내 게임이 정해져 있으면 그 게임만 보여 주고, '모든 게임 보기'로 펼칠 수 있다.
// ADR-016: 출현 장소 데이터가 없는 게임(scope.json hasEncounters: false)은 '만날 수 없음'이 아니라 데이터 없음으로 안내한다 (QA D-014-02).
const NO_DATA_MESSAGE = '이 게임의 출현 장소 데이터가 없습니다.'
export function EncountersSection({ pokemonId }: Props) {
  const query = useEncounters(pokemonId)
  const myGame = useMyGame()
  const [showAll, setShowAll] = useState(false)
  const noDataGame = myGame?.hasEncounters === false

  let body
  if (query.isPending) body = <SectionState status="loading" message="출현 정보를 불러오는 중입니다." />
  else if (query.isError && !(query.error instanceof ApiError && query.error.kind === 'not_found'))
    body = (
      <SectionState status="error" message="출현 정보를 불러오지 못했습니다." onRetry={() => void query.refetch()} />
    )
  else if (!query.data || query.data.length === 0)
    body = <SectionState status="empty" message={noDataGame ? NO_DATA_MESSAGE : '지원하는 게임에서 야생 출현 정보가 없습니다.'} />
  else {
    const filtering = myGame !== null && !showAll
    const entries = filterEncountersByGame(query.data, filtering ? myGame.version : null)
    body = (
      <>
        {myGame && (
          <div className="encounters__game">
            <p>{showAll ? '모든 게임의 출현 장소입니다.' : `내 게임 ${myGame.label} 기준입니다.`}</p>
            <button type="button" onClick={() => setShowAll((v) => !v)}>
              {showAll ? `${myGame.label}만 보기` : '모든 게임 보기'}
            </button>
          </div>
        )}
        {entries.length > 0 ? (
          <div className="encounters">
            {entries.map((entry) => (
              <VersionEncounterCard key={entry.version} entry={entry} />
            ))}
          </div>
        ) : (
          <SectionState
            status="empty"
            message={noDataGame ? NO_DATA_MESSAGE : `${myGame?.label ?? ''}에서는 야생에서 만날 수 없습니다.`}
          />
        )}
      </>
    )
  }

  return (
    <section className="detail-section" aria-labelledby="detail-encounters-title">
      <h2 id="detail-encounters-title">출현 정보</h2>
      {body}
    </section>
  )
}

/**
 * 게임 하나의 출현 장소 카드. 장소가 많으면 스크롤이 길어지므로 기본은 접어 두고
 * 게임 이름 옆 버튼으로 카드마다 따로 열고 닫는다. 접혀 있을 때도 장소 수는 보여 준다.
 */
function VersionEncounterCard({ entry }: { entry: VersionEncounters }) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  return (
    <section
      className={`encounters__version${open ? ' encounters__version--open' : ''}`}
      aria-label={`${entry.label} 출현 장소`}
    >
      <div className="encounters__version-header">
        <h3>
          {entry.label}
          <span className="encounters__generation">{GENERATION_NAMES[entry.generation]}</span>
          <span className="encounters__count">{entry.locations.length}곳</span>
        </h3>
        <button
          type="button"
          className="encounters__toggle"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={`${entry.label} 출현 정보 ${open ? '닫기' : '열기'}`}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '닫기' : '열기'}
        </button>
      </div>
      <ul id={listId} hidden={!open}>
        {entry.locations.map((location) => (
          <li key={location.location}>
            <span className="encounters__place">
              <span>{location.label}</span>
              <span className="encounters__methods">{location.methods.join(' · ')}</span>
            </span>
            <span className="encounters__level">
              Lv.{location.minLevel}
              {location.maxLevel !== location.minLevel && `~${location.maxLevel}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
