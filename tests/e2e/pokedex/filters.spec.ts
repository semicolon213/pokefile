import { expect, test } from '@playwright/test'

// TASK-004: 실제 1025종 인덱스로 필터·정렬·URL 유지·무한 스크롤 확인
test.describe('도감 필터·정렬·무한 스크롤', () => {
  test('필터·정렬이 URL에 저장되고 새로고침 후에도 유지된다', async ({ page }) => {
    await page.goto('#/')
    await expect(page.getByText('1025마리의 포켓몬')).toBeVisible()

    await page.getByRole('navigation', { name: '세대별 보기' }).getByRole('button', { name: /6세대/ }).click()
    await page.getByRole('button', { name: '페어리' }).click()
    await page.getByRole('combobox', { name: '정렬' }).selectOption('name')
    await expect(page).toHaveURL(/#\/\?type=fairy&gen=6&sort=name$/)
    const count = page.getByText(/^검색 결과 \d+마리$/)
    const before = await count.textContent()

    await page.reload()
    await expect(page.getByText(before ?? '')).toBeVisible()
    await expect(page.getByRole('button', { name: '페어리' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('combobox', { name: '정렬' })).toHaveValue('name')
  })

  test('목록 끝까지 스크롤하면 버튼 없이 다음 카드가 추가된다', async ({ page }) => {
    await page.goto('#/')
    const cards = page.getByRole('article')
    await expect(cards).toHaveCount(24)
    await expect(page.getByRole('button', { name: /더 보기/ })).toHaveCount(0)
    await page.getByText('포켓몬을 더 불러오는 중입니다.').scrollIntoViewIfNeeded()
    await expect(cards).toHaveCount(48)
  })

  test('상세에서 뒤로 가면 필터 상태가 유지된다', async ({ page }) => {
    await page.goto('#/?type=electric')
    await page.getByRole('link', { name: /피카츄/ }).click()
    await expect(page).toHaveURL(/#\/pokemon\/25$/)
    await page.goBack()
    await expect(page).toHaveURL(/#\/\?type=electric$/)
    await expect(page.getByRole('button', { name: '전기' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('지방을 고르면 그 지방 도감 전체를 지방 번호 순으로 보여 준다 (FR-31)', async ({ page }) => {
    await page.goto('#/?gen=2')
    // 하트골드·소울실버 성도 도감 256마리 (1세대 포켓몬 포함)
    await expect(page.getByText('검색 결과 256마리')).toBeVisible()
    const first = page.getByRole('article').first()
    await expect(first).toContainText('성도 #001')
    await expect(first).toContainText('치코리타')
    await expect(page.getByText(/성도지방 도감 전체 · 하트골드·소울실버 기준/)).toBeVisible()
    await page.getByRole('combobox', { name: '내 게임' }).selectOption('gold')
    await expect(page.getByText('검색 결과 251마리')).toBeVisible()
  })
})
