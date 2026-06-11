import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ChoiceQuizStep } from '@/content/lessons/types'
import { ChoiceQuizStepView } from './ChoiceQuizStepView'

afterEach(cleanup)

const step: ChoiceQuizStep = {
  kind: 'quiz',
  prompt: '鳥の絵が描かれたこの牌は何でしょう？',
  tiles: '1s',
  choices: ['索子の1', '字牌の一種', '萬子の1', 'ドラ専用の牌'],
  correctIndex: 0,
  explanation: '1索は鳥の絵柄ですが索子の1です',
}

describe('ChoiceQuizStepView', () => {
  it('プロンプトと手牌と選択肢を表示する', () => {
    render(<ChoiceQuizStepView step={step} onComplete={vi.fn()} />)

    expect(
      screen.getByText('鳥の絵が描かれたこの牌は何でしょう？'),
    ).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '一索' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('tilesが未指定なら手牌を表示しない', () => {
    render(
      <ChoiceQuizStepView
        step={{ ...step, tiles: undefined }}
        onComplete={vi.fn()}
      />,
    )
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })

  it('誤答では再挑戦メッセージが出てonCompleteは呼ばれない', () => {
    const onComplete = vi.fn()
    render(<ChoiceQuizStepView step={step} onComplete={onComplete} />)

    fireEvent.click(screen.getByRole('button', { name: '字牌の一種' }))

    expect(screen.getByText('もう一度考えてみましょう')).toBeInTheDocument()
    expect(screen.queryByText('正解')).not.toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('誤答後も再挑戦して正答できる', () => {
    const onComplete = vi.fn()
    render(<ChoiceQuizStepView step={step} onComplete={onComplete} />)

    fireEvent.click(screen.getByRole('button', { name: '萬子の1' }))
    fireEvent.click(screen.getByRole('button', { name: '索子の1' }))

    expect(screen.getByText('正解')).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('正答で解説が表示され以降のタップは無視される', () => {
    const onComplete = vi.fn()
    render(<ChoiceQuizStepView step={step} onComplete={onComplete} />)

    fireEvent.click(screen.getByRole('button', { name: '索子の1' }))

    expect(screen.getByText('正解')).toBeInTheDocument()
    expect(
      screen.getByText('1索は鳥の絵柄ですが索子の1です'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '字牌の一種' }))
    expect(screen.getByText('正解')).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
