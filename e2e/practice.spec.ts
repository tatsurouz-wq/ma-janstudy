import { expect, test } from '@playwright/test'

test('ミニ実戦: 対局を開始して打牌できる', async ({ page }) => {
  await page.goto('/#/practice')
  await expect(
    page.getByRole('heading', { name: 'ミニ実戦（一人打ち）' }),
  ).toBeVisible()

  await page.getByRole('button', { name: /かんたん/ }).click()
  await page.getByRole('button', { name: '対局開始' }).click()

  await expect(page.getByText(/残りツモ/)).toBeVisible()
  await expect(page.getByText(/向聴|テンパイ/).first()).toBeVisible({
    timeout: 10000,
  })

  const handTiles = page.locator('button[aria-label$="を選ぶ"]')
  await expect(handTiles.first()).toBeVisible()

  const firstTile = handTiles.first()
  await firstTile.click()
  await page.locator('button[aria-label*="確定"]').first().click()

  await expect(
    page.locator('[aria-label="河（捨て牌）"] svg').first(),
  ).toBeVisible()
})
