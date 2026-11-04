import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { FavoriteToggle } from '@/features/favorites'
import { favoritesStore } from '@/features/favorites/model/store'
import { FAVORITES_STORAGE_KEY } from '@/features/favorites/model/storage'

beforeEach(() => { localStorage.clear(); favoritesStore.refresh() })
afterEach(() => vi.restoreAllMocks())

describe('즐겨찾기 버튼 연결 (TC-07)', () => {
  it('같은 종의 여러 버튼을 동시에 갱신하고 메가 폼도 종 ID로만 저장한다', () => {
    render(<><FavoriteToggle pokemonId={6} /><FavoriteToggle pokemonId={6} /></>)
    const buttons = screen.getAllByRole('button', { name: '#0006 즐겨찾기 추가' })
    fireEvent.click(buttons[0])
    expect(screen.getAllByRole('button', { name: '#0006 즐겨찾기 해제' })).toHaveLength(2)
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)!)).toEqual({ version: 1, ids: [6] })
    fireEvent.click(buttons[1])
    expect(screen.getAllByRole('button', { name: '#0006 즐겨찾기 추가' })).toHaveLength(2)
  })

  it('다른 탭의 변경·전체 삭제 이벤트를 반영한다', async () => {
    render(<FavoriteToggle pokemonId={25} />)
    localStorage.setItem(FAVORITES_STORAGE_KEY, '{"version":1,"ids":[25]}')
    window.dispatchEvent(new StorageEvent('storage', { key: FAVORITES_STORAGE_KEY, storageArea: localStorage }))
    await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true'))
    localStorage.clear()
    window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }))
    await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false'))
  })

  it('저장 실패 시 버튼을 비활성화하고 기존 저장 여부를 유지한다', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, '{"version":1,"ids":[25]}')
    render(<FavoriteToggle pokemonId={25} />)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('저장 불가')
  })
})
