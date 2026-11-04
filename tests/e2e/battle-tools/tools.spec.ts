import { expect, test } from '@playwright/test'
import snapshot from '../../integration/battle-tools/task011-fixture.json' with { type: 'json' }

const resource = (name: string) => ({ name, url: '' })
const index = { version: 2, count: 3, pokemon: [
  { id: 6, nameEn: 'Charizard', nameKo: '리자몽', types: ['fire', 'flying'], generation: 'generation-i', forms: [
    { key: 'mega-x', nameKo: '메가리자몽X', nameEn: 'Mega Charizard X', category: 'mega', types: ['fire', 'dragon'], battleOnly: true },
    { key: 'mega-y', nameKo: '메가리자몽Y', nameEn: 'Mega Charizard Y', category: 'mega', types: ['fire', 'flying'], battleOnly: true },
  ] },
  { id: 25, nameEn: 'Pikachu', nameKo: '피카츄', types: ['electric'], generation: 'generation-i', forms: [] },
  { id: 681, nameEn: 'Aegislash', nameKo: '킬가르도', types: ['steel', 'ghost'], generation: 'generation-vi', forms: [] },
] }

test.beforeEach(async ({ context }) => {
  await context.route('**/data/pokedex-index.json', (route) => route.fulfill({ json: index }))
  await context.route('https://data.pkmn.cc/sets/gen6.json', (route) => route.fulfill({ json: {} }))
  // 1초 PCM fixture로 브라우저의 재생·일시정지 동작을 확인한다.
  await context.route('https://raw.githubusercontent.com/PokeAPI/cries/**', (route) => route.fulfill({ contentType: 'audio/wav', path: 'tests/e2e/battle-tools/cry.wav' }))
  await context.route('https://raw.githubusercontent.com/PokeAPI/sprites/**', (route) => route.fulfill({
    contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="12" fill="#c8d0d8"/></svg>',
  }))
  await context.route('https://pokeapi.co/api/v2/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v2', '')
    const name = path.split('/').at(-1)
    if (path === '/pokemon-species/6') return route.fulfill({ json: {
      id: 6, name: 'charizard', names: [{ name: '리자몽', language: resource('ko') }], genera: [], flavor_text_entries: [], evolution_chain: null,
    } })
    if (path === '/pokemon/6/encounters') return route.fulfill({ json: [] })
    if (path.startsWith('/pokemon-form/')) return route.fulfill({ json: {
      name, form_names: [{ name: '메가리자몽X', language: resource('ko') }],
    } })
    const pokemon = snapshot.pokemon.find((entry) => entry.name === name || String(entry.id) === name)
    if (pokemon) return route.fulfill({ json: { ...pokemon, height: 17, weight: 905, abilities: [], forms: [resource(pokemon.name)] } })
    return route.fulfill({ status: 404, json: {} })
  })
})

test('상세에서 이로치 전환·울음소리만 제공하고 접으면 재생을 중지한다 (FR-23 / TC-11)', async ({ page }) => {
  const typeRequests: string[] = []
  page.on('request', (request) => { if (request.url().includes('/api/v2/type/')) typeRequests.push(request.url()) })
  await page.goto('#/pokemon/6')
  await page.getByRole('button', { name: '미디어 열기', exact: true }).click()
  const tools = page.getByRole('region', { name: '이로치와 울음소리', exact: true })
  await tools.getByRole('button', { name: '이로치', exact: true }).click()
  await expect(tools.getByRole('img', { name: '리자몽 · 기본 이로치', exact: true })).toHaveAttribute('src', /\/showdown\/shiny\/6.gif$/)
  const audio = tools.getByLabel('리자몽 · 기본 울음소리')
  await expect(audio).toHaveAttribute('controls', '')
  await expect(audio).toHaveAttribute('preload', 'none')
  await expect(audio).not.toHaveAttribute('autoplay')
  const audioHandle = await audio.elementHandle()
  await audio.evaluate((element: HTMLAudioElement) => { element.loop = true; return element.play() })
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0)
  await expect(tools.getByRole('list')).toHaveCount(0)
  await expect(tools.getByRole('combobox')).toHaveCount(0)
  expect(typeRequests).toEqual([])
  await tools.getByRole('button', { name: '미디어 접기' }).click()
  expect(await audioHandle!.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true)
  await expect(tools.getByRole('img')).toHaveCount(0)
})

test('메가 폼 전환 시 이전 재생을 중지하고 해당 폼의 일반·이로치·음원으로 바꾼다 (TC-11)', async ({ page }) => {
  await page.goto('#/pokemon/6')
  await page.getByRole('button', { name: '미디어 열기', exact: true }).click()
  const tools = page.getByRole('region', { name: '이로치와 울음소리', exact: true })
  await expect(tools.getByRole('img', { name: '리자몽 · 기본 일반', exact: true })).toBeVisible()
  const audio = tools.getByLabel('리자몽 · 기본 울음소리')
  const audioHandle = await audio.elementHandle()
  await audio.evaluate((element: HTMLAudioElement) => { element.loop = true; return element.play() })
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0)
  await page.getByRole('button', { name: '메가X', exact: true }).click()
  await expect(tools.getByRole('img', { name: '리자몽 · 메가X 일반', exact: true })).toHaveAttribute('src', /10034.gif$/)
  expect(await audioHandle!.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true)
  await expect(tools.getByLabel('리자몽 · 메가X 울음소리')).toHaveAttribute('src', /latest\/10034.ogg$/)
  await tools.getByRole('button', { name: '이로치', exact: true }).click()
  await expect(tools.getByRole('img', { name: '리자몽 · 메가X 이로치', exact: true })).toHaveAttribute('src', /showdown\/shiny\/10034.gif$/)
})

