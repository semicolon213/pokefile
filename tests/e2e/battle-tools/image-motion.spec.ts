import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import snapshot from '../../integration/battle-tools/task011-fixture.json' with { type: 'json' }

// 두 프레임이 빨강/파랑인 1px GIF. 실제 포켓몬 데이터와 구분하는 경계 조건 fixture다.
const gifPath = 'tests/e2e/battle-tools/motion.gif'
const assets = 'https://images.example.test/'
const resource = (name: string) => ({ name, url: '' })

async function mockDetail(page: Page, mode: 'gif-only' | 'all' | 'no-images' = 'gif-only') {
  const missing = mode === 'no-images'
  const raw = snapshot.pokemon.find((entry) => entry.id === 10034)!
  await page.route('https://data.pkmn.cc/sets/**', (route) => route.fulfill({ json: {} }))
  await page.route('https://pokeapi.co/api/v2/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/v2/pokemon-species/6') return route.fulfill({ json: {
      id: 6, name: 'charizard', names: [{ name: '리자몽', language: resource('ko') }], genera: [], flavor_text_entries: [], evolution_chain: null,
    } })
    if (path === '/api/v2/pokemon/charizard-mega-x') return route.fulfill({ json: {
      ...raw, height: 17, weight: 1105, abilities: [], forms: [resource(raw.name)], cries: {},
      sprites: { front_default: mode === 'all' ? assets + 'form.png' : null, front_shiny: null,
        other: { showdown: { front_default: missing ? null : assets + 'form.gif', front_shiny: null },
          home: { front_default: mode === 'all' ? assets + 'home.png' : null, front_shiny: null } } },
    } })
    return route.fulfill({ json: path.endsWith('/encounters') ? [] : {} })
  })
  await page.route(assets + '**', (route) => route.request().url().endsWith('.gif')
    ? route.fulfill({ contentType: 'image/gif', headers: { 'Access-Control-Allow-Origin': '*' }, path: gifPath })
    : route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="red"/></svg>' }))
  await page.route('https://raw.githubusercontent.com/PokeAPI/sprites/**', (route) => route.fulfill({
    contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="blue"/></svg>',
  }))
}

test('GIF 전용 폼은 움직임 줄이기 전환에도 같은 폼을 유지하고 정지 프레임을 표시한다 (TASK-028 / TC-04·08)', async ({ page }) => {
  await mockDetail(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('#/pokemon/6?form=mega-x')
  const portrait = page.getByRole('group', { name: '대표 이미지', exact: true })
  const image = portrait.getByRole('img', { name: '메가리자몽X', exact: true })
  await expect(image).toHaveAttribute('src', assets + 'form.gif')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(image).toHaveAttribute('src', /^data:image\/png/)
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1)
  const pixel = await image.evaluate((img: HTMLImageElement) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
    const context = canvas.getContext('2d')!; context.drawImage(img, 0, 0)
    return [...context.getImageData(0, 0, 1, 1).data]
  })
  expect(pixel).toEqual([255, 0, 0, 255])
  await expect(portrait.getByText('기본 모습으로 표시 중')).toHaveCount(0)
  await expect(page).toHaveURL(/form=mega-x/)
  await page.setViewportSize({ width: 320, height: 860 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.screenshot({ path: test.info().outputPath('gif-only-reduced-dark-mobile.png'), fullPage: false })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(image).toHaveAttribute('src', assets + 'form.gif')
})

test('같은 폼의 PNG·HOME을 먼저 시도하고 실패하면 같은 GIF의 정지 프레임을 사용한다', async ({ page }) => {
  await mockDetail(page, 'all')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('#/pokemon/6?form=mega-x')
  const image = page.getByRole('group', { name: '대표 이미지', exact: true }).getByRole('img')
  await expect(image).toHaveAttribute('src', assets + 'form.png')
  await page.route(assets + 'form.png', (route) => route.fulfill({ status: 404 }))
  await page.reload()
  await expect(image).toHaveAttribute('src', assets + 'home.png')
  await page.route(assets + 'home.png', (route) => route.fulfill({ status: 404 }))
  await page.reload()
  await expect(image).toHaveAttribute('src', /^data:image\/png/)
})

test('GIF 정지 프레임을 제공할 수 없으면 안내하고 기본 폼·재생 GIF로 바꾸지 않는다', async ({ page }) => {
  await mockDetail(page)
  await page.addInitScript(() => { Object.defineProperty(window, 'createImageBitmap', { value: undefined }) })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('#/pokemon/6?form=mega-x')
  const portrait = page.getByRole('group', { name: '대표 이미지', exact: true })
  await expect(portrait.getByRole('img', { name: '메가리자몽X 정적 이미지 없음', exact: true })).toBeVisible()
  await expect(portrait.locator('img')).toHaveCount(0)
  await expect(portrait.getByText('기본 모습으로 표시 중')).toHaveCount(0)
})

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`선택 폼 이미지가 전혀 없으면 기본 모습 대체를 알리고 이로치에는 사용하지 않는다 (${reducedMotion} / FR-23)`, async ({ page }) => {
    await mockDetail(page, 'no-images')
    await page.emulateMedia({ reducedMotion })
    await page.goto('#/pokemon/6?form=mega-x')
    const portrait = page.getByRole('group', { name: '대표 이미지', exact: true })
    const image = portrait.getByRole('img', { name: '메가리자몽X 대신 표시한 기본 모습', exact: true })
    await expect(image).toHaveAttribute('src', reducedMotion === 'reduce' ? /\/6.png$/ : /\/showdown\/6.gif$/)
    await expect(portrait.getByText('기본 모습으로 표시 중')).toBeVisible()
    await portrait.getByRole('switch').click()
    await expect(portrait.getByRole('img', { name: '메가리자몽X 이로치 이미지 없음', exact: true })).toBeVisible()
    await expect(portrait.locator('img')).toHaveCount(0)
    await expect(portrait.getByText('기본 모습으로 표시 중')).toHaveCount(0)
  })
}
