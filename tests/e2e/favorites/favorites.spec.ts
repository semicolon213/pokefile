import { expect, test } from '@playwright/test'

const key = 'pokefile:favorites'
const resource = (name: string) => ({ name, url: '' })
const image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const index = { version: 1, generatedAt: '2026-11-03', count: 2, pokemon: [
  { id: 25, nameEn: 'pikachu', nameKo: '피카츄', types: ['electric'], generation: 'generation-i', megaForms: [] },
  { id: 6, nameEn: 'charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', megaForms: ['mega-x', 'mega-y'] },
] }

test.beforeEach(async ({ context }) => {
  await context.route('**/data/pokedex-index.json', (route) => route.fulfill({ json: index }))
  await context.route('https://data.pkmn.cc/sets/gen6.json', (route) => route.fulfill({ json: {} }))
  await context.route('https://raw.githubusercontent.com/PokeAPI/sprites/**', (route) => route.fulfill({
    contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
  }))
  await context.route('https://pokeapi.co/api/v2/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v2', '')
    if (path === '/pokemon-species/6') return route.fulfill({ json: {
      id: 6, name: 'charizard', names: [{ language: resource('ko'), name: '리자몽' }], genera: [], flavor_text_entries: [], evolution_chain: null,
    } })
    if (path === '/pokemon/6/encounters') return route.fulfill({ json: [] })
    if (path.startsWith('/pokemon-form/')) return route.fulfill({ json: {
      name: 'charizard-mega-x', form_names: [{ language: resource('ko'), name: '메가리자몽X' }],
    } })
    if (path === '/pokemon/6' || path === '/pokemon/charizard-mega-x') {
      const name = path.endsWith('mega-x') ? 'charizard-mega-x' : 'charizard'
      return route.fulfill({ json: {
        id: name === 'charizard' ? 6 : 10034, name, height: 17, weight: 905,
        types: [{ slot: 1, type: resource('fire') }], abilities: [],
        stats: ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((stat) => ({ base_stat: 80, stat: resource(stat) })),
        sprites: { front_default: image, other: { showdown: { front_default: image } } }, forms: [resource(name)],
      } })
    }
    return route.fulfill({ status: 404, json: {} })
  })
})

test('카드에서 저장해도 이동하지 않고 새로고침·메가 폼에서도 종 단위로 유지한다 (TC-07)', async ({ page }) => {
  await page.goto('#/')
  await page.getByRole('button', { name: '#0025 즐겨찾기 추가', exact: true }).click()
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('button', { name: '#0025 즐겨찾기 해제', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('button', { name: '#0025 즐겨찾기 해제', exact: true })).toBeVisible()
  await page.goto('#/pokemon/6?form=mega-x')
  await expect(page.getByRole('button', { name: '메가X', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '#0006 즐겨찾기 추가', exact: true }).click()
  expect(await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)!), key)).toEqual({ version: 1, ids: [25, 6] })
  await page.reload()
  await expect(page.getByRole('button', { name: '#0006 즐겨찾기 해제', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('link', { name: '즐겨찾기', exact: true }).click()
  const cards = page.getByRole('list', { name: '저장한 포켓몬' }).getByRole('listitem')
  await expect(cards).toHaveCount(2)
  await expect(cards.nth(0)).toContainText('피카츄')
  await expect(cards.nth(1)).toContainText('리자몽')
})

test('목록 이동 시 도감 캐시를 재사용하고 새로고침·해제·빈 목록을 표시한다 (TC-07·08)', async ({ page }) => {
  let indexRequests = 0
  page.on('request', (request) => { if (request.url().endsWith('/data/pokedex-index.json')) indexRequests++ })
  await page.goto('#/')
  await page.getByRole('button', { name: '#0025 즐겨찾기 추가', exact: true }).click()
  await page.getByRole('link', { name: '즐겨찾기', exact: true }).click()
  const list = page.getByRole('list', { name: '저장한 포켓몬' })
  await expect(list.getByRole('link', { name: /피카츄/ })).toBeVisible()
  expect(indexRequests).toBe(1)
  await page.reload()
  await expect(list.getByRole('link', { name: /피카츄/ })).toBeVisible()
  await list.getByRole('button', { name: '#0025 즐겨찾기 해제', exact: true }).click()
  await expect(page).toHaveURL(/#\/favorites$/)
  await expect(page.getByText('즐겨찾기한 포켓몬이 없습니다.')).toBeVisible()
  await expect(page.getByRole('link', { name: '도감으로 이동' })).toBeVisible()
  expect(await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)!), key)).toEqual({ version: 1, ids: [] })
})

