import { expect, test } from '@playwright/test'

test('レッスン: 第1章のステップを操作しながら進められる', async ({ page }) => {
  await page.goto('/#/lessons')
  await expect(page.getByRole('heading', { name: 'レッスン' })).toBeVisible()

  await page.getByRole('link', { name: /牌を知る/ }).click()
  await expect(page.getByText('ステップ 1 / 5')).toBeVisible()

  await page.getByRole('button', { name: '次へ ▸' }).click()
  await expect(page.getByText('仕分けてみましょう')).toBeVisible()

  const nextButton = page.getByRole('button', { name: '次へ ▸' })
  await expect(nextButton).toBeDisabled()

  const zoneFor = (label: string): string =>
    label.includes('萬')
      ? 'マンズ'
      : label.includes('筒')
        ? 'ピンズ'
        : label.includes('索')
          ? 'ソーズ'
          : 'ジハイ'

  for (let i = 0; i < 8; i += 1) {
    const tile = page
      .locator('.felt-surface button[aria-label]')
      .first()
    const count = await page.locator('.felt-surface button[aria-label]').count()
    if (count === 0) {
      break
    }
    const label = (await tile.getAttribute('aria-label')) ?? ''
    await tile.click()
    await page
      .getByRole('button', { name: new RegExp(zoneFor(label)) })
      .click()
  }

  await expect(page.getByText('すべて仕分けできました')).toBeVisible()
  await expect(nextButton).toBeEnabled()
})
