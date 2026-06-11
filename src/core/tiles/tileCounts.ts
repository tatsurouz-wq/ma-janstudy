import type { Tile } from './tile'
import { indexToTile, tileToIndex } from './tile'

export type TileCounts = readonly number[]

export const TILE_KINDS = 34

export const EMPTY_COUNTS: TileCounts = Object.freeze(
  Array.from({ length: TILE_KINDS }, () => 0),
)

export const countsFromTiles = (tiles: readonly Tile[]): TileCounts =>
  tiles.reduce<TileCounts>(
    (counts, tile) => withTileAdded(counts, tileToIndex(tile)),
    EMPTY_COUNTS,
  )

export const tilesFromCounts = (counts: TileCounts): readonly Tile[] =>
  counts.flatMap((count, index) =>
    Array.from({ length: count }, () => indexToTile(index)),
  )

export const totalTiles = (counts: TileCounts): number =>
  counts.reduce((sum, count) => sum + count, 0)

export const withTileAdded = (
  counts: TileCounts,
  index: number,
  amount = 1,
): TileCounts => {
  const current = counts[index]
  if (current === undefined || current + amount > 4) {
    throw new Error(`牌${index}を${amount}枚追加できません（現在${current}枚）`)
  }
  return counts.map((c, i) => (i === index ? c + amount : c))
}

export const withTileRemoved = (
  counts: TileCounts,
  index: number,
  amount = 1,
): TileCounts => {
  const current = counts[index]
  if (current === undefined || current - amount < 0) {
    throw new Error(`牌${index}を${amount}枚削除できません（現在${current}枚）`)
  }
  return counts.map((c, i) => (i === index ? c - amount : c))
}
