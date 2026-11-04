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
