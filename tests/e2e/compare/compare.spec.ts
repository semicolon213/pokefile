import { expect, test } from '@playwright/test'

// TASK-022 두 포켓몬 능력치 비교 (FR-25), 실제 PokéAPI
test.describe('포켓몬 비교', () => {
  test('상세의 비교하기로 A를 채우고 B를 검색해 종족값을 비교한다', async ({ page }) => {
    await page.goto('#/pokemon/6')
    await page.getByRole('link', { name: '비교하기' }).click()
    await expect(page).toHaveURL(/#\/compare\?a=6$/)
    const pickerB = page.getByRole('region', { name: '포켓몬 B' })
    await pickerB.getByRole('combobox').fill('거북왕')
    await pickerB.getByRole('option', { name: /거북왕/ }).click()
    await expect(page).toHaveURL(/a=6&b=9/)
    const total = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: '합계' }) })
    await expect(total).toContainText('534')
    await expect(total).toContainText('530')
  })

  test('상단 메뉴에서 열린다', async ({ page }) => {
    await page.goto('#/')
    await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '포켓몬 비교' }).click()
    await expect(page.getByRole('heading', { level: 1, name: '포켓몬 비교' })).toBeVisible()
    await expect(page.getByText('비교할 포켓몬 두 마리를 고르세요.')).toBeVisible()
  })
})
