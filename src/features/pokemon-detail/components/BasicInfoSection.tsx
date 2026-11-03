import { useAbilityNames } from '../hooks/useDetailQueries'
import type { PokemonFormDetail, SpeciesDetail } from '../model/detail'
import { TYPE_LABELS } from '../model/labels'
import { PokemonImage } from './PokemonImage'

type Props = {
  form: PokemonFormDetail
  species: SpeciesDetail | undefined
  /** 이미지 대체 텍스트·표시용 이름 (메가는 메가 폼 이름) */
  name: string
}

const formatNumber = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })

// FR-11~13: 일러스트, 분류·타입·특성, 도감 설명. 값이 없으면 '정보 없음'(DR-06).
export function BasicInfoSection({ form, species, name }: Props) {
  const abilityQueries = useAbilityNames(form.abilities.map((a) => a.name))

  return (
    <section className="detail-section detail-basic" aria-labelledby="detail-basic-title">
      <h2 id="detail-basic-title" className="detail-visually-hidden">
        기본 정보
      </h2>
      <div className="detail-basic__image">
        <PokemonImage urls={form.imageUrls} alt={name} />
      </div>
      <dl className="detail-basic__facts">
        <div>
          <dt>분류</dt>
          <dd>{species?.genus ?? '정보 없음'}</dd>
        </div>
        <div>
          <dt>타입</dt>
          <dd className="detail-basic__types">
            {form.types.map((type) => (
              <span key={type} className={`detail-type-chip detail-type-chip--${type}`}>
                {TYPE_LABELS[type]}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt>특성</dt>
          <dd>
            <ul className="detail-basic__abilities">
              {form.abilities.map((ability, i) => (
                <li key={ability.name}>
                  {abilityQueries[i]?.data ?? ability.name}
                  {ability.hidden && <span className="detail-basic__hidden"> (숨겨진 특성)</span>}
                </li>
              ))}
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
