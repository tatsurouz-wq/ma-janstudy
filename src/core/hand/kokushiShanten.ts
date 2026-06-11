import type { TileCounts } from '../tiles/tileCounts'
import { YAOCHUU_INDICES } from './winning'

export const kokushiShanten = (counts: TileCounts): number => {
  const kinds = YAOCHUU_INDICES.filter((i) => (counts[i] ?? 0) >= 1).length
  const hasPair = YAOCHUU_INDICES.some((i) => (counts[i] ?? 0) >= 2)
  return 13 - kinds - (hasPair ? 1 : 0)
}
