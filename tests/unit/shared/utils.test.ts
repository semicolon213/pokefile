import { describe, expect, it } from 'vitest'
import { displayName, formatDexNumber, toShowdownId } from '@/shared/utils'

describe('toShowdownId', () => {
  it('PokéAPI 이름과 Smogon 키를 같은 값으로 정규화한다 (ADR-009)', () => {
    expect(toShowdownId('mr-mime')).toBe(toShowdownId('Mr. Mime'))
    expect(toShowdownId('charizard-mega-x')).toBe(toShowdownId('Charizard-Mega-X'))
    expect(toShowdownId('ho-oh')).toBe(toShowdownId('Ho-Oh'))
    expect(toShowdownId('nidoran-f')).toBe('nidoranf')
  })
})

describe('formatDexNumber', () => {
  it('네 자리로 표시한다', () => {
    expect(formatDexNumber(1)).toBe('#0001')
    expect(formatDexNumber(25)).toBe('#0025')
    expect(formatDexNumber(721)).toBe('#0721')
  })
})

describe('displayName', () => {
  it('한국어 이름을 우선하고 없으면 영문 이름을 쓴다', () => {
    expect(displayName({ nameEn: 'pikachu', nameKo: '피카츄' })).toBe('피카츄')
    expect(displayName({ nameEn: 'pikachu' })).toBe('pikachu')
    expect(displayName({ nameEn: 'pikachu', nameKo: '' })).toBe('pikachu')
  })
})
