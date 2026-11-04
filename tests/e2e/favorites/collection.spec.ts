import { expect, test } from '@playwright/test'

const key = 'pokefile:collection'
const index = { version: 2, count: 3, pokemon: [
  { id: 6, nameEn: 'charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', forms: [] },
  { id: 25, nameEn: 'pikachu', nameKo: '피카츄', types: ['electric'], generation: 'generation-i', forms: [] },
  { id: 1025, nameEn: 'pecharunt', nameKo: '복숭악동', types: ['poison', 'ghost'], generation: 'generation-ix', forms: [] },
] }

test.beforeEach(async ({ context }) => {
  await context.route('**/data/pokedex-index.json', (route) => route.fulfill({ json: index }))
  await context.route('https://raw.githubusercontent.com/PokeAPI/sprites/**', (route) => route.fulfill({
    contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="12" fill="#c8d0d8"/></svg>',
  }))
})

test('즐겨찾기에서 진입해 체크·새로고침·해제하고 즐겨찾기와 독립적으로 저장한다 (FR-29 / TC-14)', async ({ page }) => {
  await page.goto('#/favorites')
  await page.getByRole('link', { name: '도감 체크리스트', exact: true }).click()
  await expect(page).toHaveURL(/favorites\?view=collection$/)
  const checkbox = page.getByRole('checkbox', { name: '#0025 피카츄 포획 완료' })
  await checkbox.check()
  await expect(page.getByText('1 / 3마리 · 33.3%', { exact: true })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: '1세대 도감 완성률', exact: true })).toHaveAttribute('value', '1')
  await page.reload()
  await expect(checkbox).toBeChecked()
  await page.getByRole('button', { name: '#0025 즐겨찾기 추가', exact: true }).click()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pokefile:favorites')!))).toEqual({ version: 1, ids: [25] })
  await checkbox.uncheck()
  expect(await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)!), key)).toEqual({ version: 1, ids: [] })
  await page.getByRole('link', { name: '즐겨찾기 목록', exact: true }).click()
  await expect(page.getByRole('list', { name: '저장한 포켓몬' }).getByRole('link', { name: /피카츄/ })).toBeVisible()
})

test('번호·세대·포획 필터를 조합해도 전체 완성률은 유지한다 (TC-14)', async ({ page }) => {
  await page.goto('#/favorites?view=collection')
  await page.getByRole('checkbox', { name: '#1025 복숭악동 포획 완료' }).check()
  await page.getByLabel('체크리스트 검색').fill('#1025')
  await page.getByRole('combobox', { name: '세대', exact: true }).selectOption('generation-ix')
  await page.getByRole('combobox', { name: '포획 상태', exact: true }).selectOption('caught')
  await expect(page.getByRole('list', { name: '도감 체크리스트 목록' }).getByRole('listitem')).toHaveCount(1)
  await expect(page.getByText('1 / 3마리 · 33.3%', { exact: true })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: '9세대 도감 완성률', exact: true })).toHaveAttribute('value', '1')
  await page.getByRole('combobox', { name: '포획 상태', exact: true }).selectOption('missing')
  await expect(page.getByText('조건에 맞는 포켓몬이 없습니다.')).toBeVisible()
  await expect(page.getByText('1 / 3마리 · 33.3%', { exact: true })).toBeVisible()
})

test('다른 탭의 체크·해제와 저장소 초기화를 반영한다 (TC-14·09)', async ({ page, context }) => {
  await page.goto('#/favorites?view=collection')
  const other = await context.newPage()
  await other.goto('/pokefile/#/favorites?view=collection')
  const name = '#0025 피카츄 포획 완료'
  await page.getByRole('checkbox', { name }).check()
  await expect(other.getByRole('checkbox', { name })).toBeChecked()
  await other.getByRole('checkbox', { name }).uncheck()
  await expect(page.getByRole('checkbox', { name })).not.toBeChecked()
  await page.getByRole('checkbox', { name }).check()
  await other.evaluate(() => localStorage.clear())
  await expect(page.getByRole('checkbox', { name })).not.toBeChecked()
})

