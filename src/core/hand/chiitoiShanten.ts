import type { TileCounts } from '../tiles/tileCounts'

export const chiitoiShanten = (counts: TileCounts): number => {
  const pairs = counts.filter((c) => c >= 2).length
  const kinds = counts.filter((c) => c >= 1).length
  return 6 - pairs + Math.max(0, 7 - kinds)
}
