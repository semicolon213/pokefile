import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'
import { resetMyGameForTest } from '@/shared/state'

// 전체 테스트를 병렬로 돌리면 파일의 첫 렌더(모듈 로딩 포함)가 기본 1초를 넘길 때가 있어 비동기 대기를 3초로 둔다
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  cleanup()
  localStorage.clear()
  // 내 게임(FR-26)은 메모리에도 값을 두므로 저장소와 함께 비운다
  resetMyGameForTest()
})