test('D-B: 손상된 기록을 보존하고 확인·취소 후 명시적으로 초기화한다 (TC-14·09)', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.addInitScript((storageKey) => localStorage.setItem(storageKey, 'broken'), key)
  await page.goto('#/favorites?view=collection')
  await expect(page.getByText(/저장된 도감 기록 전체를/)).toBeVisible()
  expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBe('broken')
  await expect(page.getByRole('checkbox', { name: '#0025 피카츄 포획 여부 확인 불가' })).toBeDisabled()
  await expect(page.getByRole('progressbar')).toHaveCount(0)
  await page.getByRole('button', { name: '기록 초기화', exact: true }).click()
  const content = page.getByRole('region', { name: '도감 체크리스트', exact: true })
  expect(await content.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  await content.screenshot({ path: testInfo.outputPath('collection-reset-confirmation-mobile.png') })
  await expect(page.getByRole('button', { name: '취소', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBe('broken')
  await expect(page.getByRole('button', { name: '기록 초기화', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '초기화하고 시작', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: '도감 체크리스트' })).toBeFocused()
  await expect(page.getByText('0 / 3마리 · 0%', { exact: true })).toBeVisible()
  await page.getByRole('checkbox', { name: '#0025 피카츄 포획 완료' }).check()
  expect(await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)!), key)).toEqual({ version: 1, ids: [25] })
})

test('D-A: 최초 읽기 차단 시 확인 불가로 표시하고 저장된 기록을 다시 읽는다 (TC-09·14)', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.addInitScript((storageKey) => {
    const storage = window.localStorage
    storage.setItem(storageKey, '{"version":1,"ids":[25,6]}')
    const state = window as typeof window & { collectionReadBlocked: boolean }
    state.collectionReadBlocked = true
    Object.defineProperty(window, 'localStorage', { configurable: true, get() {
      if (state.collectionReadBlocked) throw new DOMException('blocked', 'SecurityError')
      return storage
    } })
  }, key)
  await page.goto('#/favorites?view=collection')
  await expect(page.getByRole('alert')).toContainText('포획 기록을 변경할 수 없습니다.')
  const unknown = page.getByRole('checkbox', { name: '#0025 피카츄 포획 여부 확인 불가' })
  await expect(unknown).toBeDisabled()
  await expect(unknown).toHaveAttribute('aria-checked', 'mixed')
  expect(await unknown.evaluate((element: HTMLInputElement) => element.indeterminate)).toBe(true)
  await expect(page.getByRole('combobox', { name: '포획 상태', exact: true })).toBeDisabled()
  await expect(page.getByText('검색 결과 3마리 · 포획 상태 확인 불가', { exact: true })).toBeVisible()
  await expect(page.getByRole('progressbar')).toHaveCount(0)
  await expect(page.getByRole('list', { name: '도감 체크리스트 목록' }).getByRole('link', { name: /피카츄/ })).toBeVisible()
  const content = page.getByRole('region', { name: '도감 체크리스트', exact: true })
  expect(await content.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  await content.screenshot({ path: testInfo.outputPath('collection-read-unavailable-mobile-dark.png') })
  await page.evaluate(() => { (window as typeof window & { collectionReadBlocked: boolean }).collectionReadBlocked = false })
  await page.getByRole('button', { name: '포획 기록 다시 읽기' }).click()
  await expect(page.getByRole('checkbox', { name: '#0025 피카츄 포획 완료' })).toBeChecked()
  await expect(page.getByRole('combobox', { name: '포획 상태', exact: true })).toBeEnabled()
  await expect(page.getByText('2 / 3마리 · 66.7%', { exact: true })).toBeVisible()
})

