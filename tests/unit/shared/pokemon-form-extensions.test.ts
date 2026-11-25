import { describe, expect, it, vi } from 'vitest'
import { ADDITIONAL_INDEX, additionalFixtureForUrl } from '../../integration/shared/additional-form-fixtures'
import { fetchFormExtensions, mergeFormExtensions } from '../../../scripts/lib/pokemon-form-extensions.mjs'

describe('C-01 폼 인덱스 생성 (TASK-025 / TC-04·06)', () => {
  it('승인된 35폼만 수집하고 타입·한국어 이름·조회 리소스를 기록한다', async () => {
    const getJson = vi.fn(async (url: string) => structuredClone(additionalFixtureForUrl(url)))
    const result = await fetchFormExtensions(getJson)
    expect([...result.values()].map((forms) => forms.length)).toEqual([17, 17, 1])
    expect(result.get(493)?.find((form) => form.key === 'fire')).toMatchObject({
      nameKo: '불꽃 타입', types: ['fire'], resource: { kind: 'pokemon-form', name: 'arceus-fire' },
    })
    expect(result.get(1013)?.[0]).toMatchObject({ key: 'masterpiece', nameKo: '걸작의 모습' })
    expect(getJson.mock.calls.some(([url]) => url.includes('arceus-unknown'))).toBe(false)
  })

  it('재갱신이 중복을 만들지 않고 다른 종·추가 필드·기존 폼을 유지한다', async () => {
    const extensions = await fetchFormExtensions(async (url: string) => structuredClone(additionalFixtureForUrl(url)))
    const other = { id: 1, forms: [], stats: [1, 2, 3], marker: 'untouched' }
    const index = { version: 2, generatedAt: 'old', count: 4, pokemon: [other,
      ...ADDITIONAL_INDEX.map((pokemon) => ({ ...pokemon, forms: [], marker: 'keep' }))], regionalDexes: { keep: true } }
    const before = JSON.stringify(index)
    const result = mergeFormExtensions(index, extensions, '2026-11-25')
    expect(result.pokemon[0]).toBe(other)
    expect(result.regionalDexes).toEqual({ keep: true })
    expect(result.pokemon[1]).toMatchObject({ marker: 'keep' })
    expect(result.pokemon.flatMap((pokemon) => pokemon.forms)).toHaveLength(35)
    expect(mergeFormExtensions(result, extensions, '2026-11-25')).toEqual(result)
    expect(JSON.stringify(index)).toBe(before)
  })

  it('기본 종과 다른 pokemon-form 응답을 인덱스에 섞지 않는다', async () => {
    await expect(fetchFormExtensions(async (url: string) => {
      const data = structuredClone(additionalFixtureForUrl(url)) as Record<string, unknown>
      return url.includes('/pokemon-form/arceus-fire/') ? { ...data, pokemon: { name: 'silvally' } } : data
    })).rejects.toThrow('C-01 폼 계약 불일치')
  })
})
