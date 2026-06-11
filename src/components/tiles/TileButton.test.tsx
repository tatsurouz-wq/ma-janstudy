import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TileButton } from './TileButton'

afterEach(cleanup)

describe('TileButton', () => {
  it('クリックで onClick が呼ばれる', () => {
    const onClick = vi.fn()
    render(<TileButton tile="m1" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: '一萬' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disabled のときクリックしても onClick が呼ばれない', () => {
    const onClick = vi.fn()
    render(<TileButton tile="m1" onClick={onClick} disabled />)
    const button = screen.getByRole('button', { name: '一萬' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('badge が表示される', () => {
    render(<TileButton tile="s9" badge="3" />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('badge 未指定のときバッジを表示しない', () => {
    render(<TileButton tile="s9" />)
    const button = screen.getByRole('button', { name: '九索' })
    expect(button.querySelector('span')).toBeNull()
  })

  it('selected が aria-pressed に反映される', () => {
    render(<TileButton tile="z5" selected />)
    expect(screen.getByRole('button', { name: '白' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('selected でないとき aria-pressed は false', () => {
    render(<TileButton tile="z5" />)
    expect(screen.getByRole('button', { name: '白' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('isRed のとき赤牌の名前になる', () => {
    render(<TileButton tile="p5" isRed />)
    expect(screen.getByRole('button', { name: '赤五筒' })).toBeInTheDocument()
  })

  it('ariaLabel で名前を上書きできる', () => {
    render(<TileButton tile="m1" ariaLabel="ドラ表示のm1を削除" />)
    expect(
      screen.getByRole('button', { name: 'ドラ表示のm1を削除' }),
    ).toBeInTheDocument()
  })
})
