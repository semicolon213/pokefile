import { useId, useState } from 'react'
import { useSearchIndex } from '@/features/pokedex'
import type { PokemonId } from '@/shared/models'
import { ErrorState, LoadingState } from '@/shared/ui'
import { displayName, formLabel, formatDexNumber } from '@/shared/utils'
import { usePokemonTools } from '../hooks/usePokemonTools'
import { FORM_LABELS } from '../model/tools'
import type { PokemonSelection } from '../model/tools'
import { PokemonMedia } from './PokemonMedia'
import './PokemonToolsSection.css'

export type PokemonMediaSectionProps = { pokemonId: PokemonId } & Omit<PokemonSelection, 'id'>

export function PokemonToolsSection({ pokemonId, speciesName, formKey }: PokemonMediaSectionProps) {
  const [open, setOpen] = useState(false)
  const contentId = useId()
  const selection = { id: pokemonId, speciesName, formKey }
  return (
    <section className="detail-section pokemon-tools" aria-label="울음소리">
      <div className="pokemon-tools__header">
        <h2>울음소리</h2>
        <button type="button" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen((value) => !value)}>
          {open ? '울음소리 접기' : '울음소리 열기'}
        </button>
      </div>
      <div id={contentId} hidden={!open}>
        {open && <PokemonToolsData key={`${pokemonId}:${speciesName}:${formKey}`} selection={selection} />}
      </div>
    </section>
  )
}

function PokemonToolsData({ selection }: { selection: PokemonSelection }) {
  const query = usePokemonTools(selection)
  const index = useSearchIndex()
  const summary = index.data?.find((entry) => entry.id === selection.id)
  const selectedForm = summary?.forms.find((form) => form.key === selection.formKey)
  const label = FORM_LABELS[selection.formKey] ?? (selectedForm ? formLabel(selectedForm) : selection.formKey)
  const name = `${summary ? displayName(summary) : `${formatDexNumber(selection.id)} ${selection.speciesName}`} · ${label}`
  if (query.isPending) return <LoadingState message="울음소리 정보를 불러오는 중입니다." />
  if (query.isError) return <div>
    <ErrorState message="울음소리 정보를 불러오지 못했습니다." />
    <button type="button" onClick={() => void query.refetch()}>울음소리 정보 다시 시도</button>
  </div>
  return (
    <div className="pokemon-tools__content">
      <p className="pokemon-tools__identity">{name}</p>
      <PokemonMedia data={query.data} name={name} />
    </div>
  )
}
