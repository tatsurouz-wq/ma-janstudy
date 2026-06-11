import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { Tile, TileInstance } from '@/core/tiles/tile'
import { RiverView } from './RiverView'

const inst = (id: string, tile: Tile): TileInstance => ({
  id,
  tile,
  isRed: false,
})

afterEach(cleanup)

describe('RiverView', () => {
  it('捨て牌がないときは案内文だけを表示する', () => {
    render(<RiverView discards={[]} riichiTileId={null} />)
    expect(screen.getByText('捨てた牌がここに並びます')).toBeInTheDocument()
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })

  it('捨て牌を並べてリーチ宣言牌だけ横向きにする', () => {
    render(
      <RiverView
        discards={[inst('a', 'm1'), inst('b', 'p5'), inst('c', 'z1')]}
        riichiTileId="b"
      />,
    )
    expect(
      screen.queryByText('捨てた牌がここに並びます'),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(3)
    const riichiCell = screen.getByRole('img', { name: '五筒' }).closest('div')
    expect(riichiCell).toHaveClass('rotate-90')
    const normalCell = screen.getByRole('img', { name: '一萬' }).closest('div')
    expect(normalCell).not.toHaveClass('rotate-90')
  })

  it('リーチ宣言牌がなければすべて縦向きで表示する', () => {
    render(
      <RiverView
        discards={[inst('a', 'm1'), inst('b', 'p5')]}
        riichiTileId={null}
      />,
    )
    for (const img of screen.getAllByRole('img')) {
      expect(img.closest('div')).not.toHaveClass('rotate-90')
    }
  })
})
