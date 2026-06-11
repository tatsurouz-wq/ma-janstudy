import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TilePicker } from './TilePicker'

afterEach(cleanup)

describe('TilePicker', () => {
  it('34種の通常牌と赤5が3つ表示される', () => {
    render(<TilePicker remainingOf={() => 4} onPick={() => undefined} />)
    expect(screen.getAllByRole('button')).toHaveLength(37)
    expect(screen.getByRole('button', { name: '赤五萬' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '赤五筒' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '赤五索' })).toBeInTheDocument()
  })

  it('通常牌クリックで onPick(tile, false) が呼ばれる', () => {
    const onPick = vi.fn()
    render(<TilePicker remainingOf={() => 4} onPick={onPick} />)
    fireEvent.click(screen.getByRole('button', { name: '一萬' }))
    expect(onPick).toHaveBeenCalledWith('m1', false)
  })

  it('赤5クリックで onPick(tile, true) が呼ばれる', () => {
    const onPick = vi.fn()
    render(<TilePicker remainingOf={() => 4} onPick={onPick} />)
    fireEvent.click(screen.getByRole('button', { name: '赤五筒' }))
    expect(onPick).toHaveBeenCalledWith('p5', true)
  })

  it('remainingOf が 0 の牌は disabled でクリックできない', () => {
    const onPick = vi.fn()
    render(
      <TilePicker
        remainingOf={(tile) => (tile === 'm1' ? 0 : 4)}
        onPick={onPick}
      />,
    )
    const button = screen.getByRole('button', { name: '一萬' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onPick).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '二萬' })).toBeEnabled()
  })

  it('残り枚数がバッジに表示される', () => {
    render(
      <TilePicker
        remainingOf={(tile) => (tile === 'z7' ? 1 : 4)}
        onPick={() => undefined}
      />,
    )
    const button = screen.getByRole('button', { name: '中' })
    expect(button).toHaveTextContent('1')
  })

  it('remainingOf が 0 だと赤5も disabled になる', () => {
    render(
      <TilePicker
        remainingOf={(tile) => (tile === 's5' ? 0 : 4)}
        onPick={() => undefined}
      />,
    )
    expect(screen.getByRole('button', { name: '赤五索' })).toBeDisabled()
  })

  it('usedRedFives に含まれる赤5は disabled になる', () => {
    render(
      <TilePicker
        remainingOf={() => 4}
        onPick={() => undefined}
        usedRedFives={new Set(['m5'])}
      />,
    )
    expect(screen.getByRole('button', { name: '赤五萬' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '赤五筒' })).toBeEnabled()
  })

  it('showRedFives=false で赤5を表示しない', () => {
    render(
      <TilePicker
        remainingOf={() => 4}
        onPick={() => undefined}
        showRedFives={false}
      />,
    )
    expect(screen.getAllByRole('button')).toHaveLength(34)
    expect(
      screen.queryByRole('button', { name: '赤五萬' }),
    ).not.toBeInTheDocument()
  })
})