test('미디어 조회 실패가 상세·실전 세팅을 중단시키지 않고 재시도한다 (TC-09·11)', async ({ page }) => {
  let fail = true
  await page.goto('#/pokemon/6')
  await expect(page.getByRole('heading', { level: 1, name: '리자몽' })).toBeVisible()
  await page.route('https://pokeapi.co/api/v2/pokemon/6', (route) => fail
    ? route.fulfill({ status: 503, json: {} })
    : route.fulfill({ json: snapshot.pokemon.find((entry) => entry.id === 6) }))
  await page.getByRole('button', { name: '미디어 열기', exact: true }).click()
  await expect(page.getByText('이로치·울음소리 정보를 불러오지 못했습니다.')).toBeVisible()
  await expect(page.getByRole('heading', { name: '실전 추천 세팅', exact: true })).toBeVisible()
  fail = false
  await page.getByRole('button', { name: '미디어 다시 시도', exact: true }).click()
  await expect(page.getByRole('img', { name: '리자몽 · 기본 일반', exact: true })).toBeVisible()
})

test('모바일·키보드로 열기·이미지 전환을 조작하고 가로 넘침이 없다 (TC-08·11)', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('#/pokemon/6')
  await page.getByRole('button', { name: '미디어 열기', exact: true }).focus()
  await page.keyboard.press('Enter')
  const tools = page.getByRole('region', { name: '이로치와 울음소리', exact: true })
  await tools.getByRole('button', { name: '이로치', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(tools.getByRole('button', { name: '이로치', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(tools.getByRole('img', { name: '리자몽 · 기본 이로치', exact: true })).toBeVisible()
  await expect(tools.getByLabel('리자몽 · 기본 울음소리')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await tools.screenshot({ path: testInfo.outputPath('pokemon-media-mobile.png') })
})

test('D-1: 음원 실패·재시도에도 키보드 포커스를 유지하고 자동 재생하지 않는다 (TC-08·09·11)', async ({ page }) => {
  let fail = true
  await page.route('https://raw.githubusercontent.com/PokeAPI/cries/**', (route) => fail
    ? route.fulfill({ status: 404 })
    : route.fulfill({ contentType: 'audio/wav', path: 'tests/e2e/battle-tools/cry.wav' }))
  await page.goto('#/pokemon/6')
  await page.getByRole('button', { name: '미디어 열기', exact: true }).click()
  const tools = page.getByRole('region', { name: '이로치와 울음소리', exact: true })
  const audio = tools.getByLabel('리자몽 · 기본 울음소리')
  await audio.focus()
  await expect(audio).toBeFocused()
  await page.keyboard.press('Space')
  await expect(audio).toHaveAttribute('src', /legacy\/6.ogg$/)
  await expect(audio).toBeFocused()
  await expect(tools.getByRole('status')).toContainText('다른 음원으로 전환했습니다.')
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true)
  await page.keyboard.press('Space')
  const retry = tools.getByRole('button', { name: '울음소리 다시 시도', exact: true })
  await expect(retry).toBeFocused()
  fail = false
  await page.keyboard.press('Enter')
  await expect(audio).toHaveAttribute('src', /latest\/6.ogg$/)
  await expect(audio).toBeFocused()
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true)
  await page.keyboard.press('Space')
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0)
})

for (const [width, height] of [[161, 107], [201, 166]]) {
  test(`D-2: ${width}×${height} 이미지를 PC·320px 화면에서 원본 크기로 표시한다 (TC-08·11)`, async ({ page }, testInfo) => {
    // 보고된 메가X·Y 원본 크기를 재현하는 이미지 fixture다. 외부 GIF 가용성 검증과 구분한다.
    await page.route('https://raw.githubusercontent.com/PokeAPI/sprites/**/showdown/**', (route) => route.fulfill({
      contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#c8d0d8"/></svg>`,
    }))
    for (const viewportWidth of [1280, 320]) {
      await page.setViewportSize({ width: viewportWidth, height: 844 })
      await page.goto('#/pokemon/6?form=mega-x')
      await page.getByRole('button', { name: '미디어 열기', exact: true }).click()
      const tools = page.getByRole('region', { name: '이로치와 울음소리', exact: true })
      for (const mode of ['일반', '이로치']) {
        await tools.getByRole('button', { name: mode, exact: true }).click()
        const image = tools.getByRole('img', { name: `리자몽 · 메가X ${mode}`, exact: true })
        await expect(image).toHaveAttribute('src', /showdown\/(?:shiny\/)?10034.gif$/)
        await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(width)
        await expect.poll(async () => (await image.boundingBox())?.width).toBe(width)
        await expect.poll(async () => (await image.boundingBox())?.height).toBe(height)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (viewportWidth === 320) {
        await tools.screenshot({ path: testInfo.outputPath(`media-${width}-mobile.png`) })
        // 로드 후 가용 너비가 줄면 ResizeObserver가 같은 모드의 PNG로 대체한다.
        await tools.locator('.pokemon-tools__sprite').evaluate((element: HTMLElement) => { element.style.maxWidth = '150px' })
        await expect(tools.getByRole('img', { name: '리자몽 · 메가X 이로치', exact: true })).toHaveAttribute('src', /\/shiny\/10034.png$/)
      }
      await tools.getByRole('button', { name: '미디어 접기', exact: true }).click()
    }
  })
}
