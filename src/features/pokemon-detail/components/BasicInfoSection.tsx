import { TypeBadge } from '@/shared/ui'
import { PokemonImageToggle } from '@/features/battle-tools'
import { useAbilities } from '../hooks/useDetailQueries'
import type { PokemonFormDetail, SpeciesDetail } from '../model/detail'

type Props = {
  form: PokemonFormDetail
  species: SpeciesDetail | undefined
  /** 이미지 대체 텍스트·표시용 이름 (메가는 메가 폼 이름) */
  name: string
}

const formatNumber = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })

// FR-11~13·30: 일러스트, 분류·타입·특성(설명 포함), 도감 설명. 값이 없으면 '정보 없음'(DR-06).
export function BasicInfoSection({ form, species, name }: Props) {
  const abilityQueries = useAbilities(form.abilities.map((a) => a.name))

  return (
    <section className="detail-section detail-basic" aria-labelledby="detail-basic-title">
      <h2 id="detail-basic-title" className="detail-visually-hidden">
        기본 정보
      </h2>
      <PokemonImageToggle key={form.resourceName} name={name} normalUrls={form.imageUrls} shinyUrls={form.shinyImageUrls} cryUrls={form.cryUrls} />
      <dl className="detail-basic__facts">
        <div>
          <dt>분류</dt>
          <dd>{species?.genus ?? '정보 없음'}</dd>
        </div>
        <div>
          <dt>타입</dt>
          <dd className="detail-basic__types">
            {form.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </dd>
        </div>
        <div className="detail-basic__ability-fact">
          <dt>특성</dt>
          <dd>
            <ul className="detail-basic__abilities">
              {form.abilities.map((ability, i) => {
                const query = abilityQueries[i]
                return (
                  <li key={ability.name}>
                    {query?.data?.name ?? ability.name}
                    {ability.hidden && <span className="detail-basic__hidden"> (숨겨진 특성)</span>}
                    {/* FR-30: 불러오는 중에는 비워 두고, 실패하거나 한국어 설명이 없으면 '정보 없음' */}
                    {query && !query.isPending && (
                      <p className="detail-basic__ability-desc">{query.data?.description ?? '정보 없음'}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </dd>
        </div>
        <div>
          <dt>키</dt>
          <dd>{formatNumber(form.heightM)} m</dd>
        </div>
        <div>
          <dt>몸무게</dt>
          <dd>{formatNumber(form.weightKg)} kg</dd>
        </div>
      </dl>
      <div className="detail-basic__flavor">
        <h3>도감 설명</h3>
        <p>{species?.flavorText ?? '등록된 정보가 없습니다.'}</p>
      </div>
    </section>
  )
}
