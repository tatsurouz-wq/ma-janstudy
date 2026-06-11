import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { SelectFromPaletteStep } from '@/content/lessons/types'
import { SelectFromPaletteStepView } from './SelectFromPaletteStepView'

afterEach(cleanup)

const arrayStep: SelectFromPaletteStep = {
  kind: 'select-from-palette',
  prompt: '幺九牌をすべて選んでください',
  palette: '2m9m5p1s7s1z6z',
  correct: ['m9', 's1', 'z1', 'z6'],
  explanation: '1・9・字牌が幺九牌です',
}

const waitsStep: SelectFromPaletteStep = {
  kind: 'select-from-palette',
  prompt: 'この手牌の待ちをすべて選んでください',
  hand: '23m456p789s111z55z',
  palette: 'all',
  correct: 'waits-of-hand',
  explanation: '1萬と4萬の両面待ちです',
}

const tap = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: label }))

const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: '確認する' }))

describe('SelectFromPaletteStepView correct配列版', () => {
  it('未選択のあいだ確認ボタンは無効', () => {
    render(<SelectFromPaletteStepView step={arrayStep} onComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: '確認する' })).toBeDisabled()
  })

  it('誤った選択は不正解になり選び直せる', () => {
    const onComplete = vi.fn()
    render(
      <SelectFromPaletteStepView step={arrayStep} onComplete={onComplete} />,
    )

    tap('二萬')
    submit()

    expect(
      screen.getByText('惜しい。もう一度考えてみましょう'),
    ).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()

    tap('二萬')
    expect(
      screen.queryByText('惜しい。もう一度考えてみましょう'),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '二萬' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('正しい牌をすべて選ぶと正解になりonCompleteが呼ばれる', () => {
    const onComplete = vi.fn()
    render(
      <SelectFromPaletteStepView step={arrayStep} onComplete={onComplete} />,
    )

    tap('九萬')
    tap('一索')
    tap('東')
    tap('發')
    submit()

    expect(screen.getByText('正解')).toBeInTheDocument()
    expect(screen.getByText('1・9・字牌が幺九牌です')).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('正解後は牌をタップしても表示が変わらない', () => {
    const onComplete = vi.fn()
    render(
      <SelectFromPaletteStepView step={arrayStep} onComplete={onComplete} />,
    )

    tap('九萬')
    tap('一索')
    tap('東')
    tap('發')
    submit()
    tap('二萬')

    expect(screen.getByText('正解')).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe('SelectFromPaletteStepView waits-of-hand版', () => {
  it('手牌が表示され待ち牌の選択で正解になる', () => {
    const onComplete = vi.fn()
    render(
      <SelectFromPaletteStepView step={waitsStep} onComplete={onComplete} />,
    )

    expect(screen.getAllByRole('img', { name: '二萬' })).toHaveLength(2)

    tap('一萬')
    tap('四萬')
    submit()

    expect(screen.getByText('正解')).toBeInTheDocument()
    expect(screen.getByText('1萬と4萬の両面待ちです')).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('待ち以外を含む選択は不正解になる', () => {
    const onComplete = vi.fn()
    render(
      <SelectFromPaletteStepView step={waitsStep} onComplete={onComplete} />,
    )

    tap('一萬')
    tap('九筒')
    submit()

    expect(
      screen.getByText('惜しい。もう一度考えてみましょう'),
    ).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('handが未指定のwaits-of-handは正解牌なしとして扱う', () => {
    const onComplete = vi.fn()
    const step: SelectFromPaletteStep = {
      ...waitsStep,
      hand: undefined,
      palette: '12m',
    }
    render(<SelectFromPaletteStepView step={step} onComplete={onComplete} />)

    tap('一萬')
    submit()

    expect(
      screen.getByText('惜しい。もう一度考えてみましょう'),
    ).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })
})
