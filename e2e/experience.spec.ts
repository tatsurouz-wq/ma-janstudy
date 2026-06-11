import { expect, test } from '@playwright/test'

test.describe('3D実戦体験モード', () => {
  test.setTimeout(120000)

  test('読み込み後に再生が進行し、字幕とHUDが機能する', async ({ page }) => {
    await page.goto('/#/experience')

    await expect(page.locator('canvas')).toBeVisible({ timeout: 60000 })
    await expect(page.getByRole('button', { name: /一時停止/ })).toBeVisible()

    await expect(
      page.getByText('全自動麻雀卓の実戦体験へようこそ', { exact: false }),
    ).toBeVisible({ timeout: 20000 })

    const progressFill = page.locator('.bg-gold-500').first()
    await expect
      .poll(
        async () => {
          const width = await progressFill.evaluate(
            (el) => (el as HTMLElement).style.width,
          )
          return parseFloat(width)
        },
        { timeout: 30000 },
      )
      .toBeGreaterThan(1)

    await page.getByRole('button', { name: /一時停止/ }).click()
    await expect(page.getByRole('button', { name: /再生/ })).toBeVisible()

    await page.getByRole('button', { name: '字幕' }).click()
    await page.getByRole('button', { name: '字幕' }).click()

    await page.getByRole('button', { name: 'チャプター ▾' }).click()
    await expect(page.getByRole('button', { name: '和了', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '和了', exact: true }).click()

    await expect(page.getByText(/和了！/)).toBeVisible({ timeout: 20000 })
  })

  test('配牌チャプターで「親は14枚」の学習字幕が出る', async ({ page }) => {
    await page.goto('/#/experience')
    await expect(page.locator('canvas')).toBeVisible({ timeout: 60000 })

    await page.getByRole('button', { name: 'チャプター ▾' }).click()
    await page.getByRole('button', { name: '配牌', exact: true }).click()

    await expect(
      page.getByText('親は14枚、子は13枚', { exact: false }),
    ).toBeVisible({ timeout: 25000 })
  })
})
