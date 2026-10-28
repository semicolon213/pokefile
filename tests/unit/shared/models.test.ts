import { describe, expect, it } from 'vitest'
import { MAX_POKEMON_ID, isPokemonId, parseFormKey, parsePokemonId } from '@/shared/models'

describe('PokemonId', () => {
  it('지원 범위는 #1~#721이다', () => {
    expect(MAX_POKEMON_ID).toBe(721)
    expect(isPokemonId(1)).toBe(true)
    expect(isPokemonId(721)).toBe(true)
    expect(isPokemonId(0)).toBe(false)
    expect(isPokemonId(722)).toBe(false)
    expect(isPokemonId(25.5)).toBe(false)
    expect(isPokemonId('25')).toBe(false)
  })

  it('문자열 파라미터를 변환하고 범위 밖·형식 오류는 null을 반환한다', () => {
    expect(parsePokemonId('25')).toBe(25)
    expect(parsePokemonId('0025')).toBe(25)
    expect(parsePokemonId('722')).toBeNull()
    expect(parsePokemonId('-1')).toBeNull()
    expect(parsePokemonId('pikachu')).toBeNull()
    expect(parsePokemonId('')).toBeNull()
    expect(parsePokemonId(null)).toBeNull()
  })
})

describe('parseFormKey', () => {
  it('메가 폼 키를 인식한다', () => {
    expect(parseFormKey('mega')).toBe('mega')
    expect(parseFormKey('mega-x')).toBe('mega-x')
    expect(parseFormKey('mega-y')).toBe('mega-y')
  })

  it('없거나 잘못된 값은 default로 처리한다 (ADR-011)', () => {
    expect(parseFormKey(null)).toBe('default')
    expect(parseFormKey(undefined)).toBe('default')
    expect(parseFormKey('primal')).toBe('default')
    expect(parseFormKey('MEGA-X')).toBe('default')
  })
})
