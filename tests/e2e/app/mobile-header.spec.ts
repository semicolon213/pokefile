import { expect, test } from '@playwright/test'

// TC-08 (NFR-01): 공통 상단 바는 가장 좁은 지원 폭(320px)에서도 가로로 넘치지 않아야 한다
for (const path of ['#/', '#/types', '#/compare', '#/favorites', '#/pokemon/6']) {
  test(`320px에서 ${path} 상단 바가 화면을 넘지 않는다`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto(path)
    const nav = page.getByRole('navigation', { name: '주요 메뉴' })
    await expect(nav.getByRole('link', { name: '즐겨찾기' })).toBeVisible()
    const right = await nav.evaluate((el) => el.getBoundingClientRect().right)
    expect(right).toBeLessThanOrEqual(320)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
