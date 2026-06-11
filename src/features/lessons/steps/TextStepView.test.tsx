import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { TextStep } from '@/content/lessons/types'
import { TextStepView } from './TextStepView'

afterEach(cleanup)

const baseStep: TextStep = {
  kind: 'text',
  title: '麻雀牌の種類',
  body: '一段落目の説明\n二段落目の説明',
}

describe('TextStepView', () => {
  it('タイトルを見出しとして表示する', () => {
    render(<TextStepView step={baseStep} />)
    expect(
      screen.getByRole('heading', { name: '麻雀牌の種類' }),
    ).toBeInTheDocument()
  })

  it('本文を改行ごとに段落として表示する', () => {
    render(<TextStepView step={baseStep} />)
    expect(screen.getByText('一段落目の説明')).toBeInTheDocument()
    expect(screen.getByText('二段落目の説明')).toBeInTheDocument()
  })

  it('tilesが未指定なら牌を表示しない', () => {
    render(<TextStepView step={baseStep} />)
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })

  it('tilesが指定されていれば牌を表示する', () => {
    render(<TextStepView step={{ ...baseStep, tiles: '159m' }} />)
    expect(screen.getByRole('img', { name: '一萬' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '五萬' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '九萬' })).toBeInTheDocument()
  })
})
