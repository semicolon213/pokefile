import { useQueries, useQuery } from '@tanstack/react-query'
import type { PokemonType } from '@/shared/models'
import { fetchPokemonTools, fetchTypeDefense } from '../api/tools'
import type { PokemonSelection } from '../model/tools'

export function usePokemonTools(selection: PokemonSelection | null) {
  return useQuery({
    queryKey: ['battle-tools', 'pokemon', 'gen6', selection?.id, selection?.formKey,
      selection?.formKey === 'default' ? null : selection?.speciesName.toLowerCase()],
    queryFn: ({ signal }) => {
      if (!selection) throw new Error('포켓몬을 선택하세요.')
      return fetchPokemonTools(selection, signal)
    },
    enabled: selection !== null,
  })
}

export function useTypeDefenses(types: readonly PokemonType[]) {
  return useQueries({ queries: types.map((type) => ({
    queryKey: ['battle-tools', 'type', 'gen6', type],
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchTypeDefense(type, signal),
  })) })
}
