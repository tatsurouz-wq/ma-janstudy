import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { Tile } from '@/core/tiles/tile'
import { ALL_TILES } from '@/core/tiles/tile'
import { tileName } from '@/core/tiles/tileNames'
import type { TileSize } from './TileSvg'
import { TileSvg } from './TileSvg'

afterEach(cleanup)

const SIZES: readonly { readonly size: TileSize; readonly width: number }[] = [
  { size: 'xs', width: 28 },
  { size: 'sm', width: 36 },
  { size: 'md', width: 48 },
  { size: 'lg', width: 60 },
  { size: 'xl', width: 80 },
]

describe('TileSvg', () => {
  it('全34牌が牌名の aria-label でレンダリングされる', () => {
    for (const tile of ALL_TILES) {
      render(<TileSvg tile={tile} />)
      expect(
        screen.getByRole('img', { name: tileName(tile) }),
      ).toBeInTheDocument()
      cleanup()
    }
  })

  it('赤5は赤付きの牌名になる', () => {
    const redFives: readonly Tile[] = ['m5', 'p5', 's5']
    for (const tile of redFives) {
      render(<TileSvg tile={tile} isRed />)
      expect(
        screen.getByRole('img', { name: tileName(tile, true) }),
      ).toBeInTheDocument()
      expect(screen.getByRole('img')).toHaveAccessibleName(
        `赤${tileName(tile)}`,
      )
      cleanup()
    }
  })

  it('faceDown では裏向きの牌として表示される', () => {
    render(<TileSvg tile="m1" faceDown />)
    expect(screen.getByRole('img', { name: '裏向きの牌' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: '一萬' })).not.toBeInTheDocument()
  })

  it('全サイズで幅と高さが正しく設定される', () => {
    for (const { size, width } of SIZES) {
      render(<TileSvg tile="p7" size={size} />)
      const svg = screen.getByRole('img', { name: '七筒' })
      expect(svg).toHaveAttribute('width', String(width))
      expect(svg).toHaveAttribute(
        'height',
        String(Math.round((width * 84) / 60)),
      )
      cleanup()
    }
  })

  it('className が引き継がれる', () => {
    render(<TileSvg tile="z1" className="custom-class" />)
    expect(screen.getByRole('img', { name: '東' })).toHaveClass('custom-class')
  })
})
