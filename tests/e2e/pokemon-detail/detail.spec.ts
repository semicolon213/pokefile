import { expect, test } from '@playwright/test'

// TASK-005·006: 실제 PokéAPI로 상세 화면 확인 (네트워크 필요, TC-04·05)
test.describe('포켓몬 상세', () => {
  test('리자몽 기본 정보·종족값·진화를 표시하고 메가X 탭으로 전환한다', async ({ page }) => {
    await page.goto('#/pokemon/6')
    await expect(page.getByRole('heading', { level: 1, name: '리자몽' })).toBeVisible()
    await expect(page.getByText('화염포켓몬')).toBeVisible()
    await expect(page.getByRole('row', { name: '특수공격 109', exact: true })).toBeVisible()
    const evolution = page.locator('section', { has: page.getByRole('heading', { name: '진화' }) })
    await expect(evolution.getByRole('link', { name: /파이리/ })).toBeVisible()

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

  test('출현 장소를 6세대 이하 게임별로 표시한다', async ({ page }) => {
    await page.goto('#/pokemon/25')
    await expect(page.getByRole('region', { name: '레드 출현 장소', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: /썬|소드/ })).toHaveCount(0)
  })

  test('#722 이후 진화형은 진화 트리에 표시하지 않는다 (절각참의 킹갬브릿 #983 제외)', async ({ page }) => {
    await page.goto('#/pokemon/625')
    const evolution = page.locator('section', { has: page.getByRole('heading', { name: '진화' }) })
    await expect(evolution.getByRole('link', { name: /자망칼/ })).toBeVisible()
    await expect(evolution.getByRole('link', { name: /#0983/ })).toHaveCount(0)
  })
})
