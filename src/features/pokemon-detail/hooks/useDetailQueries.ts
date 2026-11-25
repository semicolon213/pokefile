import { queryOptions, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPokemonFormOverride } from '@/shared/api'
import type { FormKey, PokemonForm, PokemonId } from '@/shared/models'
import {
  fetchAbility,
  fetchEncounters,
  fetchEvolutionChain,
  fetchItem,
  fetchLocation,
  fetchMove,
  fetchPokedexIndex,
  fetchPokemon,
  fetchPokemonForm,
  fetchSpecies,
} from '../api/pokeapi'
import { pokemonDetailQueryKeys } from '../api/queryKeys'
import { formNameKo, toAbilityInfo, toFormDetail, toSpeciesDetail } from '../model/detail'
import { toVersionEncounters } from '../model/encounters'
import { collectConditionRefs, toEvolutionTree } from '../model/evolution'
import type { ConditionRefKind, EvolutionNode } from '../model/evolution'
import { EVOLUTION_LOCATION_NAMES_KO } from '../model/evolutionLocationsKo'
import { pokemonResourceName } from '../model/forms'

// 각 섹션이 독립적으로 로딩·오류 상태를 갖도록 리소스별로 쿼리를 나눈다 (DR-03, NFR-07).

/** 정적 인덱스는 배포 단위로만 바뀌므로 세션 동안 다시 요청하지 않는다 */
export function usePokedexIndex() {
  return useQuery({
    queryKey: pokemonDetailQueryKeys.pokedexIndex(),
    queryFn: fetchPokedexIndex,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useSpecies(id: PokemonId) {
  return useQuery({
    queryKey: pokemonDetailQueryKeys.species(id),
    queryFn: () => fetchSpecies(id),
    select: toSpeciesDetail,
  })
}

/**
 * 폼 단위 데이터. 메가는 species 이름이 있어야 리소스 이름을 만들 수 있다.
 * formKey가 null이면(폼 확정 전) 요청하지 않는다.
 */
export function usePokemonFormQueryOptions(id: PokemonId, formKey: FormKey | null, speciesName: string | undefined, formResource?: PokemonForm['resource']) {
  const client = useQueryClient()
  const resource = formKey === 'default' || formResource ? id : formKey && speciesName ? pokemonResourceName(speciesName, formKey) : null
  // 기본 정보·기술 표가 같은 키에서 같은 조회 함수를 사용해야 재조회 순서에 영향을 받지 않는다.
  return queryOptions({
    queryKey: pokemonDetailQueryKeys.pokemon(id, formKey ?? 'default'),
    queryFn: async ({ signal }) => {
      if (!formResource) return fetchPokemon(resource!)
      // C-01: 같은 기본 pokemon 요청을 여러 폼이 공유한다.
      const base = await client.fetchQuery({
        queryKey: pokemonDetailQueryKeys.pokemon(id, 'default'),
        queryFn: () => fetchPokemon(id),
        staleTime: Infinity,
      })
      const form = await fetchPokemonFormOverride(formResource.name, base.name, signal)
      return { ...base, name: form.name, types: form.types, sprites: form.sprites,
        forms: [{ name: form.name, url: '' }] }
    },
    enabled: resource !== null,
  })
}

export function usePokemonForm(id: PokemonId, formKey: FormKey | null, speciesName: string | undefined, formResource?: PokemonForm['resource']) {
  return useQuery({
    ...usePokemonFormQueryOptions(id, formKey, speciesName, formResource),
    select: (raw) => toFormDetail(raw, formKey === 'default' || formResource ? undefined : id),
  })
}

export function useMegaFormName(formResourceName: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: pokemonDetailQueryKeys.pokemonForm(formResourceName ?? ''),
    queryFn: () => fetchPokemonForm(formResourceName!),
    select: formNameKo,
    enabled: enabled && !!formResourceName,
  })
}

/** 특성 한국어 이름·설명. 실패한 특성은 API 식별자를 그대로 보여준다 */
export function useAbilities(names: readonly string[]) {
  return useQueries({
    queries: names.map((name) => ({
      queryKey: pokemonDetailQueryKeys.ability(name),
      queryFn: () => fetchAbility(name),
      select: toAbilityInfo,
      staleTime: Infinity,
    })),
  })
}

export function useEvolutionTree(chainId: number | null | undefined) {
  return useQuery({
    queryKey: pokemonDetailQueryKeys.evolutionChain(chainId ?? 0),
    queryFn: () => fetchEvolutionChain(chainId!),
    select: (raw) => toEvolutionTree(raw.chain),
    enabled: chainId != null,
  })
}

export function useEncounters(id: PokemonId) {
  return useQuery({
    queryKey: pokemonDetailQueryKeys.encounters(id),
    queryFn: () => fetchEncounters(id),
    select: toVersionEncounters,
  })
}

const CONDITION_FETCHERS: Record<ConditionRefKind, (name: string) => Promise<{ names: { name: string; language: { name: string } }[] }>> = {
  item: fetchItem,
  move: fetchMove,
  location: fetchLocation,
}

/**
 * 진화 조건의 도구·기술·장소 한국어 이름 (FR-28). `kind:name` → 표시 이름.
 * 장소는 번역표를 먼저 쓰고(OQ-18), 조회 중인 이름은 pending에 담는다(화면은 식별자 대신 '…'). 실패하면 화면에서 API 식별자를 보여준다.
 */
export function useConditionNames(tree: EvolutionNode | null | undefined): {
  names: ReadonlyMap<string, string>
  pending: ReadonlySet<string>
} {
  const refs = collectConditionRefs(tree).filter((ref) => !(ref.kind === 'location' && EVOLUTION_LOCATION_NAMES_KO[ref.name]))
  const queries = useQueries({
    queries: refs.map((ref) => ({
      queryKey: pokemonDetailQueryKeys.conditionName(ref.kind, ref.name),
      queryFn: () => CONDITION_FETCHERS[ref.kind](ref.name),
      select: (raw: { names: { name: string; language: { name: string } }[] }) =>
        raw.names.find((n) => n.language.name === 'ko')?.name ?? raw.names.find((n) => n.language.name === 'en')?.name,
      staleTime: Infinity,
    })),
  })
  const names = new Map<string, string>()
  const pending = new Set<string>()
  for (const ref of collectConditionRefs(tree)) {
    const ko = ref.kind === 'location' ? EVOLUTION_LOCATION_NAMES_KO[ref.name] : undefined
    if (ko) names.set(`location:${ref.name}`, ko)
  }
  refs.forEach((ref, i) => {
    const key = `${ref.kind}:${ref.name}`
    const query = queries[i]
    if (query?.data) names.set(key, query.data)
    else if (query?.isPending) pending.add(key)
  })
  return { names, pending }
}
