import { expect, test } from '@playwright/test'

// TASK-021 타입 상성 (FR-24)
test.describe('타입 상성', () => {
  test('상단 메뉴에서 열고, 방어 타입을 고르면 받는 피해를 계산한다', async ({ page }) => {
    await page.goto('#/')
    await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '타입 상성' }).click()
    await expect(page).toHaveURL(/#\/types$/)
    await expect(page.getByRole('heading', { level: 1, name: '타입 상성' })).toBeVisible()
    const picker = page.getByRole('group', { name: '방어 타입' })
    await picker.getByRole('button', { name: '강철' }).click()
    await picker.getByRole('button', { name: '페어리' }).click()
    await expect(page).toHaveURL(/type=steel&type=fairy/)
    await expect(page.getByRole('heading', { name: '강철·페어리 타입이 받는 피해' })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('상세에서 폼 타입 기준 상성을 보여 주고 전체 상성표로 이동한다', async ({ page }) => {
    await page.goto('#/pokemon/6')
    const section = page.getByRole('region', { name: '타입 상성' })
    await expect(section.getByText('불꽃·비행 타입이 받는 피해')).toBeVisible()
    await section.getByRole('link', { name: '전체 상성표' }).click()
    await expect(page).toHaveURL(/#\/types\?type=fire&type=flying$/)
    // 메가리자몽X는 불꽃·드래곤
    await page.goto('#/pokemon/6?form=mega-x')
    await expect(page.getByRole('region', { name: '타입 상성' }).getByText('불꽃·드래곤 타입이 받는 피해')).toBeVisible()
  })
})
