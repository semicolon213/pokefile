import { expect, test } from '@playwright/test'

// TASK-020 다크 모드 (FR-32)
// 화면에 실제로 칠해진 배경색 (빌드 CSS는 압축되므로 토큰 문자열 대신 계산된 값으로 비교)
const rootBg = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
const DARK = 'rgb(17, 19, 23)'
const LIGHT = 'rgb(255, 255, 255)'

test.describe('화면 테마', () => {
  test('시스템 설정이 다크면 다크로 보이고, 라이트를 고르면 시스템과 상관없이 라이트로 유지된다', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('#/')
    expect(await rootBg(page)).toBe(DARK)
    const group = page.getByRole('group', { name: '화면 테마' })
    await group.getByRole('button', { name: '라이트 모드' }).click()
    expect(await rootBg(page)).toBe(LIGHT)
    await page.reload()
    // 렌더 전 스크립트가 저장된 선택을 먼저 적용한다
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(group.getByRole('button', { name: '라이트 모드' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('다크 모드를 고르면 새로고침 후에도 유지된다', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('#/types')
    await page.getByRole('group', { name: '화면 테마' }).getByRole('button', { name: '다크 모드' }).click()
    expect(await rootBg(page)).toBe(DARK)
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await rootBg(page)).toBe(DARK)
  })
})
