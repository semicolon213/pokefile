import { useState } from 'react'
import { pokemonImageUrls } from '@/features/pokedex'
import { TypeBadge, fitSprite } from '@/shared/ui'
import { displayName, formLabel, formatDexNumber } from '@/shared/utils'
import { TEAM_SIZE, memberName, type TeamEntry } from '../model/team'

type Props = {
  entries: TeamEntry[]
  onChangeForm: (slot: number, form: string) => void
  onRemove: (slot: number) => void
}

/** 파티 6칸. 빈 칸은 '빈 자리'로 남긴다 (DESIGN §2.4.3) */
export function TeamSlots({ entries, onChangeForm, onRemove }: Props) {
  return (
    <ol className="team-slots" aria-label="파티 구성">
      {Array.from({ length: TEAM_SIZE }, (_, slot) => {
        const entry = entries[slot]
        if (!entry)
          return (
            <li key={`empty-${slot}`} className="team-slot team-slot--empty">
              빈 자리
            </li>
          )
        return (
          <li key={`${slot}-${entry.member.id}`} className="team-slot">
            <Slot entry={entry} onChangeForm={(form) => onChangeForm(slot, form)} onRemove={() => onRemove(slot)} />
          </li>
        )
      })}
    </ol>
  )
}

function Slot({ entry, onChangeForm, onRemove }: { entry: TeamEntry; onChangeForm: (form: string) => void; onRemove: () => void }) {
  const { member, summary, types } = entry
  const urls = pokemonImageUrls(summary.id)
  const [imageIndex, setImageIndex] = useState(0)
  const name = memberName(entry)
  return (
    <>
      <span className="team-slot__plate">
        {urls[imageIndex] ? (
          <img
            key={urls[imageIndex]}
            src={urls[imageIndex]}
            alt=""
            onLoad={(e) => fitSprite(e.currentTarget, 72, { upscale: false })}
            onError={() => setImageIndex((i) => i + 1)}
          />
        ) : null}
      </span>
      <span className="team-slot__body">
        <span className="team-slot__number tabular">{formatDexNumber(summary.id)}</span>
        <span className="team-slot__name">{name}</span>
        <span className="team-slot__types">
          {types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </span>
      </span>
      {summary.forms.length > 0 && (
        <label className="team-slot__form">
          <span className="visually-hidden">{displayName(summary)} 폼</span>
          <select value={member.form} onChange={(e) => onChangeForm(e.target.value)}>
            <option value="default">기본 폼</option>
            {summary.forms.map((f) => (
              <option key={f.key} value={f.key}>
                {formLabel(f)}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="button" className="team-slot__remove" onClick={onRemove} aria-label={`${name} 빼기`}>
        빼기
      </button>
    </>
  )
}
