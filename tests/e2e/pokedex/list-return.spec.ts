import { expect, test, type Page } from '@playwright/test'

// 상세에 갔다 돌아오면 필터·펼친 카드·스크롤 위치가 그대로여야 한다
async function scrollDeep(page: Page) {
  const cards = page.getByRole('article')
  await expect(cards).toHaveCount(24)
  await page.getByText('포켓몬을 더 불러오는 중입니다.').scrollIntoViewIfNeeded()
  await expect(cards).toHaveCount(48)
  await page.getByText('포켓몬을 더 불러오는 중입니다.').scrollIntoViewIfNeeded()
  await expect(cards).toHaveCount(72)
  // 40번째 카드쯤에 멈춘다
  await cards.nth(40).scrollIntoViewIfNeeded()
  return page.evaluate(() => window.scrollY)
}

test.describe('목록으로 돌아오기', () => {
  test('브라우저 뒤로 가기: 필터·펼친 카드·스크롤 위치가 유지된다', async ({ page }) => {
    await page.goto('#/?type=water')
    const y = await scrollDeep(page)
    expect(y).toBeGreaterThan(1000)
    await page.getByRole('article').nth(40).getByRole('link').click()
    await expect(page).toHaveURL(/#\/pokemon\/\d+$/)
    // 상세는 맨 위에서 시작한다
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await page.goBack()
    await expect(page).toHaveURL(/#\/\?type=water$/)
    await expect(page.getByRole('article')).toHaveCount(72)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y - 50)
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(y + 50)
  })

  test("'도감 목록으로' 링크: 같은 필터 목록의 같은 위치로 돌아간다", async ({ page }) => {
    await page.goto('#/?type=water&sort=name')
    const y = await scrollDeep(page)
    await page.getByRole('article').nth(40).getByRole('link').click()
    await page.getByRole('link', { name: '도감 목록으로' }).click()
    await expect(page).toHaveURL(/#\/\?type=water&sort=name$/)
    await expect(page.getByRole('button', { name: '물' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('article')).toHaveCount(72)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y - 50)
  })
})
