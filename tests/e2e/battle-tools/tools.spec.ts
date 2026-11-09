import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
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

async function mockLargeSprite(page: Page, width: number, height: number) {
  // 외부 GIF 가용성 검증과 구분하고, 보고된 GIF/PNG 원본 크기를 재현한다.
  await page.route('https://raw.githubusercontent.com/PokeAPI/sprites/**', (route) => {
    const animated = route.request().url().includes('/showdown/')
    return route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${animated ? width : 96}" height="${animated ? height : 96}"><rect width="100%" height="100%" fill="#c8d0d8"/></svg>`,
    })
  })
}

async function expectMediaContained(tools: Locator) {
  await expect.poll(() => tools.evaluate((region) => {
    const bounds = region.getBoundingClientRect()
    const visible = [region, ...region.querySelectorAll('*')].filter((element) => element.getClientRects().length > 0)
    return {
      inViewport: bounds.left >= 0 && bounds.right <= innerWidth,
      contentFits: visible.every((element) => {
        const rect = element.getBoundingClientRect()
        return element.scrollWidth <= element.clientWidth + 1 && rect.left >= bounds.left && rect.right <= bounds.right
      }),
    }
  })).toEqual({ inViewport: true, contentFits: true })
}

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

test('대표 이미지 토글과 이미지 아래 울음소리를 제공하고 화면 이동 시 재생을 멈춘다 (FR-23 / TC-11)', async ({ page }) => {
  let pokemonRequests = 0
  let cryRequests = 0
  page.on('request', (request) => {
    if (request.url() === 'https://pokeapi.co/api/v2/pokemon/6') pokemonRequests++
    if (request.url().includes('/PokeAPI/cries/')) cryRequests++
  })
  await page.goto('#/pokemon/6')
  const portrait = page.getByRole('group', { name: '대표 이미지', exact: true })
  const toggle = portrait.getByRole('switch', { name: '이로치', exact: true })
  await expect(portrait.getByRole('img')).toHaveAttribute('src', /\/showdown\/6.gif$/)
  const before = pokemonRequests
  await toggle.focus()
  await page.keyboard.press('Space')
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await expect(portrait.getByRole('img', { name: '리자몽 이로치', exact: true })).toHaveAttribute('src', /\/showdown\/shiny\/6.gif$/)
  expect(pokemonRequests).toBe(before)
  expect(cryRequests).toBe(0)
  await expect(portrait.getByRole('img')).toHaveCount(1)
  await expect(page.getByRole('region', { name: '울음소리', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '울음소리 열기', exact: true })).toHaveCount(0)
  const audio = portrait.getByLabel('리자몽 울음소리')
  await expect(audio).toHaveAttribute('preload', 'none')
  await expect(audio).not.toHaveAttribute('autoplay')
  const imageBox = await portrait.locator('.pokemon-portrait__image').boundingBox()
  const audioBox = await audio.boundingBox()
  expect(audioBox!.y).toBeGreaterThanOrEqual(imageBox!.y + imageBox!.height)
  expect(audioBox!.width).toBeLessThanOrEqual(imageBox!.width)
  const handle = await audio.elementHandle()
  await audio.evaluate((element: HTMLAudioElement) => { element.loop = true; return element.play() })
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0)
  await toggle.click()
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(false)
  await page.getByRole('link', { name: '도감 목록으로', exact: true }).click()
  await expect.poll(() => handle!.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true)
})

test('폼 변경 시 대표 이미지는 일반으로 초기화되고 이전 울음소리는 중지된다 (TC-11)', async ({ page }) => {
  await page.goto('#/pokemon/6')
  const portrait = page.getByRole('group', { name: '대표 이미지', exact: true })
  await portrait.getByRole('switch').click()
  const audio = portrait.locator('audio')
  const handle = await audio.elementHandle()
  await audio.evaluate((element: HTMLAudioElement) => { element.loop = true; return element.play() })
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0)
  await page.getByRole('button', { name: '메가X', exact: true }).click()
  await expect(portrait.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  await expect(portrait.getByRole('img')).toHaveAttribute('src', /showdown\/10034.gif$/)
  expect(await handle!.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true)
  await expect(audio).toHaveAttribute('src', /latest\/10034.ogg$/)
  await portrait.getByRole('switch').click()
  await expect(portrait.getByRole('img')).toHaveAttribute('src', /showdown\/shiny\/10034.gif$/)
  await expect(portrait.getByRole('img')).toHaveAttribute('alt', /이로치$/)
})

test('울음소리가 없어도 대표 이미지 토글·상세·실전 세팅은 유지된다 (TC-09·11)', async ({ page }) => {
  const raw = snapshot.pokemon.find((entry) => entry.id === 6)!
  await page.route('https://pokeapi.co/api/v2/pokemon/6', (route) => route.fulfill({ json: {
    ...raw, height: 17, weight: 905, abilities: [], forms: [resource(raw.name)], cries: {},
  } }))
  await page.goto('#/pokemon/6')
  const portrait = page.getByRole('group', { name: '대표 이미지', exact: true })
  await expect(portrait.getByText('울음소리 정보 없음')).toBeVisible()
  await expect(portrait.locator('audio')).toHaveCount(0)
  await portrait.getByRole('switch').click()
  await expect(portrait.getByRole('img')).toHaveAttribute('src', /shiny\/6.gif$/)
  await expect(page.getByRole('heading', { name: '실전 추천 세팅', exact: true })).toBeVisible()
})

