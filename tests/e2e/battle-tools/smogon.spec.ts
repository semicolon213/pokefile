import { expect, test } from '@playwright/test'
import { fixtureForUrl } from '../../integration/battle-tools/fixtures'

test.beforeEach(async ({ page }) => {
  const respond = async (route: import('@playwright/test').Route) => {
    const data = fixtureForUrl(route.request().url())
    await route.fulfill({ status: data === undefined ? 404 : 200, contentType: 'application/json', body: JSON.stringify(data ?? {}) })
  }
  await page.route('**/data/pokedex-index.json', respond)
  await page.route('https://pokeapi.co/api/v2/**', respond)
  await page.route('https://data.pkmn.cc/sets/gen6.json', respond)
})

test('기본 → 메가X → 메가Y 전환과 URL 새로고침에서 정확한 세팅을 표시한다 (TC-06)', async ({ page }) => {
  let requests = 0
  page.on('request', (request) => { if (request.url().endsWith('/sets/gen6.json')) requests++ })
  await page.goto('#/pokemon/6')
  const section = page.getByRole('region', { name: '실전 추천 세팅' })
  const select = section.getByRole('combobox', { name: '대전 포맷' })
  await expect(select).toHaveValue('')
  await select.selectOption('ou')
  await expect(section.getByRole('article', { name: 'Base attacker' })).toBeVisible()
  await page.getByRole('button', { name: '메가X', exact: true }).click()
  await expect(page.getByRole('button', { name: '메가X', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(section.getByText('Base attacker', { exact: true })).toHaveCount(0)
  await expect(select).toHaveValue('')
  await select.selectOption('ou')
  await expect(section.getByText('Mega X attacker', { exact: true })).toBeVisible()
  await expect(section.getByText('Direct X attacker', { exact: true })).toBeVisible()
  await expect(section.getByText('Mega Y attacker', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '메가Y', exact: true }).click()
  await expect(page.getByRole('button', { name: '메가Y', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(select).toHaveValue('')
  await select.selectOption('ou')
  await expect(section.getByText('Mega Y attacker', { exact: true })).toBeVisible()
  await expect(section.getByText('Mega X attacker', { exact: true })).toHaveCount(0)
  expect(requests).toBe(1)
  await page.reload()
  await select.selectOption('ou')
  await expect(section.getByText('Mega Y attacker', { exact: true })).toBeVisible()
})

test('세팅 오류가 상세 화면을 중단시키지 않으며 재시도할 수 있다 (TC-09)', async ({ page }) => {
  let fails = true
  await page.route('https://data.pkmn.cc/sets/gen6.json', async (route) => {
    await route.fulfill({ status: fails ? 503 : 200, contentType: 'application/json', body: JSON.stringify(fails ? {} : fixtureForUrl(route.request().url())) })
  })
  await page.goto('#/pokemon/6')
  const section = page.getByRole('region', { name: '실전 추천 세팅' })
  await expect(section.getByRole('alert')).toHaveText('실전 세팅을 불러오지 못했습니다.')
  await expect(page.getByRole('heading', { level: 1, name: '리자몽' })).toBeVisible()
  await expect(page.getByRole('table', { name: '종족값 수치' })).toBeVisible()
  fails = false
  await section.getByRole('button', { name: '다시 시도' }).click()
  await section.getByRole('combobox').selectOption('ou')
  await expect(section.getByText('Base attacker', { exact: true })).toBeVisible()
})

test('데이터 부재를 오류와 구분한다 (FR-18)', async ({ page }) => {
  await page.route('https://data.pkmn.cc/sets/gen6.json', (route) => route.fulfill({ contentType: 'application/json', body: '{}' }))
  await page.goto('#/pokemon/6')
  const section = page.getByRole('region', { name: '실전 추천 세팅' })
  await expect(section.getByText('등록된 실전 세팅이 없습니다.')).toBeVisible()
  await expect(section.getByRole('alert')).toHaveCount(0)
})

test('모바일에서 넘침 없이 키보드로 포맷을 선택한다 (TC-08)', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('#/pokemon/6')
  const section = page.getByRole('region', { name: '실전 추천 세팅' })
  const select = section.getByRole('combobox')
  await expect(select).toBeVisible()
  await select.focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(select).toHaveValue('ou')
  await expect(section.getByRole('article', { name: 'Base attacker' })).toBeVisible()
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflows).toBe(false)
  await section.screenshot({ path: testInfo.outputPath('smogon-mobile.png') })
})
