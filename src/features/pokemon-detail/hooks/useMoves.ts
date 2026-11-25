import { useQuery } from '@tanstack/react-query'
import type { FormKey, PokemonForm, PokemonId } from '@/shared/models'
import type { RawPokemon } from '../api/pokeapi'
import { pokemonDetailQueryKeys } from '../api/queryKeys'
import { toLearnset } from '../model/moves'
import type { MoveData, RawPokemonMoves } from '../model/moves'
import { usePokemonFormQueryOptions } from './useDetailQueries'

/**
 * 선택한 폼의 기술 기록 (FR-27). 기본 정보(usePokemonForm)와 같은 쿼리 키를 써서 /pokemon 응답을 한 번만 받는다.
 * 폼마다 기술 목록이 따로 있으므로(예: 메가리자몽X는 메가진화가 있는 게임만) 폼을 바꾸면 그 폼의 기록을 쓴다.
 */
export function usePokemonMoves(id: PokemonId, formKey: FormKey | null, speciesName: string | undefined, formResource?: PokemonForm['resource']) {
  return useQuery({
    ...usePokemonFormQueryOptions(id, formKey, speciesName, formResource),
    select: selectLearnset,
  })
}

// fetchPokemon의 응답 타입(RawPokemon)은 moves를 선언하지 않으므로 여기서 moves를 더해 읽는다
const selectLearnset = (raw: RawPokemon) => toLearnset(raw as RawPokemon & RawPokemonMoves)

/** 정적 기술 데이터(약 90KB)는 기술 표를 처음 볼 때만 따로 받는다(별도 청크). 배포 단위로만 바뀐다 */
export function useMoveData() {
  return useQuery({
    queryKey: pokemonDetailQueryKeys.moveData(),
    queryFn: async () => (await import('../data/moves.json')).default as unknown as MoveData,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
