import { useQuery } from '@tanstack/react-query'
import type { PokemonSummary } from '@/shared/models'
import { fetchCompareFormStats, fetchCompareStats } from '../api/pokemon'
import type { Selection } from '../model/compare'

/**
 * 고른 포켓몬(폼)의 종족값. 폼 리소스 이름은 '{species 이름}-{폼 키}'라(ADR-016) 기본 폼을 먼저 받아 species 이름을 얻는다.
 */
export function useCompareStats(selection: Selection | null, summary?: PokemonSummary) {
  const base = useQuery({
    queryKey: ['compare', 'pokemon', selection?.id ?? 0, 'default'],
    queryFn: () => fetchCompareStats(selection!.id),
    enabled: selection !== null,
    staleTime: Infinity,
  })
  const form = selection && selection.form !== 'default' ? selection.form : null
  const resource = summary?.forms.find((entry) => entry.key === form)?.resource
  const alt = useQuery({
    queryKey: ['compare', 'pokemon', selection?.id ?? 0, form],
    queryFn: () => resource
      ? fetchCompareFormStats(base.data!, resource.name)
      : fetchCompareStats(`${base.data!.speciesName}-${form}`),
    enabled: form !== null && !!base.data,
    staleTime: Infinity,
  })
  return form ? { ...alt, isError: base.isError || alt.isError, refetch: base.isError ? base.refetch : alt.refetch } : base
}
