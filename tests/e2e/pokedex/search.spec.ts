import { expect, test } from '@playwright/test'

// TASK-003: 실제 정적 인덱스(public/data/pokedex-index.json)로 검색 → 상세 이동
test.describe('도감 검색', () => {
  test('721종 전체 목록을 불러온다', async ({ page }) => {
    await page.goto('#/')
    await expect(page.getByText('전체 721마리')).toBeVisible()
  })

  for (const query of ['피카츄', 'Pikachu', '25']) {
    test(`"${query}" 검색 후 카드를 눌러 상세로 이동한다`, async ({ page }) => {
      await page.goto('#/')
      await page.getByRole('searchbox', { name: '포켓몬 검색' }).fill(query)
      await page.getByRole('button', { name: '검색' }).click()
      await expect(page.getByText('검색 결과 1마리')).toBeVisible()
      await page.getByRole('link', { name: /피카츄/ }).click()
      await expect(page).toHaveURL(/#\/pokemon\/25$/)
      await expect(page.getByRole('heading', { level: 1, name: '포켓몬 #25' })).toBeVisible()
    })
  }

  test('즐겨찾기 버튼은 카드 이동을 일으키지 않는다', async ({ page }) => {
    await page.goto('#/')
    await page.getByRole('searchbox', { name: '포켓몬 검색' }).fill('피카츄')
    await page.getByRole('searchbox', { name: '포켓몬 검색' }).press('Enter')
    await page.getByRole('button', { name: '#25 즐겨찾기' }).click({ force: true })
    await expect(page).not.toHaveURL(/#\/pokemon\//)
    await expect(page.getByRole('heading', { level: 1, name: '포켓몬 도감' })).toBeVisible()
  })
})
