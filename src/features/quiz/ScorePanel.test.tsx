import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SCORE_QUESTIONS } from '@/content/quizzes/scoreQuestions'
import { paymentLabel, scoreChoices, solveScore } from './quizEngine'
import { ScorePanel } from './ScorePanel'

afterEach(cleanup)

const question = SCORE_QUESTIONS[0]!
const result = solveScore(question)
const correct = paymentLabel(result)
const choices = scoreChoices(question)
const wrong = choices.find((choice) => choice !== correct)!
const yakuSummary = result.yaku
  .map((hit) => `${hit.name}${hit.isYakuman ? '' : hit.han}`)
  .join('・')

describe('ScorePanel', () => {
  it('問題文と4つの選択肢を表示する', () => {
    render(
      <ScorePanel question={question} onAnswered={vi.fn()} answered={false} />,
    )
    expect(screen.getByText('点数（支払い）')).toBeInTheDocument()
    expect(choices).toHaveLength(4)
    for (const choice of choices) {
      expect(screen.getByRole('button', { name: choice })).toBeInTheDocument()
    }
    expect(screen.queryByText(question.hint)).not.toBeInTheDocument()
  })

  it('正しい点数を選ぶと正解', () => {
    const onAnswered = vi.fn()
    render(
      <ScorePanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    fireEvent.click(screen.getByRole('button', { name: correct }))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered).toHaveBeenCalledWith(true)
  })

  it('間違った点数を選ぶと不正解', () => {
    const onAnswered = vi.fn()
    render(
      <ScorePanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    fireEvent.click(screen.getByRole('button', { name: wrong }))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered).toHaveBeenCalledWith(false)
  })

  it('回答後は解説とステップ表示があり再回答できない', () => {
    const onAnswered = vi.fn()
    const { rerender } = render(
      <ScorePanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    fireEvent.click(screen.getByRole('button', { name: wrong }))
    onAnswered.mockClear()
    rerender(
      <ScorePanel question={question} onAnswered={onAnswered} answered={true} />,
    )
    expect(screen.getByText(yakuSummary)).toBeInTheDocument()
    expect(
      screen.getAllByText(
        new RegExp(`${result.totalHan}翻${result.fu?.rounded ?? 0}符`),
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(question.hint)).toBeInTheDocument()
    expect(
      screen.getByText('計算過程をステップで見る'),
    ).toBeInTheDocument()
    const stepList = screen.getByRole('list', { name: '計算過程', hidden: true })
    expect(stepList.children.length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: wrong })).toHaveClass('glow-ng')
    expect(screen.getByRole('button', { name: correct })).toHaveClass('glow-ok')
    const untouched = choices.find((c) => c !== correct && c !== wrong)!
    expect(screen.getByRole('button', { name: untouched })).toHaveClass(
      'opacity-50',
    )
    fireEvent.click(screen.getByRole('button', { name: correct }))
    expect(onAnswered).not.toHaveBeenCalled()
  })

  it('役満の問題では役満と表示される', () => {
    const yakumanQuestion = SCORE_QUESTIONS.find((q) => q.id === 's08')!
    const yakumanResult = solveScore(yakumanQuestion)
    expect(yakumanResult.isYakuman).toBe(true)
    render(
      <ScorePanel
        question={yakumanQuestion}
        onAnswered={vi.fn()}
        answered={true}
      />,
    )
    expect(screen.getAllByText(/役満/).length).toBeGreaterThan(0)
    expect(screen.getByText(yakumanQuestion.hint)).toBeInTheDocument()
  })
})
