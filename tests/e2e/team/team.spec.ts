import { expect, test } from '@playwright/test'

// FR-33 파티 분석: 메뉴로 들어가 포켓몬을 추가하면 받는 피해·자속 공격 범위가 나오고, 새로고침 후에도 파티가 유지된다
test('파티에 포켓몬을 추가해 약점을 보고 새로고침 후에도 유지된다', async ({ page }) => {
  await page.goto('#/')
  await page.getByRole('link', { name: '파티 분석' }).click()
  await expect(page).toHaveURL(/#\/team$/)
  const search = page.getByRole('combobox', { name: '파티에 추가할 포켓몬 검색' })
  for (const name of ['이상해꽃', '이상해꽃']) {
    await search.fill(name)
    await page.getByRole('option', { name: new RegExp(name) }).first().click()
  }
  await expect(page).toHaveURL(/p=3&p=3$/)
  await expect(page.getByRole('rowheader', { name: /불꽃\s*주의/ })).toBeVisible()
  await expect(page.getByText('보완 추천')).toBeVisible()

  await page.reload()
  await expect(page.getByText('이상해꽃', { exact: true }).first()).toBeVisible()
  await page.goto('#/team')
  await expect(page).toHaveURL(/p=3&p=3$/)
})
