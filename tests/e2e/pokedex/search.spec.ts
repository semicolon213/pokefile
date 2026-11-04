import { expect, test } from '@playwright/test'

// TASK-003: 실제 정적 인덱스(public/data/pokedex-index.json)로 검색 → 상세 이동
test.describe('도감 검색', () => {
  test('721종 전체 목록을 불러온다', async ({ page }) => {
    await page.goto('#/')
    await expect(page.getByText('721마리의 포켓몬')).toBeVisible()
  })

  for (const query of ['피카츄', 'Pikachu', '25']) {
    test(`"${query}" 검색 후 카드를 눌러 상세로 이동한다`, async ({ page }) => {
      await page.goto('#/')
      await page.getByRole('searchbox', { name: '포켓몬 검색' }).fill(query)
      await page.getByRole('button', { name: '검색' }).click()
      await expect(page.getByText('검색 결과 1마리')).toBeVisible()
      await page.getByRole('link', { name: /피카츄/ }).click()
      await expect(page).toHaveURL(/#\/pokemon\/25$/)
      await expect(page.getByRole('heading', { level: 1, name: '피카츄' })).toBeVisible()
    })
  }

  test('입력할 때마다 결과가 바뀌고, 상세에서 입력하면 목록으로 와서 계속 입력할 수 있다 (ADR-011 개정)', async ({ page }) => {
    await page.goto('#/pokemon/6')
    await expect(page.getByRole('heading', { level: 1, name: '리자몽' })).toBeVisible()
    const input = page.getByRole('searchbox', { name: '포켓몬 검색' })
    await input.pressSequentially('피카')
    await expect(page).toHaveURL(/#\/\?q=%ED%94%BC%EC%B9%B4/)
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('피카')
    await input.pressSequentially('츄')
    await expect(page.getByText('검색 결과 1마리')).toBeVisible()
    // 입력 중에는 기록을 쌓지 않으므로 뒤로 가기 한 번이면 상세로 돌아간다
    await page.goBack()
    await expect(page).toHaveURL(/#\/pokemon\/6$/)
  })

  test('즐겨찾기 버튼은 카드 이동을 일으키지 않는다', async ({ page }) => {
    await page.goto('#/')
    await page.getByRole('searchbox', { name: '포켓몬 검색' }).fill('피카츄')
    await page.getByRole('searchbox', { name: '포켓몬 검색' }).press('Enter')
    // TASK-008에서 버튼이 활성화되고 라벨이 '#0025 즐겨찾기 추가/해제'로 바뀌었다 (DESIGN.md §3.4)
    const favorite = page.getByRole('button', { name: '#0025 즐겨찾기 추가' })
    await favorite.click()
    await expect(page.getByRole('button', { name: '#0025 즐겨찾기 해제' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page).not.toHaveURL(/#\/pokemon\//)
    await expect(page.getByRole('heading', { level: 1, name: '포켓몬 도감' })).toBeVisible()
  })
})
