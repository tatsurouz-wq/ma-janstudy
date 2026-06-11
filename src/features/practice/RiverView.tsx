import type { TileInstance } from '@/core/tiles/tile'
import { TileSvg } from '@/components/tiles/TileSvg'

interface RiverViewProps {
  readonly discards: readonly TileInstance[]
  readonly riichiTileId: string | null
}

export function RiverView({ discards, riichiTileId }: RiverViewProps) {
  return (
    <div
      className="felt-surface hairline min-h-36 rounded-2xl p-4"
      aria-label="河（捨て牌）"
    >
      {discards.length === 0 ? (
        <p className="text-center text-sm text-text-disabled">
          捨てた牌がここに並びます
        </p>
      ) : (
        <div className="mx-auto grid w-fit grid-cols-6 gap-1">
          {discards.map((tile, index) => (
            <div
              key={tile.id}
              className={
                tile.id === riichiTileId ? 'rotate-90' : undefined
              }
              style={{ rotate: `${((index * 7) % 3) - 1}deg` }}
            >
              <TileSvg
                tile={tile.tile}
                isRed={tile.isRed}
                size="sm"
                className="block drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
