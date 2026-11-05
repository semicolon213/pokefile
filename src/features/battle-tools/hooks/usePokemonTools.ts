import { useQuery } from '@tanstack/react-query'
import { fetchPokemonTools } from '../api/tools'
import type { PokemonSelection } from '../model/tools'

export function usePokemonTools(selection: PokemonSelection | null) {
  return useQuery({
    queryKey: ['battle-tools', 'media', selection?.id, selection?.formKey,
      selection?.formKey === 'default' ? null : selection?.speciesName.toLowerCase()],
    queryFn: ({ signal }) => {
      if (!selection) throw new Error('포켓몬을 선택하세요.')
      return fetchPokemonTools(selection, signal)
    },
    enabled: selection !== null,
  })
}
