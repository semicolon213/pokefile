import { expect, test } from '@playwright/test'

// TASK-015: 실제 PokéAPI로 기술 표 확인 (네트워크 필요, FR-26·27, TC-12)
test.describe('기술 표', () => {
  test('리자몽 기술 표: 최신 게임 레벨업, 기술머신 번호, 게임 전환', async ({ page }) => {
    await page.goto('#/pokemon/6')
    const moves = page.getByRole('region', { name: '기술', exact: true })
    const game = moves.getByRole('combobox', { name: '게임' })
    await expect(game).toHaveValue('legends-za', { timeout: 20000 })
    await expect(moves.getByRole('table', { name: 'LEGENDS Z-A 레벨업 기술' })).toBeVisible()

    await game.selectOption('scarlet-violet')
    const levelUp = moves.getByRole('table', { name: '스칼렛·바이올렛 레벨업 기술' })
    await expect(levelUp.getByRole('row', { name: /^진화 에어슬래시/ })).toBeVisible()
    await moves.getByRole('button', { name: /기술머신/ }).click()
    await expect(moves.getByRole('row', { name: /^기술머신 125 화염방사 불꽃 특수 90 100 15$/ })).toBeVisible()
  })

  test('내 게임 레드를 고르면 레드·블루 기술 표로 시작한다', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pokefile:my-game', 'red'))
    await page.goto('#/pokemon/6')
    const moves = page.getByRole('region', { name: '기술', exact: true })
    await expect(moves.getByText('내 게임 레드 기준입니다.')).toBeVisible({ timeout: 20000 })
    await expect(moves.getByRole('combobox', { name: '게임' })).toHaveValue('red-blue')
    await moves.getByRole('button', { name: /기술머신/ }).click()
    await expect(moves.getByRole('row', { name: /^비전머신 01 풀베기/ })).toBeVisible()
  })

  test('390px에서 페이지가 가로로 넘치지 않는다 (NFR-01)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('#/pokemon/6')
    await expect(page.getByRole('region', { name: '기술', exact: true }).getByRole('table')).toBeVisible({ timeout: 20000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})
