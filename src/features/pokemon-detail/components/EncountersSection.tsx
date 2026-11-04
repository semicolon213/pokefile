import { ApiError } from '@/shared/api'
import type { PokemonId } from '@/shared/models'
import { useEncounters } from '../hooks/useDetailQueries'
import { GENERATION_NAMES } from '../model/encounters'
import { SectionState } from './SectionState'

type Props = { pokemonId: PokemonId }

// FR-16 세대·게임별 출현 장소 (6세대 이하 버전만, ADR-008). FR-18·DR-05: 데이터 없음과 요청 실패를 구분한다.
export function EncountersSection({ pokemonId }: Props) {
  const query = useEncounters(pokemonId)

  let body
  if (query.isPending) body = <SectionState status="loading" message="출현 정보를 불러오는 중입니다." />
  else if (query.isError && !(query.error instanceof ApiError && query.error.kind === 'not_found'))
    body = (
      <SectionState status="error" message="출현 정보를 불러오지 못했습니다." onRetry={() => void query.refetch()} />
    )
  else if (!query.data || query.data.length === 0)
    body = <SectionState status="empty" message="6세대 이하 게임에서 야생 출현 정보가 없습니다." />
  else
    body = (
      <div className="encounters">
        {query.data.map((entry) => (
          <section key={entry.version} className="encounters__version" aria-label={`${entry.label} 출현 장소`}>
            <h3>
              {entry.label}
              <span className="encounters__generation">{GENERATION_NAMES[entry.generation]}</span>
            </h3>
            <ul>
              {entry.locations.map((location) => (
                <li key={location.area}>
                  <span>{location.label}</span>
                  <span className="encounters__level">
                    Lv.{location.minLevel}
                    {location.maxLevel !== location.minLevel && `~${location.maxLevel}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    )

  return (
    <section className="detail-section" aria-labelledby="detail-encounters-title">
      <h2 id="detail-encounters-title">출현 정보</h2>
      {body}
    </section>
  )
}
