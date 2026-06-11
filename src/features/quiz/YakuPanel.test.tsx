import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { YAKU_QUESTIONS } from '@/content/quizzes/yakuQuestions'
import { solveScore, YAKU_NAME_BY_ID } from './quizEngine'
import { YakuPanel } from './YakuPanel'

afterEach(cleanup)

const question = YAKU_QUESTIONS[1]!
const result = solveScore(question)
const answerIds = result.yaku.map((hit) => hit.id)
const answerNames = answerIds.map((id) => YAKU_NAME_BY_ID.get(id) ?? id)
const decoyIds = question.choices.filter((id) => !answerIds.includes(id))
const decoyNames = decoyIds.map((id) => YAKU_NAME_BY_ID.get(id) ?? id)

describe('YakuPanel', () => {
  it('問題文とすべての選択肢を表示する', () => {
    render(
      <YakuPanel question={question} onAnswered={vi.fn()} answered={false} />,
    )
    expect(
      screen.getByText(/この和了に成立している役を/),
    ).toBeInTheDocument()
    for (const id of question.choices) {
      expect(
        screen.getByRole('button', { name: YAKU_NAME_BY_ID.get(id) ?? id }),
      ).toBeInTheDocument()
    }
  })

  it('役を選ぶまで決定ボタンは無効', () => {
    const onAnswered = vi.fn()
    render(
      <YakuPanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    const submit = screen.getByRole('button', { name: '決定' })
    expect(submit).toBeDisabled()
    fireEvent.click(submit)
    expect(onAnswered).not.toHaveBeenCalled()
  })

  it('選択はトグルできる', () => {
    render(
      <YakuPanel question={question} onAnswered={vi.fn()} answered={false} />,
    )
    const choice = screen.getByRole('button', { name: answerNames[0] })
    fireEvent.click(choice)
    expect(choice).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(choice)
    expect(choice).toHaveAttribute('aria-pressed', 'false')
  })

  it('正解の役をすべて選んで決定すると正解', () => {
    const onAnswered = vi.fn()
    render(
      <YakuPanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    for (const name of answerNames) {
      fireEvent.click(screen.getByRole('button', { name }))
    }
    fireEvent.click(screen.getByRole('button', { name: '決定' }))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered).toHaveBeenCalledWith(true)
  })

  it('不正解の役を選んで決定すると不正解', () => {
    const onAnswered = vi.fn()
    render(
      <YakuPanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    fireEvent.click(screen.getByRole('button', { name: decoyNames[0] }))
    fireEvent.click(screen.getByRole('button', { name: '決定' }))
    expect(onAnswered).toHaveBeenCalledWith(false)
  })

  it('回答後は役の解説とヒントを表示し操作を受け付けない', () => {
    const onAnswered = vi.fn()
    render(
      <YakuPanel question={question} onAnswered={onAnswered} answered={true} />,
    )
    for (const hit of result.yaku) {
      expect(screen.getAllByText(hit.name).length).toBeGreaterThan(0)
      expect(
        screen.getByText(`${hit.han}翻: ${hit.reason}`),
      ).toBeInTheDocument()
    }
    expect(screen.getByText(question.hint)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '決定' }),
    ).not.toBeInTheDocument()
    const choice = screen.getByRole('button', { name: decoyNames[0] })
    fireEvent.click(choice)
    expect(choice).toHaveAttribute('aria-pressed', 'false')
    expect(onAnswered).not.toHaveBeenCalled()
  })

  it('回答後は正解・選択した不正解・未選択でスタイルが分かれる', () => {
    const onAnswered = vi.fn()
    const { rerender } = render(
      <YakuPanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    fireEvent.click(screen.getByRole('button', { name: decoyNames[0] }))
    rerender(
      <YakuPanel question={question} onAnswered={onAnswered} answered={true} />,
    )
    for (const name of answerNames) {
      expect(screen.getByRole('button', { name })).toHaveClass('glow-ok')
    }
    expect(
      screen.getByRole('button', { name: decoyNames[0] }),
    ).toHaveClass('glow-ng')
    expect(
      screen.getByRole('button', { name: decoyNames[1] }),
    ).toHaveClass('opacity-50')
  })

  it('役満の問題では役満と表示される', () => {
    const yakumanQuestion = YAKU_QUESTIONS.find((q) => q.id === 'y12')!
    const yakumanResult = solveScore(yakumanQuestion)
    expect(yakumanResult.yaku.some((hit) => hit.isYakuman)).toBe(true)
    render(
      <YakuPanel
        question={yakumanQuestion}
        onAnswered={vi.fn()}
        answered={true}
      />,
    )
    expect(screen.getAllByText(/役満:/).length).toBeGreaterThan(0)
    expect(screen.getByText(yakumanQuestion.hint)).toBeInTheDocument()
  })
})
