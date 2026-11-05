import { isPokemonId } from '@/shared/models'
import type { PokemonId } from '@/shared/models'
import { formatDexNumber } from '@/shared/utils'
import { useCollection } from './useCollection'
import './CollectionChecklist.css'

/** FR-29: 다른 화면은 favorites 공개 API에서 가져오며 연결부는 해당 화면 담당자가 확인한다. */
export function CollectionToggle({ pokemonId, name = '' }: { pokemonId: PokemonId; name?: string }) {
  const collection = useCollection()
  const unknown = collection.knowledge === 'unknown'
  const label = unknown ? '포획 여부 확인 불가' : '포획 완료'
  return <label className="collection-toggle">
    <input type="checkbox" checked={!unknown && collection.ids.includes(pokemonId)}
      ref={(element) => { if (element) element.indeterminate = unknown }}
      aria-checked={unknown ? 'mixed' : undefined}
      disabled={unknown || collection.status === 'unavailable' || !isPokemonId(pokemonId)}
      aria-label={`${formatDexNumber(pokemonId)} ${name} ${label}`.replace(/\s+/g, ' ')}
      aria-description={collection.message}
      onChange={() => collection.toggle(pokemonId)} />
    <span>{unknown ? '확인 불가' : '포획 완료'}</span>
  </label>
}
