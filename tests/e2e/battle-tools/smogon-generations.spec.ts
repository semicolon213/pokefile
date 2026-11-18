import { expect, test } from '@playwright/test'
import scope from '../../../src/shared/config/scope.json' with { type: 'json' }
import { fixtureForUrl, SMOGON_FIXTURE } from '../../integration/battle-tools/fixtures'

const configured = (scope.smogon as { generations?: number[] }).generations ?? [scope.smogon.generation]
test.skip(!configured.includes(9), 'CR-025-SMOGON-SCOPE 승인 및 공통 다중 세대 설정 적용 대기')

const candidate = (generation: number) => ({ Charizard: { ou: {
  [`Gen ${generation} attacker`]: { moves: ['Flamethrower'], item: 'Leftovers' },
} } })

test.beforeEach(async ({ page }) => {
  await page.route('**/data/pokedex-index.json', (route) => route.fulfill({ json: fixtureForUrl(route.request().url()) }))
  await page.route('https://pokeapi.co/api/v2/**', (route) => route.fulfill({ json: fixtureForUrl(route.request().url()) ?? {} }))
  await page.route('https://data.pkmn.cc/sets/gen*.json', (route) => {
    const generation = Number(/gen(\d+)\.json/.exec(route.request().url())?.[1])
    return route.fulfill({ json: generation <= 7 ? SMOGON_FIXTURE : candidate(generation) })
  })
})

test('최신 세대 기본 선택·세대 전환·메가 폼·캐시 공유 (TASK-025 / TC-06)', async ({ page }) => {
  const requests: number[] = []
  page.on('request', (request) => {
    const generation = /\/sets\/gen(\d+)\.json/.exec(request.url())?.[1]
    if (generation) requests.push(Number(generation))
  })
  await page.goto('#/pokemon/6')
  const section = page.getByRole('region', { name: '실전 추천 세팅' })
  await expect(section.getByRole('tab')).toHaveText(['9세대', '8세대', '7세대', '6세대'])
  await expect(section.getByRole('tab', { name: '9세대' })).toHaveAttribute('aria-selected', 'true')
  await section.getByRole('combobox').selectOption('ou')
  await expect(section.getByRole('article', { name: 'Gen 9 attacker' })).toBeVisible()
  await section.getByRole('tab', { name: '8세대' }).click()
  await expect(section.getByRole('combobox')).toHaveValue('')
  await section.getByRole('combobox').selectOption('ou')
  await expect(section.getByRole('article', { name: 'Gen 8 attacker' })).toBeVisible()
  await page.getByRole('button', { name: '메가X', exact: true }).click()
  await expect(section.getByRole('tab')).toHaveText(['7세대', '6세대'])
  await expect(section.getByRole('tab', { name: '7세대' })).toHaveAttribute('aria-selected', 'true')
  await section.getByRole('combobox').selectOption('ou')
  await expect(section.getByText('Mega X attacker', { exact: true })).toBeVisible()
  expect(requests.sort()).toEqual([6, 7, 8, 9])
})

test('일부 세대 실패와 복구를 부재와 구분한다 (TASK-025 / TC-09)', async ({ page }) => {
  let fails = true
  await page.route('https://data.pkmn.cc/sets/gen9.json', (route) => route.fulfill({
    status: fails ? 503 : 200, json: fails ? {} : candidate(9),
  }))
  await page.goto('#/pokemon/6')
  const section = page.getByRole('region', { name: '실전 추천 세팅' })
  await expect(section.getByRole('alert')).toHaveText('9세대 실전 세팅을 불러오지 못했습니다.')
  await expect(section.getByRole('tab', { name: '8세대' })).toHaveAttribute('aria-selected', 'true')
  await section.getByRole('combobox').selectOption('ou')
  await expect(section.getByText('Gen 8 attacker', { exact: true })).toBeVisible()
  fails = false
  await section.getByRole('button', { name: '9세대 다시 시도' }).click()
  await expect(section.getByRole('tab', { name: '9세대' })).toHaveAttribute('aria-selected', 'true')
  await expect(section.getByRole('alert')).toHaveCount(0)
})

test('320px에서 세대 탭을 키보드로 전환한다 (TASK-025 / TC-08)', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('#/pokemon/6')
  const section = page.getByRole('region', { name: '실전 추천 세팅' })
  const newest = section.getByRole('tab', { name: '9세대' })
  await expect(newest).toHaveAttribute('aria-selected', 'true')
  await newest.focus()
  await newest.press('End')
  const oldest = section.getByRole('tab', { name: '6세대' })
  await expect(oldest).toBeFocused()
  await expect(oldest).toHaveAttribute('aria-selected', 'true')
  await expect(section.getByRole('tabpanel', { name: '6세대' })).toBeVisible()
  await section.getByRole('combobox').selectOption('ou')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await section.screenshot({ path: testInfo.outputPath('smogon-generations-320px.png') })
})
