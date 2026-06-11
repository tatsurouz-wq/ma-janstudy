import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { CompareStep } from '@/content/lessons/types'
import { LESSON_05 } from '@/content/lessons/lesson05'
import { CompareStepView } from './CompareStepView'

afterEach(cleanup)

const found = LESSON_05.steps.find(
  (s): s is CompareStep => s.kind === 'compare',
)
if (found === undefined) {
  throw new Error('lesson05にcompareステップがありません')
}
const step: CompareStep = found

describe('CompareStepView', () => {
  it('マウント時にonCompleteが呼ばれる', () => {
    const onComplete = vi.fn()
    render(<CompareStepView step={step} onComplete={onComplete} />)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('プロンプトと全variantのラベルを表示する', () => {
    render(<CompareStepView step={step} onComplete={vi.fn()} />)

    expect(
      screen.getByText(/同じような手でも雀頭しだいで/),
    ).toBeInTheDocument()
    expect(screen.getByText('雀頭が5索 → 平和が成立')).toBeInTheDocument()
    expect(
      screen.getByText('雀頭が白 → 平和不成立で役なし'),
    ).toBeInTheDocument()
  })

  it('和了できるvariantには役と符と点数が表示される', () => {
    render(<CompareStepView step={step} onComplete={vi.fn()} />)

    const yakuLine = screen.getByText('役:').closest('p')
    expect(yakuLine).toHaveTextContent('平和')
    expect(screen.getByText('符の内訳:')).toBeInTheDocument()
    expect(screen.getByText(/翻\d+符 = [\d,]+点/)).toBeInTheDocument()
  })

  it('役なしvariantには和了不可の表示が出る', () => {
    render(<CompareStepView step={step} onComplete={vi.fn()} />)
    expect(
      screen.getByText('この形は役がなく和了できません'),
    ).toBeInTheDocument()
  })

  it('ステップの解説を表示する', () => {
    render(<CompareStepView step={step} onComplete={vi.fn()} />)
    expect(screen.getByText(/「役の有無」を常に意識しましょう/)).toBeInTheDocument()
  })
})
