import { ALL_TILES, isYaochuu, tileToIndex } from '../tiles/tile'
import type { TileCounts } from '../tiles/tileCounts'
import { totalTiles } from '../tiles/tileCounts'
import { decomposeStandard } from './decompose'

export const YAOCHUU_INDICES: readonly number[] = ALL_TILES.filter((t) =>
  isYaochuu(t),
).map((t) => tileToIndex(t))

export const isChiitoi = (counts: TileCounts): boolean =>
  totalTiles(counts) === 14 && counts.filter((c) => c === 2).length === 7

export const isKokushi = (counts: TileCounts): boolean => {
  if (totalTiles(counts) !== 14) {
    return false
  }
  const nonYaochuu = counts.some(
    (c, i) => c > 0 && !YAOCHUU_INDICES.includes(i),
  )
  if (nonYaochuu) {
    return false
  }
  return YAOCHUU_INDICES.every((i) => (counts[i] ?? 0) >= 1)
}

export const isWinningHand = (counts: TileCounts): boolean => {
  const total = totalTiles(counts)
  if (total % 3 !== 2) {
    return false
  }
  if (total === 14 && (isChiitoi(counts) || isKokushi(counts))) {
    return true
  }
  return decomposeStandard(counts).length > 0
}
