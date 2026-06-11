import { parseTiles } from '@/core/tiles/notation'
import { tileToIndex } from '@/core/tiles/tile'
import type { Meld } from '@/core/score/types'
import type { TileSize } from '@/components/tiles/TileSvg'
import { TileSvg } from '@/components/tiles/TileSvg'

interface HandDisplayProps {
  readonly hand: string
  readonly melds?: readonly Meld[]
  readonly highlightTile?: string
  readonly size?: TileSize
}

export function HandDisplay({
  hand,
  melds = [],
  highlightTile,
  size = 'md',
}: HandDisplayProps) {
  const tiles = [...parseTiles(hand)].sort(
    (a, b) => tileToIndex(a) - tileToIndex(b),
  )
  return (
    <div className="felt-surface hairline flex flex-wrap items-end gap-1.5 rounded-2xl p-5">
      {tiles.map((tile, i) => (
        <div
          key={`${tile}-${i}`}
          className={
            tile === highlightTile ? 'glow-gold -translate-y-1.5 rounded-[7px]' : ''
          }
        >
          <TileSvg
            tile={tile}
            size={size}
            className="block drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
          />
        </div>
      ))}
      {melds.map((meld, meldIndex) => (
        <div key={meldIndex} className="ml-3 flex items-end gap-0.5">
          {meld.tiles.map((tile, i) => (
            <TileSvg
              key={i}
              tile={tile}
              size="sm"
              faceDown={meld.type === 'ankan' && (i === 0 || i === 3)}
              className="block drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
            />
          ))}
        </div>
      ))}
    </div>
  )
}
