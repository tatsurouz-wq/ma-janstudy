import type { TileCounts } from '../tiles/tileCounts'
import { withTileAdded } from '../tiles/tileCounts'
import { shanten } from './shanten'

export interface UkeireEntry {
  readonly tileIndex: number
  readonly remaining: number
}

export const ukeire = (
  hand: TileCounts,
  visible: TileCounts,
  meldCount = 0,
): readonly UkeireEntry[] => {
  const current = shanten(hand, meldCount)
  return hand.flatMap((count, tileIndex) => {
    if (count >= 4) {
      return []
    }
    const improved =
      shanten(withTileAdded(hand, tileIndex), meldCount) < current
    if (!improved) {
      return []
    }
    const remaining = Math.max(
      0,
      4 - count - (visible[tileIndex] ?? 0),
    )
    return [{ tileIndex, remaining }]
  })
}
