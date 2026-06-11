import { expect, test } from '@playwright/test'

test('クイズ: 待ち当てに回答して次の問題へ進める', async ({ page }) => {
  await page.goto('/#/quiz')
  await expect(page.getByRole('heading', { name: 'クイズ' })).toBeVisible()

  await page.getByRole('link', { name: /待ち当て/ }).click()
  await expect(page.getByText('問 1 / 8')).toBeVisible()

  const palette = page.locator('.hairline button[aria-label]').first()
  await palette.click()
  await page.getByRole('button', { name: '決定' }).click()

  await expect(
    page.getByText(/^(正解|不正解)$/).first(),
  ).toBeVisible()
  await page.getByRole('button', { name: '次の問題へ' }).click()
  await expect(page.getByText('問 2 / 8')).toBeVisible()
})

test('クイズ: 点数当ては4択で解説ステップを開ける', async ({ page }) => {
  await page.goto('/#/quiz/score')
  await expect(page.getByText('問 1 / 8')).toBeVisible()

  await page.locator('button.tabular-nums').first().click()
  await expect(page.getByText('計算過程をステップで見る')).toBeVisible()
  await page.getByText('計算過程をステップで見る').click()
  await expect(page.getByLabel('計算過程').locator('li').first()).toBeVisible()
})