test('D-B: 미지원 버전의 포획 기록은 초기화 전까지 덮어쓰지 않는다 (TC-09·14)', async ({ page }) => {
  const original = '{"version":2,"ids":[25,6]}'
  await page.addInitScript(({ storageKey, value }) => localStorage.setItem(storageKey, value), { storageKey: key, value: original })
  await page.goto('#/favorites?view=collection')
  await expect(page.getByRole('checkbox', { name: '#0025 피카츄 포획 여부 확인 불가' })).toBeDisabled()
  await expect(page.getByRole('progressbar')).toHaveCount(0)
  await page.reload()
  expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBe(original)
  await page.getByRole('button', { name: '기록 초기화', exact: true }).click()
  await page.getByRole('button', { name: '초기화하고 시작', exact: true }).click()
  expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBe('{"version":1,"ids":[]}')
  await expect(page.getByRole('checkbox', { name: '#0025 피카츄 포획 완료' })).toBeEnabled()
})

test('T-1: 목록 재시도 중 로딩을 표시하고 버튼을 비활성화한다 (TC-09·14)', async ({ page }) => {
  let fail = true
  let release!: () => void
  const pending = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/data/pokedex-index.json', async (route) => {
    if (fail) return route.fulfill({ status: 503, json: {} })
    await pending
    return route.fulfill({ json: index })
  })
  await page.goto('#/favorites?view=collection')
  const retry = page.getByRole('button', { name: '목록 다시 시도', exact: true })
  await expect(retry).toBeVisible()
  fail = false
  await retry.click()
  await expect(page.getByText('도감 체크리스트를 불러오는 중입니다.', { exact: true })).toBeVisible()
  await expect(retry).toBeDisabled()
  release()
  await expect(page.getByRole('checkbox', { name: '#0025 피카츄 포획 완료' })).toBeEnabled()
})

test('320px·다크 모드에서 키보드 체크와 해제·필터가 가능하다 (TC-08·14)', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('#/favorites?view=collection')
  const checkbox = page.getByRole('checkbox', { name: '#0025 피카츄 포획 완료' })
  await checkbox.focus()
  await page.keyboard.press('Space')
  await expect(checkbox).toBeChecked()
  await expect(checkbox).toBeFocused()
  await page.screenshot({ path: testInfo.outputPath('collection-mobile-dark.png'), fullPage: true })
  await page.keyboard.press('Space')
  await expect(checkbox).not.toBeChecked()
  const content = page.getByRole('region', { name: '도감 체크리스트', exact: true })
  const bounds = await content.evaluate((element) => ({
    left: element.getBoundingClientRect().left,
    right: element.getBoundingClientRect().right,
    width: element.clientWidth,
    contentWidth: element.scrollWidth,
    viewport: innerWidth,
  }))
  expect(bounds.left).toBeGreaterThanOrEqual(0)
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport)
  expect(bounds.contentWidth).toBeLessThanOrEqual(bounds.width)
  const views = await page.getByRole('navigation', { name: '저장한 포켓몬 보기' }).boundingBox()
  expect(views!.x + views!.width).toBeLessThanOrEqual(bounds.viewport)
  const filter = page.getByRole('combobox', { name: '포획 상태', exact: true })
  await filter.focus()
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(filter).toHaveValue('caught')
  await expect(page.getByText('조건에 맞는 포켓몬이 없습니다.')).toBeVisible()
  await expect(page.getByText('0 / 3마리 · 0%', { exact: true })).toBeVisible()
})

// 공통 셸 결함은 성윤우의 제품 코드에서 우회하지 않는다. 전체 E2E에서 계속 검출한다.
test('공통 셸: 320px 문서 너비가 기존 즐겨찾기와 체크리스트 모두 화면을 넘지 않는다 (TC-08)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('#/favorites?view=collection')
  await expect(page.getByRole('checkbox', { name: '#0025 피카츄 포획 완료' })).toBeVisible()
  const layout = await page.evaluate(() => ({
    viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
    overflowing: [...document.querySelectorAll('body *')].filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
      .map((element) => ({ tag: element.tagName, className: element.className, right: Math.round(element.getBoundingClientRect().right) })).slice(0, 15),
  }))
  await page.goto('#/favorites')
  const baselineDocumentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect.soft(layout.documentWidth, `체크리스트: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(layout.viewport)
  expect(baselineDocumentWidth, `기존 즐겨찾기 문서 너비: ${baselineDocumentWidth}px`).toBeLessThanOrEqual(layout.viewport)
})
