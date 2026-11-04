import { expect, test } from '@playwright/test'

// FR-26: 내 게임을 고르면 출현 장소가 그 게임 기준으로 표시되고, 새로고침 후에도 유지된다 (실제 PokéAPI)
test('내 게임 선택이 출현 장소에 반영되고 유지된다', async ({ page }) => {
  await page.goto('#/pokemon/25')
  const encounters = page.getByRole('region', { name: '출현 정보' })
  await expect(encounters.getByRole('region', { name: '골드 출현 장소', exact: true })).toBeVisible({ timeout: 20000 })

  await page.getByRole('combobox', { name: '내 게임' }).selectOption('red')
  await expect(page).toHaveURL(/game=red/)
  await expect(encounters.getByText('내 게임 레드 기준입니다.')).toBeVisible()
  await expect(encounters.getByRole('region', { name: '레드 출현 장소', exact: true })).toBeVisible()
  await expect(encounters.getByRole('region', { name: '골드 출현 장소', exact: true })).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole('combobox', { name: '내 게임' })).toHaveValue('red')
  await expect(encounters.getByRole('region', { name: '골드 출현 장소', exact: true })).toHaveCount(0)

  await encounters.getByRole('button', { name: '모든 게임 보기' }).click()
  await expect(encounters.getByRole('region', { name: '골드 출현 장소', exact: true })).toBeVisible()
})

// QA D-014-01: 상세에서 게임을 바꾼 뒤 뒤로 가기·'도감 목록으로'를 해도 직접 고른 선택이 유지된다
test('게임을 바꾼 뒤 뒤로 가기·목록 링크로 돌아와도 선택을 유지한다', async ({ page }) => {
  await page.goto('#/')
  const select = page.getByRole('combobox', { name: '내 게임' })
  await select.selectOption('red')
  await expect(page).toHaveURL(/#\/\?game=red$/)
  await page.getByRole('article').first().getByRole('link').click()
  await expect(page).toHaveURL(/#\/pokemon\/1\?game=red$/)

  await select.selectOption('x')
  await expect(page).toHaveURL(/#\/pokemon\/1\?game=x$/)
  await page.goBack()
  await expect(page).toHaveURL(/#\/\?game=x$/)
  await expect(select).toHaveValue('x')
  expect(await page.evaluate(() => localStorage.getItem('pokefile:my-game'))).toBe('x')

  // 기억해 둔 목록 주소(?game=…)로 돌아가는 '도감 목록으로'도 선택을 되돌리지 않는다
  await page.getByRole('article').first().getByRole('link').click()
  await select.selectOption('gold')
  await page.getByRole('link', { name: '도감 목록으로' }).click()
  await expect(page).toHaveURL(/game=gold/)
  await expect(select).toHaveValue('gold')
})
