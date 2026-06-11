import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import type { CalculationStep } from '@/core/score/types'
import { StepPlayer } from './StepPlayer'

afterEach(cleanup)

const STEPS: readonly CalculationStep[] = [
  { kind: 'parse', text: '手牌を分解: 一萬からの順子、雀頭は白' },
  { kind: 'yaku', text: '平和（1翻）: すべて順子', yakuId: 'pinfu' },
  { kind: 'dora', text: 'ドラ1で合計1翻を加算' },
  { kind: 'fuItem', text: '副底: +20符（基本の符）', itemIndex: 0 },
  { kind: 'fuRound', text: '符の合計は20符（固定）' },
  { kind: 'base', text: '基本点: 20 × 2^4 = 320' },
  { kind: 'limit', text: '満貫が適用されます' },
  { kind: 'payment', text: 'ロン: 放銃した人から8,000点' },
]

describe('StepPlayer', () => {
  it('全ステップがテキスト付きで一覧表示される', () => {
    render(<StepPlayer steps={STEPS} />)
    const list = screen.getByRole('list', { name: '計算過程' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(STEPS.length)
    for (const step of STEPS) {
      expect(screen.getByText(step.text)).toBeInTheDocument()
    }
  })

  it('種別ラベルが表示される', () => {
    render(<StepPlayer steps={STEPS} />)
    expect(screen.getByText('分解')).toBeInTheDocument()
    expect(screen.getByText('役')).toBeInTheDocument()
    expect(screen.getByText('ドラ')).toBeInTheDocument()
    expect(screen.getAllByText('符')).toHaveLength(2)
    expect(screen.getAllByText('点数')).toHaveLength(2)
    expect(screen.getByText('支払い')).toBeInTheDocument()
  })

  it('animated=false でも全ステップが表示される', () => {
    render(<StepPlayer steps={STEPS} animated={false} />)
    const list = screen.getByRole('list', { name: '計算過程' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(STEPS.length)
    expect(screen.getByText(STEPS[0]?.text ?? '')).toBeInTheDocument()
  })

  it('ステップが空のときは項目を表示しない', () => {
    render(<StepPlayer steps={[]} />)
    const list = screen.getByRole('list', { name: '計算過程' })
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0)
  })
})
