import { expect, test } from '@playwright/test'

test('点数計算機: 平和ツモを入力すると2翻20符 400/700 が表示される', async ({
  page,
}) => {
  await page.goto('/#/calculator')
  await expect(page.getByRole('heading', { name: '点数計算機' })).toBeVisible()

  const picker = page.getByRole('group', { name: '牌を選ぶ' })
  const sequence = [
    '二萬',
    '三萬',
    '四萬',
    '四筒',
    '五筒',
    '六筒',
    '七索',
    '八索',
    '九索',
    '四索',
    '五索',
    '五索',
    '五索',
    '三索',
  ]
  for (const label of sequence) {
    await picker.getByRole('button', { name: label, exact: true }).first().click()
  }

  await page.getByRole('button', { name: 'ツモ', exact: true }).click()

  await expect(page.getByText('20符2翻')).toBeVisible()
  await expect(page.getByText('親から700点、他の子から400点ずつ')).toBeVisible()
  await expect(page.getByText('平和（1翻）', { exact: false })).toBeVisible()
})

test('点数計算機: 役なしの手はエラーメッセージを表示する', async ({ page }) => {
  await page.goto('/#/calculator')
  const picker = page.getByRole('group', { name: '牌を選ぶ' })
  const sequence = [
    '二萬',
    '三萬',
    '四萬',
    '四筒',
    '五筒',
    '六筒',
    '七索',
    '八索',
    '九索',
    '西',
    '西',
    '西',
    '四筒',
    '四筒',
  ]
  for (const label of sequence) {
    await picker.getByRole('button', { name: label, exact: true }).first().click()
  }
  await expect(page.getByText('役がありません', { exact: false })).toBeVisible()
})
