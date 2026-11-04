import { useSyncExternalStore } from 'react'
import { SCOPE, type GameVersionInfo } from '@/shared/config/scope'

/**
 * 내 게임 선택 (FR-26, TASK-014). 플레이 중인 게임 버전을 브라우저에 저장하고 여러 화면이 함께 읽는다.
 * 출현 장소(상세)·기술 표(TASK-015)가 이 값을 기준으로 표시한다. URL 쿼리 `game`과의 동기화는 앱 셸이 맡는다.
 */
export const MY_GAME_STORAGE_KEY = 'pokefile:my-game'
export const MY_GAME_PARAM = 'game'

/** 지원 범위(scope.json)의 게임 버전만 인정한다. 없거나 잘못된 값은 null */
export function findGameVersion(version: string | null | undefined): GameVersionInfo | null {
  return SCOPE.gameVersions.find((g) => g.version === version) ?? null
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

function readStored(): string | null {
  try {
    return findGameVersion(localStorage.getItem(MY_GAME_STORAGE_KEY))?.version ?? null
  } catch {
    // 저장소 접근이 막혀도 앱은 '전체 게임'으로 계속 동작한다
    return null
  }
}

// 저장소가 막힌 환경에서도 이번 세션 안에서는 선택이 유지되도록 메모리 값을 함께 둔다
let memory: string | null | undefined

function current(): string | null {
  return memory !== undefined ? memory : readStored()
}

export function setMyGame(version: string | null) {
  const valid = findGameVersion(version)?.version ?? null
  memory = valid
  try {
    if (valid) localStorage.setItem(MY_GAME_STORAGE_KEY, valid)
    else localStorage.removeItem(MY_GAME_STORAGE_KEY)
  } catch {
    // 저장 실패는 무시한다 (메모리 값으로 이번 세션은 유지)
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // 다른 탭에서 바꾸면 따라간다
  const onStorage = (e: StorageEvent) => {
    if (e.key === MY_GAME_STORAGE_KEY || e.key === null) {
      memory = undefined
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** 현재 내 게임 (선택 안 함 = null) */
export function useMyGame(): GameVersionInfo | null {
  const version = useSyncExternalStore(subscribe, current, () => null)
  return findGameVersion(version)
}

/** 테스트용: 메모리 값을 비워 저장소를 다시 읽게 한다 */
export function resetMyGameForTest() {
  memory = undefined
}
