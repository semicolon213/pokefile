// 다중 세대 설정(모의 적용) 빌드 + 실제 data.pkmn.cc 응답으로 화면 확인
import { createRequire } from 'node:module'
import path from 'node:path'
const req = createRequire(path.join(process.argv[2], 'package.json'))
const { chromium } = req('@playwright/test')
const BASE = 'http://localhost:4176/pokefile/#'
const browser = await chromium.launch()
async function read(route, { width = 1280, keyboard = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } })
  const page = await ctx.newPage()
  const gens = []
  page.on('request', (r) => { const g = /sets\/gen(\d+)\.json/.exec(r.url())?.[1]; if (g) gens.push(+g) })
  await page.goto(`${BASE}${route}`)
  const sec = page.getByRole('region', { name: '실전 추천 세팅' })
  await page.waitForFunction(() => {
    const s = document.querySelector('.smogon-section'); return s && !s.textContent.includes('불러오는 중') && !s.textContent.includes('확인하는 중')
  }, null, { timeout: 30000 }).catch(() => {})
  const tabs = await sec.getByRole('tab').allTextContents()
  const selected = await sec.locator('[role=tab][aria-selected=true]').textContent().catch(() => null)
  const alerts = await sec.getByRole('alert').allTextContents()
  const empty = (await sec.textContent()).includes('등록된 실전 세팅이 없습니다')
  let formats = []
  if (tabs.length) formats = (await sec.locator('select option').allTextContents()).slice(1)
  let out = `${route} ${width}px | 탭 [${tabs.join(',')}] 선택=${selected} | 포맷 ${formats.length}개 (${formats.slice(0, 6).join(',')}${formats.length > 6 ? '…' : ''}) | 오류 ${alerts.length} | 부재안내 ${empty} | 요청 gen[${[...new Set(gens)].sort().join(',')}]`
  if (tabs.length && formats.length) {
    await sec.getByRole('combobox').selectOption({ index: 1 })
    const cards = await sec.getByRole('article').count()
    out += ` | 첫 포맷 세팅카드 ${cards}`
  }
  if (keyboard && tabs.length > 1) {
    await sec.locator('[role=tab][aria-selected=true]').focus()
    await page.keyboard.press('End')
    out += ` | End→ ${await page.evaluate(() => document.activeElement?.textContent)} 선택=${await sec.locator('[role=tab][aria-selected=true]').textContent()}`
    await page.keyboard.press('ArrowRight')
    out += ` | →(순환) ${await page.evaluate(() => document.activeElement?.textContent)}`
  }
  out += ` | 가로넘침 ${await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)}`
  if (process.argv[3]) await sec.screenshot({ path: path.join(process.argv[3], `smogon-${route.replace(/[^a-z0-9]/gi, '_')}-${width}.png`) })
  await ctx.close()
  return out
}
for (const [route, opt] of [
  ['/pokemon/6'], ['/pokemon/6?form=mega-x'], ['/pokemon/384'], ['/pokemon/384?form=mega'], ['/pokemon/26?form=alola'],
  ['/pokemon/1017?form=wellspring-mask'], ['/pokemon/800?form=dusk'], ['/pokemon/26?form=mega-x'], ['/pokemon/1025'], ['/pokemon/10'],
  ['/pokemon/6', { width: 320, keyboard: true }], ['/pokemon/384', { width: 320 }],
]) {
  try { console.log(await read(route, opt)) } catch (e) { console.log(route, 'ERROR', e.message.split('\n')[0]) }
}
await browser.close()
