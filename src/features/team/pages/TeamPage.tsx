import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { PokemonSearchBox, useSearchIndex } from '@/features/pokedex'
import { ErrorState, TypeBadge, TYPE_LABELS, useDocumentTitle } from '@/shared/ui'
import { DefenseTable } from '../components/DefenseTable'
import { TeamSlots } from '../components/TeamSlots'
import {
  TEAM_PARAM,
  TEAM_SIZE,
  defenseRows,
  memberName,
  parseTeam,
  readStoredTeam,
  resolveTeam,
  stabCoverage,
  storeTeam,
  suggestTypes,
  writeTeam,
  type Member,
} from '../model/team'
import '../Team.css'

// FR-33 파티 타입 분석 (/team?p=6:mega-x&p=9). DESIGN §2.4.3
export function TeamPage() {
  useDocumentTitle('파티 분석')
  const [params, setParams] = useSearchParams()
  const index = useSearchIndex()
  const team = parseTeam(params.getAll(TEAM_PARAM))
  const hasParam = params.has(TEAM_PARAM)

  // 주소에 파티가 없이 들어오면 마지막 파티를 주소에 채운다 (기록은 늘리지 않음)
  useEffect(() => {
    if (hasParam) return
    const stored = readStoredTeam()
    if (stored.length > 0) setParams((prev) => writeTeam(prev, stored), { replace: true })
  }, [hasParam, setParams])

  const update = (next: Member[]) => {
    storeTeam(next)
    setParams((prev) => writeTeam(prev, next), { replace: true })
  }

  if (index.isError) {
    return (
      <div className="team-page">
        <h1>파티 분석</h1>
        <ErrorState message="포켓몬 목록을 불러오지 못했습니다." />
        <button type="button" className="button" onClick={() => void index.refetch()}>
          다시 시도
        </button>
      </div>
    )
  }
  if (!index.data) {
    return (
      <div className="team-page">
        <h1>파티 분석</h1>
        <p role="status" className="team-status">
          포켓몬 목록을 불러오는 중입니다.
        </p>
      </div>
    )
  }

  const entries = resolveTeam(team, index.data)
  const members = entries.map((e) => e.member)
  const full = entries.length >= TEAM_SIZE
  const teamTypes = entries.map((e) => e.types)
  const rows = defenseRows(teamTypes)
  const cautions = rows.filter((r) => r.caution).map((r) => r.attack)
  const suggestions = suggestTypes(cautions)
  const coverage = stabCoverage(teamTypes)

  return (
    <div className="team-page">
      <h1>파티 분석</h1>

      <section className="team-section" aria-labelledby="team-members-title">
        <div className="team-section__head">
          <h2 id="team-members-title">
            파티 <span className="team-section__count tabular">{entries.length} / {TEAM_SIZE}</span>
          </h2>
          {entries.length > 0 && (
            <button type="button" className="team-clear" onClick={() => update([])}>
              모두 비우기
            </button>
          )}
        </div>
        <PokemonSearchBox
          label="파티에 추가할 포켓몬"
          index={index.data}
          disabled={full}
          placeholder={full ? '파티가 가득 찼습니다 (6마리)' : '포켓몬 추가: 이름 또는 도감 번호'}
          onPick={(p) => update([...members, { id: p.id, form: 'default' }])}
        />
        <TeamSlots
          entries={entries}
          onChangeForm={(slot, form) => update(members.map((m, i) => (i === slot ? { ...m, form } : m)))}
          onRemove={(slot) => update(members.filter((_, i) => i !== slot))}
        />
      </section>

      {entries.length === 0 ? (
        <p className="team-empty">포켓몬을 추가하면 파티의 약점과 공격 범위를 보여 줍니다.</p>
      ) : (
        <>
          <section className="team-section" aria-labelledby="team-defense-title">
            <h2 id="team-defense-title">받는 피해</h2>
            <dl className="team-summary">
              <div className="team-summary__row">
                <dt>주의할 타입</dt>
                <dd>
                  {cautions.length > 0 ? (
                    <span className="team-summary__types">
                      {cautions.map((t) => (
                        <TypeBadge key={t} type={t} size="sm" />
                      ))}
                    </span>
                  ) : (
                    '눈에 띄는 공통 약점이 없습니다.'
                  )}
                </dd>
              </div>
              {suggestions.length > 0 && (
                <div className="team-summary__row">
                  <dt>보완 추천</dt>
                  <dd>
                    <ul className="team-suggestions">
                      {suggestions.map((s) => (
                        <li key={s.type}>
                          <TypeBadge type={s.type} size="sm" />
                          <span>{s.covers.map((t) => TYPE_LABELS[t]).join('·')} 공격을 반감 이하로 받음</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
            <p className="team-hint">주의: 약점인 포켓몬이 3마리 이상이거나, 2마리 이상인데 반감·무효로 받는 포켓몬이 없는 타입</p>
            <DefenseTable rows={rows} names={entries.map(memberName)} />
          </section>

          <section className="team-section" aria-labelledby="team-coverage-title">
            <h2 id="team-coverage-title">자속 공격 범위</h2>
            <p className="team-coverage__score">
              파티 타입의 기술로 효과가 굉장한 타입{' '}
              <strong className="tabular">
                {coverage.covered.length} / {coverage.covered.length + coverage.uncovered.length}
              </strong>
            </p>
            {coverage.uncovered.length > 0 ? (
              <div className="team-summary__row">
                <span className="team-coverage__label">닿지 않는 타입</span>
                <span className="team-summary__types">
                  {coverage.uncovered.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </span>
              </div>
            ) : (
              <p>모든 타입에 효과가 굉장한 자속 공격이 있습니다.</p>
            )}
            <p className="team-hint">포켓몬 타입만으로 계산합니다. 실제로 배운 기술·특성·테라스탈은 반영하지 않습니다.</p>
          </section>
        </>
      )}
    </div>
  )
}
