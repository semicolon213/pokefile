import { useQueries, useQuery } from '@tanstack/react-query'
import type { FormKey, PokemonId } from '@/shared/models'
import {
  fetchAbility,
  fetchEncounters,
  fetchEvolutionChain,
  fetchPokedexIndex,
  fetchPokemon,
  fetchPokemonForm,
  fetchSpecies,
} from '../api/pokeapi'
import { pokemonDetailQueryKeys } from '../api/queryKeys'
import { abilityNameKo, formNameKo, toFormDetail, toSpeciesDetail } from '../model/detail'
import { toVersionEncounters } from '../model/encounters'
import { toEvolutionTree } from '../model/evolution'
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
export function usePokemonForm(id: PokemonId, formKey: FormKey | null, speciesName: string | undefined) {
  const resource = formKey === 'default' ? id : formKey && speciesName ? pokemonResourceName(speciesName, formKey) : null
  return useQuery({
    queryKey: pokemonDetailQueryKeys.pokemon(id, formKey ?? 'default'),
    queryFn: () => fetchPokemon(resource!),
    select: toFormDetail,
    enabled: resource !== null,
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

/** 특성 한국어 이름. 실패한 특성은 API 식별자를 그대로 보여준다 */
export function useAbilityNames(names: readonly string[]) {
  return useQueries({
    queries: names.map((name) => ({
      queryKey: pokemonDetailQueryKeys.ability(name),
      queryFn: () => fetchAbility(name),
      select: abilityNameKo,
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
