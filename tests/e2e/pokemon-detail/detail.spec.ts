import { expect, test } from '@playwright/test'

// TASK-005: 실제 PokéAPI로 상세 화면 확인 (네트워크 필요, TC-04)
test.describe('포켓몬 상세', () => {
  test('리자몽 기본 정보·종족값을 표시하고 메가X 탭으로 전환한다', async ({ page }) => {
    await page.goto('#/pokemon/6')
    await expect(page.getByRole('heading', { level: 1, name: '리자몽' })).toBeVisible()
    await expect(page.getByText('화염포켓몬')).toBeVisible()
    await expect(page.getByRole('row', { name: '특수공격 109', exact: true })).toBeVisible()

    await page.getByRole('button', { name: '메가X' }).click()
    await expect(page).toHaveURL(/#\/pokemon\/6\?form=mega-x$/)
    await expect(page.getByText('메가리자몽X')).toBeVisible()
    await expect(page.getByText('드래곤')).toBeVisible()
    await expect(page.getByRole('row', { name: '공격 130', exact: true })).toBeVisible()
  })

  test('잘못된 ?form= 값은 기본 폼을 보여준다', async ({ page }) => {
    await page.goto('#/pokemon/6?form=wrong')
    await expect(page.getByRole('button', { name: '기본' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('비행')).toBeVisible()
  })
})