for (const [label, raw] of [['손상 JSON', '{broken'], ['버전 불일치', '{"version":2,"ids":[25]}']]) {
  test(`${label} 안내 후 도감에서 다시 저장할 수 있다 (TC-09)`, async ({ page }) => {
    await page.addInitScript(({ storageKey, value }) => {
      if (localStorage.getItem(storageKey) === null) localStorage.setItem(storageKey, value)
    }, { storageKey: key, value: raw })
    await page.goto('#/favorites')
    await expect(page.getByText('저장된 즐겨찾기를 읽을 수 없어 빈 목록으로 시작합니다.')).toBeVisible()
    await expect(page.getByText('즐겨찾기한 포켓몬이 없습니다.')).toBeVisible()
    expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBe(raw)
    await page.getByRole('link', { name: '도감으로 이동' }).click()
    await page.getByRole('button', { name: '#0025 즐겨찾기 추가', exact: true }).click()
    await page.getByRole('link', { name: '즐겨찾기', exact: true }).click()
    await expect(page.getByRole('list', { name: '저장한 포켓몬' }).getByRole('link', { name: /피카츄/ })).toBeVisible()
    expect(await page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)!), key)).toEqual({ version: 1, ids: [25] })
  })
}

test('조회 오류에서도 저장 항목을 유지하고 재시도할 수 있다 (TC-09)', async ({ page }) => {
  await page.addInitScript((storageKey) => localStorage.setItem(storageKey, '{"version":1,"ids":[25]}'), key)
  let failed = true
  await page.route('**/data/pokedex-index.json', (route) => failed
    ? route.fulfill({ status: 503, json: {} }) : route.fulfill({ json: index }))
  await page.goto('#/favorites')
  await expect(page.getByRole('alert')).toContainText('포켓몬 정보를 불러오지 못했습니다.')
  await expect(page.getByRole('link', { name: '포켓몬 #0025 상세 보기' })).toBeVisible()
  await expect(page.getByRole('button', { name: '#0025 즐겨찾기 해제', exact: true })).toBeEnabled()
  failed = false
  await page.getByRole('button', { name: '다시 시도', exact: true }).click()
  await expect(page.getByRole('list', { name: '저장한 포켓몬' }).getByRole('link', { name: /피카츄/ })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('모바일에서 카드가 넘치지 않고 키보드로 해제할 수 있다 (TC-07·08)', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript((storageKey) => localStorage.setItem(storageKey, '{"version":1,"ids":[25,6]}'), key)
  await page.goto('#/favorites')
  const list = page.getByRole('list', { name: '저장한 포켓몬' })
  await expect(list.getByRole('listitem')).toHaveCount(2)
  await expect(list.getByRole('link', { name: /피카츄/ })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('favorites-mobile.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await list.getByRole('button', { name: '#0025 즐겨찾기 해제', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(list.getByRole('listitem')).toHaveCount(1)
  await expect(list.getByRole('link', { name: /리자몽/ })).toBeVisible()
  await expect(page).toHaveURL(/#\/favorites$/)
})

test('다른 탭의 추가·해제를 반영한다 (TC-07)', async ({ page, context }) => {
  await page.goto('#/')
  const other = await context.newPage()
  await other.goto('/pokefile/#/')
  await page.getByRole('button', { name: '#0025 즐겨찾기 추가', exact: true }).click()
  await expect(other.getByRole('button', { name: '#0025 즐겨찾기 해제', exact: true })).toBeVisible()
  await other.getByRole('button', { name: '#0025 즐겨찾기 해제', exact: true }).click()
  await expect(page.getByRole('button', { name: '#0025 즐겨찾기 추가', exact: true })).toBeVisible()
})

test('저장소 접근이 차단되어도 도감 탐색은 계속 가능하다 (TC-09)', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError') } }))
  await page.goto('#/')
  await expect(page.getByRole('heading', { level: 1, name: '포켓몬 도감' })).toBeVisible()
  await expect(page.getByRole('button', { name: '#0025 즐겨찾기 추가', exact: true })).toBeDisabled()
  await expect(page.getByRole('link', { name: /피카츄/ })).toBeVisible()
  await page.getByRole('link', { name: '즐겨찾기', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: '즐겨찾기' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('브라우저 저장 공간을 사용할 수 없어')
  await expect(page.getByRole('link', { name: '도감으로 이동' })).toBeVisible()
  await expect(page.getByText('즐겨찾기한 포켓몬이 없습니다.')).toHaveCount(0)
})
