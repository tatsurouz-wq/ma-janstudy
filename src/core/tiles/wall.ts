import type { Rng } from './random'
import { shuffled } from './random'
import type { Tile, TileInstance } from './tile'
import { ALL_TILES } from './tile'

export const RED_FIVE_COUNT_PER_SUIT = 1

const RED_TILES: ReadonlySet<Tile> = new Set(['m5', 'p5', 's5'])

export const createWall = (
  rng: Rng,
): readonly [readonly TileInstance[], Rng] => {
  const ordered = ALL_TILES.flatMap((tile) =>
    Array.from({ length: 4 }, (_, copy): TileInstance => {
      const isRed = RED_TILES.has(tile) && copy === 0
      return { id: `${tile}-${copy}`, tile, isRed }
    }),
  )
  return shuffled(ordered, rng)
}
