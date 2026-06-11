import type { Tile } from '@/core/tiles/tile'
import { ALL_TILES, suitOf } from '@/core/tiles/tile'
import { TileButton } from '@/components/tiles/TileButton'

const SUIT_ROWS = ['m', 'p', 's', 'z'] as const

const SUIT_LABELS: Readonly<Record<string, string>> = {
  m: '萬',
  p: '筒',
  s: '索',
  z: '字',
}

interface TilePickerProps {
  readonly remainingOf: (tile: Tile) => number
  readonly onPick: (tile: Tile, isRed: boolean) => void
  readonly showRedFives?: boolean
  readonly usedRedFives?: ReadonlySet<string>
}

export function TilePicker({
  remainingOf,
  onPick,
  showRedFives = true,
  usedRedFives = new Set(),
}: TilePickerProps) {
  return (
    <div className="space-y-2" role="group" aria-label="牌を選ぶ">
      {SUIT_ROWS.map((suit) => (
        <div key={suit} className="flex items-center gap-1.5">
          <span className="w-6 shrink-0 text-center font-mincho text-sm text-text-secondary">
            {SUIT_LABELS[suit]}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TILES.filter((t) => suitOf(t) === suit).map((tile) => {
              const remaining = remainingOf(tile)
              return (
                <TileButton
                  key={tile}
                  tile={tile}
                  size="sm"
                  disabled={remaining <= 0}
                  badge={String(remaining)}
                  onClick={() => onPick(tile, false)}
                />
              )
            })}
            {showRedFives && suit !== 'z' ? (
              <TileButton
                tile={`${suit}5` as Tile}
                isRed
                size="sm"
                disabled={
                  usedRedFives.has(`${suit}5`) ||
                  remainingOf(`${suit}5` as Tile) <= 0
                }
                onClick={() => onPick(`${suit}5` as Tile, true)}
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
