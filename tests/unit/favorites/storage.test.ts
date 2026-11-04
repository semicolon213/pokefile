import { describe, expect, it } from 'vitest'
import { decodeFavorites, encodeFavorites } from '@/features/favorites/model/storage'

describe('즐겨찾기 저장 스키마 (ADR-012 / TC-07)', () => {
  it('지원 ID만 중복 없이 추가 순서대로 읽는다', () => {
    const result = decodeFavorites(JSON.stringify({ version: 1, ids: [133, 25, 133, 1, 1025, 0, 1026, 25.5, '6', null] }))
    expect(result.ids).toEqual([133, 25, 1, 1025])
    expect(result.status).toBe('recovered')
    expect(result.message).toBeTruthy()
  })

  it('고정된 version·ids 스키마로 직렬화한다', () => {
    expect(encodeFavorites([25, 133, 25])).toBe('{"version":1,"ids":[25,133]}')
    expect(decodeFavorites(encodeFavorites([25, 133])).ids).toEqual([25, 133])
  })

  it.each(['broken', 'null', '[]', '{"version":2,"ids":[25]}', '{"version":1}', '{"version":1,"ids":"25"}'])
  ('손상·버전 불일치(%s)는 빈 목록과 안내로 시작한다', (raw) => {
    expect(decodeFavorites(raw)).toMatchObject({ ids: [], status: 'recovered' })
    expect(decodeFavorites(raw).message).toBeTruthy()
  })

  it('저장 값이 없으면 정상적인 빈 목록이다', () => {
    expect(decodeFavorites(null)).toMatchObject({ ids: [], status: 'ready', message: undefined })
  })
})
