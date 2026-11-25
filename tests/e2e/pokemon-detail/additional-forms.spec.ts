import { expect, test } from '@playwright/test'
import { additionalFixtureForUrl } from '../../integration/shared/additional-form-fixtures'

test.beforeEach(async ({ page }) => {
  await page.route('**/data/pokedex-index.json', (route) => route.fulfill({ json: additionalFixtureForUrl(route.request().url()) }))
  await page.route('https://pokeapi.co/api/v2/**', (route) => {
    const fixture = additionalFixtureForUrl(route.request().url())
    return fixture === undefined ? route.fulfill({ status: 404, json: {} }) : route.fulfill({ json: fixture })
  })
  await page.route('https://data.pkmn.cc/sets/gen*.json', (route) => route.fulfill({ json: additionalFixtureForUrl(route.request().url()) }))
  const pixel = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><path fill="white" d="M0 0h1v1H0z"/></svg>'
  for (const pattern of ['**/*.png', '**/*.gif']) await page.route(pattern, (route) => route.fulfill({ body: pixel, contentType: 'image/svg+xml' }))
})

for (const [id, form, type, image] of [
  [493, 'fire', '불꽃', 'arceus-fire.gif'],
  [773, 'fairy', '페어리', 'silvally-fairy.gif'],
  [1013, 'masterpiece', '풀', 'sinistcha-masterpiece.png'],
] as const) {
  test(`C-01 #${id}/${form}: 상세 → 비교·URL 새로고침 (TC-04·11)`, async ({ page }) => {
    await page.goto(`#/pokemon/${id}?form=${form}`)
    const basic = page.locator('.detail-basic')
    await expect(basic.getByRole('img')).toHaveAttribute('src', image)
    await expect(basic.getByText(type, { exact: true })).toBeVisible()
    await page.reload()
    await expect(basic.getByRole('img')).toHaveAttribute('src', image)
    await page.getByRole('link', { name: '비교하기' }).click()
    await expect(page).toHaveURL(new RegExp(`a=${id}&af=${form}`))
    const a = page.getByRole('region', { name: '포켓몬 A' })
    await expect(a.locator('img')).toHaveAttribute('src', image)
    await expect(a.getByRole('combobox', { name: /폼/ })).toHaveValue(form)
  })
}

test('C-01 320px에서 타입 폼을 선택해도 가로 넘침이 없다 (TC-08)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('#/pokemon/493?form=fire')
  await page.getByRole('combobox', { name: '폼 선택' }).selectOption('water')
  await expect(page).toHaveURL(/form=water/)
  await expect(page.locator('.detail-basic').getByRole('img')).toHaveAttribute('src', 'arceus-water.gif')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
