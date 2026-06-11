import type { Tile } from '../tiles/tile'
import { honorRank, numberRank, suitOf, tileToIndex } from '../tiles/tile'
import type { TileCounts } from '../tiles/tileCounts'

export const doraFromIndicator = (indicator: Tile): Tile => {
  const nRank = numberRank(indicator)
  if (nRank !== null) {
    const next = nRank === 9 ? 1 : nRank + 1
    return `${suitOf(indicator)}${next}` as Tile
  }
  const hRank = honorRank(indicator)
  if (hRank === null) {
    throw new Error(`不正なドラ表示牌: ${indicator}`)
  }
  const next = hRank <= 4 ? (hRank === 4 ? 1 : hRank + 1) : hRank === 7 ? 5 : hRank + 1
  return `z${next}` as Tile
}

export const countDora = (
  counts: TileCounts,
  indicators: readonly Tile[],
): number =>
  indicators.reduce(
    (sum, indicator) =>
      sum + (counts[tileToIndex(doraFromIndicator(indicator))] ?? 0),
    0,
  )
