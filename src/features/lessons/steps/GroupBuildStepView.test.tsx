import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { GroupBuildStep } from '@/content/lessons/types'
import { GroupBuildStepView } from './GroupBuildStepView'

afterEach(cleanup)

const step: GroupBuildStep = {
  kind: 'group-build',
  prompt: '4面子1雀頭に分けましょう',
  tiles: '123m555p456789s33z',
  explanation: 'これで和了形の完成です',
}

const selectTiles = (labels: readonly string[]) => {
  const used = new Map<string, number>()
  for (const label of labels) {
    const index = used.get(label) ?? 0
    const buttons = screen.getAllByRole('button', { name: label })
    const target = buttons[index]
    if (target === undefined) {
      throw new Error(`牌ボタンが見つかりません: ${label}`)
    }
    fireEvent.click(target)
    used.set(label, index + 1)
  }
}

const confirmButton = () =>
  screen.getByRole('button', { name: /面子にする|雀頭にする/ })

describe('GroupBuildStepView', () => {
  it('3枚選ぶまで確定ボタンは無効', () => {
    render(<GroupBuildStepView step={step} onComplete={vi.fn()} />)

    expect(confirmButton()).toBeDisabled()
    selectTiles(['一萬'])
    expect(confirmButton()).toBeDisabled()
    selectTiles(['二萬', '三萬'])
    expect(confirmButton()).toBeEnabled()
  })

  it('再タップで選択を解除できる', () => {
    render(<GroupBuildStepView step={step} onComplete={vi.fn()} />)

    selectTiles(['一萬', '二萬', '三萬'])
    expect(confirmButton()).toBeEnabled()
    selectTiles(['三萬'])
    expect(confirmButton()).toBeDisabled()
  })

  it('不正な3枚は面子として確定されない', () => {
    const onComplete = vi.fn()
    render(<GroupBuildStepView step={step} onComplete={onComplete} />)

    selectTiles(['一萬', '二萬', '四索'])
    fireEvent.click(confirmButton())

    expect(screen.getByRole('button', { name: '一萬' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '四索' })).toBeInTheDocument()
    expect(screen.queryAllByRole('img', { name: '一萬' })).toHaveLength(1)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('正しい3枚を選ぶと面子として確定される', () => {
    const onComplete = vi.fn()
    render(<GroupBuildStepView step={step} onComplete={onComplete} />)

    selectTiles(['一萬', '二萬', '三萬'])
    fireEvent.click(confirmButton())

    expect(
      screen.queryByRole('button', { name: '一萬' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: '一萬' })).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('全グループ完成でonCompleteが呼ばれ解説が表示される', () => {
    const onComplete = vi.fn()
    render(<GroupBuildStepView step={step} onComplete={onComplete} />)

    selectTiles(['一萬', '二萬', '三萬'])
    fireEvent.click(confirmButton())
    selectTiles(['五筒', '五筒', '五筒'])
    fireEvent.click(confirmButton())
    selectTiles(['四索', '五索', '六索'])
    fireEvent.click(confirmButton())
    selectTiles(['七索', '八索', '九索'])
    fireEvent.click(confirmButton())

    expect(confirmButton()).toHaveTextContent('雀頭にする（2枚）')
    selectTiles(['西', '西'])
    fireEvent.click(confirmButton())

    expect(screen.getByText('4面子1雀頭が完成しました')).toBeInTheDocument()
    expect(screen.getByText('これで和了形の完成です')).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
