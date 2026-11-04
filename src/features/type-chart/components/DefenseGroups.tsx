import type { PokemonType } from '@/shared/models'
import { TypeBadge } from '@/shared/ui'
import { defenseGroups, formatMultiplier, type Multiplier } from '../model/matchup'

const GROUP: Record<Multiplier, { label: string; tone: 'weak' | 'resist' | 'immune' }> = {
  4: { label: '약점', tone: 'weak' },
  2: { label: '약점', tone: 'weak' },
  0.5: { label: '반감', tone: 'resist' },
  0.25: { label: '반감', tone: 'resist' },
  0: { label: '무효', tone: 'immune' },
}

/** 방어 타입 조합이 받는 피해를 배율별로 묶어 보여 준다. 1배는 생략한다. */
export function DefenseGroups({ types }: { types: readonly PokemonType[] }) {
  return (
    <>
      <dl className="defense-groups">
        {defenseGroups(types).map(({ multiplier, types: attackers }) => (
          <div key={multiplier} className={`defense-groups__row defense-groups__row--${GROUP[multiplier].tone}`}>
            <dt>
              <span className="defense-groups__label">{GROUP[multiplier].label}</span>
              <span className="defense-groups__multiplier tabular">×{formatMultiplier(multiplier)}</span>
            </dt>
            <dd>
              {attackers.map((type) => (
                <TypeBadge key={type} type={type} size="sm" />
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <p className="defense-groups__note">나머지 타입은 보통(×1)입니다. 특성·테라스탈은 반영하지 않습니다.</p>
    </>
  )
}
