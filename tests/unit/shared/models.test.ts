import { describe, expect, it } from 'vitest'
import { MAX_POKEMON_ID, isPokemonId, parseFormKey, parsePokemonId } from '@/shared/models'

describe('PokemonId', () => {
  it('지원 범위는 #1~#1025이다 (ADR-016)', () => {
    expect(MAX_POKEMON_ID).toBe(1025)
    expect(isPokemonId(1)).toBe(true)
    expect(isPokemonId(1025)).toBe(true)
    expect(isPokemonId(0)).toBe(false)
    expect(isPokemonId(1026)).toBe(false)
    expect(isPokemonId(25.5)).toBe(false)
    expect(isPokemonId('25')).toBe(false)
  })

  it('문자열 파라미터를 변환하고 범위 밖·형식 오류는 null을 반환한다', () => {
    expect(parsePokemonId('25')).toBe(25)
    expect(parsePokemonId('0025')).toBe(25)
    expect(parsePokemonId('1026')).toBeNull()
    expect(parsePokemonId('-1')).toBeNull()
    expect(parsePokemonId('pikachu')).toBeNull()
    expect(parsePokemonId('')).toBeNull()
    expect(parsePokemonId(null)).toBeNull()
  })
})

describe('parseFormKey', () => {
  it('폼 키 형식(소문자·숫자·하이픈)을 인식한다 (ADR-016)', () => {
    expect(parseFormKey('mega')).toBe('mega')
    expect(parseFormKey('mega-x')).toBe('mega-x')
    expect(parseFormKey('gmax')).toBe('gmax')
    expect(parseFormKey('paldea-combat-breed')).toBe('paldea-combat-breed')
    expect(parseFormKey('10-power-construct')).toBe('10-power-construct')
  })

  it('없거나 잘못된 값은 default로 처리한다 (ADR-011)', () => {
    expect(parseFormKey(null)).toBe('default')
    expect(parseFormKey(undefined)).toBe('default')
    expect(parseFormKey('')).toBe('default')
    expect(parseFormKey('MEGA-X')).toBe('default')
    expect(parseFormKey('mega x')).toBe('default')
    expect(parseFormKey('-mega')).toBe('default')
    expect(parseFormKey('../mega')).toBe('default')
  })
})
