import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { OrderSequenceStep } from '@/content/lessons/types'
import { OrderSequenceStepView } from './OrderSequenceStepView'

afterEach(cleanup)

const step: OrderSequenceStep = {
  kind: 'order-sequence',
  prompt: '和了までの流れを順番に並べてください',
  items: [
    { id: 'haipai', label: '配牌' },
    { id: 'tsumo', label: 'ツモ' },
    { id: 'dahai', label: '打牌' },
  ],
  correctOrder: ['haipai', 'tsumo', 'dahai'],
  explanation: 'これが1巡の基本の流れです',
}

const tap = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: label }))

describe('OrderSequenceStepView', () => {
  it('初期表示ではプロンプトと案内、全カードが表示される', () => {
    render(<OrderSequenceStepView step={step} onComplete={vi.fn()} />)

    expect(
      screen.getByText('和了までの流れを順番に並べてください'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('正しい順番にカードをタップしてください'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '配牌' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ツモ' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打牌' })).toBeInTheDocument()
  })

  it('誤った順番のタップでは進まない', () => {
    const onComplete = vi.fn()
    render(<OrderSequenceStepView step={step} onComplete={onComplete} />)

    tap('打牌')

    expect(
      screen.getByText('正しい順番にカードをタップしてください'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打牌' })).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('正しい順番のタップで並びに追加されカードが消える', () => {
    const onComplete = vi.fn()
    render(<OrderSequenceStepView step={step} onComplete={onComplete} />)

    tap('配牌')

    expect(
      screen.queryByText('正しい順番にカードをタップしてください'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('配牌')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '配牌' }),
    ).not.toBeInTheDocument()

    tap('打牌')
    expect(screen.getByRole('button', { name: '打牌' })).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('すべて正順でタップするとonCompleteが呼ばれ解説が表示される', () => {
    const onComplete = vi.fn()
    render(<OrderSequenceStepView step={step} onComplete={onComplete} />)

    tap('配牌')
    tap('ツモ')
    tap('打牌')

    expect(screen.getByText('これが1巡の基本の流れです')).toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
