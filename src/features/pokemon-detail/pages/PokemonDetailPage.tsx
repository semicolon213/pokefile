import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { SmogonSetsSection } from '@/features/battle-tools'
import { FavoriteToggle } from '@/features/favorites'
import { TypeMatchups } from '@/features/type-chart'
import { parseFormKey, parsePokemonId } from '@/shared/models'
import type { FormKey, PokemonId, PokemonSummary } from '@/shared/models'
import { ArrowLeftIcon, ErrorState, useDocumentTitle } from '@/shared/ui'
import { displayName, formFullName, formatDexNumber } from '@/shared/utils'
import { BasicInfoSection } from '../components/BasicInfoSection'
import { EncountersSection } from '../components/EncountersSection'
import { EvolutionSection } from '../components/EvolutionSection'
import { FormTabs } from '../components/FormTabs'
import { SectionState } from '../components/SectionState'
import { StatChart } from '../components/StatChart'
import { usePokedexIndex, usePokemonForm, useSpecies } from '../hooks/useDetailQueries'
import { availableForms, resolveFormKey, type FormOption } from '../model/forms'
import './PokemonDetailPage.css'

// UI-02 포켓몬 상세 — TASK-005(기본 정보·종족값·메가 폼 탭), TASK-006(진화·출현 장소)
export function PokemonDetailPage() {
  const { id } = useParams()
  const pokemonId = parsePokemonId(id)

  if (pokemonId === null) {
    return (
      <div className="detail-page">
        <ErrorState message="올바르지 않은 포켓몬 번호입니다." />
        <Link to="/">도감 목록으로</Link>
      </div>
    )
  }
  // 다른 포켓몬으로 이동하면 페이지 상태를 새로 시작한다
  return <PokemonDetail key={pokemonId} pokemonId={pokemonId} />
}

function PokemonDetail({ pokemonId }: { pokemonId: PokemonId }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const indexQuery = usePokedexIndex()
  const speciesQuery = useSpecies(pokemonId)

  const indexById = useMemo(
    () => new Map<PokemonId, PokemonSummary>((indexQuery.data ?? []).map((p) => [p.id, p])),
    [indexQuery.data],
  )
  const summary = indexById.get(pokemonId)

  // 폼 목록·폼 이름은 정적 인덱스의 forms로 정한다(ADR-016). 인덱스 실패 시 기본 폼만 제공한다.
  const forms: FormOption[] | null = indexQuery.isSuccess
    ? availableForms(summary?.forms ?? [])
    : indexQuery.isError
      ? availableForms([])
      : null
  const formParam = searchParams.get('form')
  const formKey: FormKey | null =
    parseFormKey(formParam) === 'default' ? 'default' : forms ? resolveFormKey(formParam, forms) : null

  const formQuery = usePokemonForm(pokemonId, formKey, speciesQuery.data?.name)
  const isAltForm = formKey !== null && formKey !== 'default'
  const formInfo = isAltForm ? summary?.forms.find((form) => form.key === formKey) : undefined

  const species = speciesQuery.data
  const baseName = species ? displayName(species) : summary ? displayName(summary) : `포켓몬 #${pokemonId}`
  const formName = formInfo ? formFullName(baseName, formInfo) : baseName
  useDocumentTitle(baseName)

  const selectForm = (form: FormKey) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (form === 'default') next.delete('form')
        else next.set('form', form)
        return next
      },
      { replace: true },
    )
  }

  // 상세 기본 데이터(종·폼)가 모두 실패하면 상세 오류 화면과 재시도·목록 이동을 제공한다 (DESIGN.md §10)
  // (메가 폼은 종 이름이 있어야 요청할 수 있으므로 종 실패 시 대기 상태(idle)로 남는다)
  const formBlocked = formQuery.isError || (formQuery.isPending && formQuery.fetchStatus === 'idle')
  if (speciesQuery.isError && formBlocked) {
    return (
      <div className="detail-page">
        <h1>{`포켓몬 #${pokemonId}`}</h1>
        <SectionState
          status="error"
          message="포켓몬 정보를 불러오지 못했습니다."
          onRetry={() => {
            void speciesQuery.refetch()
            void formQuery.refetch()
          }}
        />
        <Link to="/">도감 목록으로</Link>
      </div>
    )
  }

  return (
    <article className="detail-page" aria-labelledby="detail-title">
      <Link to="/" className="detail-back">
        <ArrowLeftIcon size={18} />
        도감 목록으로
      </Link>
      <header className="detail-header">
        <div className="detail-header__title">
          <span className="detail-header__number">{formatDexNumber(pokemonId)}</span>
          <h1 id="detail-title">{baseName}</h1>
          {species && species.nameKo && species.nameEn !== species.nameKo && (
            <span className="detail-header__en" lang="en">
              {species.nameEn}
            </span>
          )}
        </div>
        <FavoriteToggle pokemonId={pokemonId} />
      </header>

      {forms && formKey && <FormTabs forms={forms} selected={formKey} onSelect={selectForm} />}
      {isAltForm && <p className="detail-form-name">{formName}</p>}

      {formQuery.isError ? (
        <SectionState
          status="error"
          message="기본 정보를 불러오지 못했습니다."
          onRetry={() => void formQuery.refetch()}
        />
      ) : !formQuery.data ? (
        <SectionState status="loading" message="포켓몬 정보를 불러오는 중입니다." />
      ) : (
        <>
          <BasicInfoSection form={formQuery.data} species={species} name={formName} />
          <section className="detail-section detail-stats-section" aria-labelledby="detail-stats-title">
            <h2 id="detail-stats-title">종족값</h2>
            {formQuery.data.stats.length > 0 ? (
              <StatChart stats={formQuery.data.stats} />
            ) : (
              <SectionState status="empty" />
            )}
          </section>
          {/* TASK-021: 선택한 폼의 타입 기준 받는 피해 (type-chart 공개 컴포넌트) */}
          <TypeMatchups types={formQuery.data.types} />
        </>
      )}

      <EvolutionSection
        currentId={pokemonId}
        species={{
          status: speciesQuery.status,
          chainId: species?.evolutionChainId,
          retry: () => void speciesQuery.refetch(),
        }}
        index={indexById}
      />

      <EncountersSection pokemonId={pokemonId} />
      {/* TASK-007 / CR-007-INTEGRATION: 상세에서 확정한 종 이름·유효 폼과 조회 상태를 전달한다. */}
      <SmogonSetsSection
        pokemonId={pokemonId}
        identity={speciesQuery.isError
          ? { status: 'error', message: '포켓몬 정보를 불러오지 못했습니다.' }
          : species && formKey
            ? { status: 'success', data: { speciesName: species.name, formKey } }
            : { status: 'loading' }}
        onRetryIdentity={() => void speciesQuery.refetch()}
      />
    </article>
  )
}
