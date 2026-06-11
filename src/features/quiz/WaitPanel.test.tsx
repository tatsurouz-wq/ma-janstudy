import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { WAIT_QUESTIONS } from '@/content/quizzes/waitQuestions'
import { ALL_TILES, indexToTile } from '@/core/tiles/tile'
import { tileName } from '@/core/tiles/tileNames'
import { solveWaits } from './quizEngine'
import { WaitPanel } from './WaitPanel'

afterEach(cleanup)

const question = WAIT_QUESTIONS[0]!
const waits = solveWaits(question)
const correctNames = waits.map((i) => tileName(indexToTile(i)))
const wrongIndex = ALL_TILES.findIndex((_, index) => !waits.includes(index))
const wrongName = tileName(indexToTile(wrongIndex))

describe('WaitPanel', () => {
  it('牌を選ぶまで決定ボタンは無効', () => {
    const onAnswered = vi.fn()
    render(
      <WaitPanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    const submit = screen.getByRole('button', { name: '決定' })
    expect(submit).toBeDisabled()
    fireEvent.click(submit)
    expect(onAnswered).not.toHaveBeenCalled()
  })

  it('牌の選択はトグルできる', () => {
    render(
      <WaitPanel question={question} onAnswered={vi.fn()} answered={false} />,
    )
    const tileButton = screen.getByRole('button', { name: correctNames[0] })
    fireEvent.click(tileButton)
    expect(tileButton).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(tileButton)
    expect(tileButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('正しい待ちをすべて選んで決定すると正解', () => {
    const onAnswered = vi.fn()
    render(
      <WaitPanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    for (const name of correctNames) {
      fireEvent.click(screen.getByRole('button', { name }))
    }
    fireEvent.click(screen.getByRole('button', { name: '決定' }))
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered).toHaveBeenCalledWith(true)
  })

  it('間違った牌を選んで決定すると不正解', () => {
    const onAnswered = vi.fn()
    render(
      <WaitPanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    fireEvent.click(screen.getByRole('button', { name: wrongName }))
    fireEvent.click(screen.getByRole('button', { name: '決定' }))
    expect(onAnswered).toHaveBeenCalledWith(false)
  })

  it('待ちの一部しか選んでいない場合は不正解', () => {
    const onAnswered = vi.fn()
    render(
      <WaitPanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    fireEvent.click(screen.getByRole('button', { name: correctNames[0] }))
    fireEvent.click(screen.getByRole('button', { name: '決定' }))
    expect(onAnswered).toHaveBeenCalledWith(false)
  })

  it('回答後は正解の牌とヒントを表示し操作を受け付けない', () => {
    const onAnswered = vi.fn()
    render(
      <WaitPanel question={question} onAnswered={onAnswered} answered={true} />,
    )
    expect(screen.getByText('正解:')).toBeInTheDocument()
    expect(
      screen.getByText(`（${correctNames.join('・')}）`),
    ).toBeInTheDocument()
    expect(screen.getByText(question.hint)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '決定' }),
    ).not.toBeInTheDocument()
    const wrongButton = screen.getByRole('button', { name: wrongName })
    expect(wrongButton).toBeDisabled()
    const correctButton = screen.getByRole('button', { name: correctNames[0] })
    fireEvent.click(correctButton)
    expect(correctButton).toHaveAttribute('aria-pressed', 'false')
    expect(onAnswered).not.toHaveBeenCalled()
  })

  it('回答後は正解牌と選択した不正解牌が強調される', () => {
    const onAnswered = vi.fn()
    const { rerender } = render(
      <WaitPanel question={question} onAnswered={onAnswered} answered={false} />,
    )
    fireEvent.click(screen.getByRole('button', { name: wrongName }))
    rerender(
      <WaitPanel question={question} onAnswered={onAnswered} answered={true} />,
    )
    expect(
      screen.getByRole('button', { name: wrongName }).parentElement,
    ).toHaveClass('glow-ng')
    for (const name of correctNames) {
      expect(
        screen.getByRole('button', { name }).parentElement,
      ).toHaveClass('glow-ok')
    }
  })
})
