import { expect, test } from '@playwright/test'

// ADR-005: GitHub Pages 경로(/pokefile/)에서 HashRouter 주소로 직접 진입·새로고침해도 화면이 유지된다.
test.describe('hash routing', () => {
  for (const [hash, heading] of [
    ['#/', '포켓몬 도감'],
    ['#/pokemon/25', '포켓몬 #25'],
    ['#/favorites', '즐겨찾기'],
    ['#/unknown', '페이지를 찾을 수 없습니다'],
  ] as const) {
    test(`${hash} 직접 진입 후 새로고침`, async ({ page }) => {
      await page.goto(hash)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    })
  }

  test('헤더 메뉴 이동이 해시 주소로 반영된다', async ({ page }) => {
    await page.goto('#/')
    await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '즐겨찾기' }).click()
    await expect(page).toHaveURL(/\/pokefile\/#\/favorites$/)
    await expect(page.getByRole('heading', { level: 1, name: '즐겨찾기' })).toBeVisible()
  })
})
