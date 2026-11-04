import { POKEMON_TYPES } from '@/shared/models'
import type { PokemonType } from '@/shared/models'
import { generationNumber, histories, isPokemonType, object } from './tools'

export type TypeDefense = { type: PokemonType; immune: PokemonType[]; resistant: PokemonType[]; weak: PokemonType[] }

function relationTypes(value: unknown): PokemonType[] {
  if (!Array.isArray(value)) throw new Error('타입 상성 형식이 올바르지 않습니다.')
  const names = value.map((entry) => object(entry)?.name)
  if (!names.every(isPokemonType) || new Set(names).size !== names.length) throw new Error('지원하지 않는 상성 타입입니다.')
  return names
}

export function normalizeTypeDefense(raw: unknown, type: PokemonType): TypeDefense {
  const data = object(raw)
  if (!data || data.name !== type || generationNumber(data.generation) > 6) throw new Error('요청한 타입과 응답이 일치하지 않습니다.')
  const past = histories(data.past_damage_relations)[0]
  const relations = object(past ? past.data.damage_relations : data.damage_relations)
  const result = {
    type,
    immune: relationTypes(relations?.no_damage_from),
    resistant: relationTypes(relations?.half_damage_from),
    weak: relationTypes(relations?.double_damage_from),
  }
  const all = [...result.immune, ...result.resistant, ...result.weak]
  if (new Set(all).size !== all.length) throw new Error('서로 충돌하는 상성 정보입니다.')
  return result
}

export function defensiveMatchups(types: readonly PokemonType[], relations: readonly TypeDefense[]) {
  if (types.length < 1 || types.length > 2 || new Set(types).size !== types.length) throw new Error('타입을 확인할 수 없습니다.')
  const selected = types.map((type) => {
    const relation = relations.find((entry) => entry.type === type)
    if (!relation) throw new Error('상성 정보가 일부 누락되었습니다.')
    return relation
  })
  return POKEMON_TYPES.map((attack) => ({
    type: attack,
    multiplier: selected.reduce((value, relation) => value * (relation.immune.includes(attack) ? 0
      : relation.weak.includes(attack) ? 2 : relation.resistant.includes(attack) ? 0.5 : 1), 1),
  }))
}
