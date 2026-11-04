import { describe, expect, it } from 'vitest'
import { parseSelection, statTotal, winner, writeSelection } from '@/features/compare/model/compare'
import { comparePath } from '@/shared/utils'

describe('포켓몬 비교 모델 (FR-25)', () => {
  it('URL에서 A·B와 폼을 읽고, 기본 폼은 쓰지 않는다', () => {
    const params = new URLSearchParams('a=6&af=mega-x&b=9')
    expect(parseSelection(params, 'a')).toEqual({ id: 6, form: 'mega-x' })
    expect(parseSelection(params, 'b')).toEqual({ id: 9, form: 'default' })
    expect(parseSelection(new URLSearchParams('a=9999'), 'a')).toBeNull()
    expect(writeSelection(params, 'b', { id: 25, form: 'default' }).toString()).toBe('a=6&af=mega-x&b=25')
    expect(writeSelection(params, 'a', null).toString()).toBe('b=9')
  })

  it('합계와 더 높은 쪽', () => {
    expect(statTotal({ hp: 78, attack: 84, defense: 78, 'special-attack': 109, 'special-defense': 85, speed: 100 })).toBe(534)
    expect([winner(10, 5), winner(5, 10), winner(7, 7)]).toEqual(['a', 'b', 'tie'])
  })

  it('비교 화면 경로', () => {
    expect(comparePath()).toBe('/compare')
    expect(comparePath({ id: 6 })).toBe('/compare?a=6')
    expect(comparePath({ id: 6, form: 'mega-x' })).toBe('/compare?a=6&af=mega-x')
  })
})