test('모바일에서 이미지 토글과 이미지 아래 울음소리를 키보드로 조작한다 (TC-08·11)', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('#/pokemon/6')
  const portrait = page.getByRole('group', { name: '대표 이미지', exact: true })
  await portrait.getByRole('switch').focus()
  await page.keyboard.press('Enter')
  await expect(portrait.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  await expect(portrait.getByRole('img')).toHaveAttribute('src', /shiny\/6.gif$/)
  const audio = portrait.getByLabel('리자몽 울음소리')
  await audio.focus()
  await page.keyboard.press('Space')
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0)
  await expectMediaContained(portrait)
  await portrait.screenshot({ path: testInfo.outputPath('portrait-mobile.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('D-1: 이미지 아래 음원 실패·재시도에서 포커스를 유지하고 자동 재생하지 않는다 (TC-08·09·11)', async ({ page }) => {
  let fail = true
  await page.route('https://raw.githubusercontent.com/PokeAPI/cries/**', (route) => fail
    ? route.fulfill({ status: 404 })
    : route.fulfill({ contentType: 'audio/wav', path: 'tests/e2e/battle-tools/cry.wav' }))
  await page.goto('#/pokemon/6')
  const portrait = page.getByRole('group', { name: '대표 이미지', exact: true })
  const audio = portrait.getByLabel('리자몽 울음소리')
  await audio.focus()
  await page.keyboard.press('Space')
  await expect(audio).toHaveAttribute('src', /legacy\/6.ogg$/)
  await expect(audio).toBeFocused()
  await expect(portrait.getByRole('status')).toContainText('다른 음원으로 전환했습니다.')
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true)
  await page.keyboard.press('Space')
  await expect(portrait.getByRole('button', { name: '울음소리 다시 시도', exact: true })).toBeFocused()
  fail = false
  await page.keyboard.press('Enter')
  await expect(audio).toHaveAttribute('src', /latest\/6.ogg$/)
  await expect(audio).toBeFocused()
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true)
  await page.keyboard.press('Space')
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0)
})
for (const [width, height] of [[161, 107], [201, 166]]) {
  test(`D-2: ${width}×${height} 대표 이미지를 전환하고 축소 시 같은 모드 PNG로 대체한다 (TC-08·11)`, async ({ page }, testInfo) => {
    await mockLargeSprite(page, width, height)
    for (const viewportWidth of [1280, 320]) {
      await page.setViewportSize({ width: viewportWidth, height: 844 })
      await page.goto('#/pokemon/6?form=mega-x')
      await page.reload()
      const portrait = page.getByRole('group', { name: '대표 이미지', exact: true })
      for (const shiny of [false, true]) {
        const toggle = portrait.getByRole('switch')
        await expect(toggle).toBeVisible()
        if ((await toggle.getAttribute('aria-checked') === 'true') !== shiny) await toggle.click()
        const image = portrait.getByRole('img')
        await expect(image).toHaveAttribute('src', shiny ? /showdown\/shiny\/10034.gif$/ : /showdown\/10034.gif$/)
        await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(width)
        await expect.poll(async () => (await image.boundingBox())?.width).toBe(width)
        await expect.poll(async () => (await image.boundingBox())?.height).toBe(height)
        await expectMediaContained(portrait)
      }
      if (viewportWidth === 320) {
        await portrait.screenshot({ path: testInfo.outputPath(`portrait-${width}-mobile.png`) })
        await portrait.locator('.pokemon-portrait__image').evaluate((element: HTMLElement) => { element.style.maxWidth = '150px' })
        await expect(portrait.getByRole('img')).toHaveAttribute('src', /\/shiny\/10034.png$/)
        await expect.poll(async () => (await portrait.getByRole('img').boundingBox())?.width).toBe(96)
        await expectMediaContained(portrait)
      }
    }
  })

  test(`페이지 통합: ${width}×${height} 대표 이미지의 PC·320px 문서 가로 넘침을 검사한다 (TC-08)`, async ({ page }) => {
    await mockLargeSprite(page, width, height)
    for (const viewportWidth of [1280, 320]) {
      await page.setViewportSize({ width: viewportWidth, height: 844 })
      await page.goto('#/pokemon/6?form=mega-x')
      await page.reload()
      const portrait = page.getByRole('group', { name: '대표 이미지', exact: true })
      for (const shiny of [false, true]) {
        const toggle = portrait.getByRole('switch')
        await expect(toggle).toBeVisible()
        if ((await toggle.getAttribute('aria-checked') === 'true') !== shiny) await toggle.click()
        await expect(portrait.getByRole('img')).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    }
  })
}

test('PC의 좁은 대표 이미지 영역에서도 토글과 이미지가 경계 안에 들어온다 (TC-08·11)', async ({ page }) => {
  await mockLargeSprite(page, 201, 166)
  await page.setViewportSize({ width: 1280, height: 844 })
  await page.goto('#/pokemon/6?form=mega-x')
  const portrait = page.getByRole('group', { name: '대표 이미지', exact: true })
  await expect(portrait.getByRole('img')).toHaveAttribute('src', /showdown\/10034.gif$/)
  await portrait.evaluate((element: HTMLElement) => { element.style.width = '180px' })
  await expect(portrait.getByRole('img')).toHaveAttribute('src', /\/10034.png$/)
  await expectMediaContained(portrait)
  await portrait.evaluate((element: HTMLElement) => { element.style.width = '216px' })
  await expect.poll(async () => (await portrait.getByRole('img').boundingBox())?.width).toBe(192)
  await expectMediaContained(portrait)
})
