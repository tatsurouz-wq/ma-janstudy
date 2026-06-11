import type { TileCounts } from '../tiles/tileCounts'
import { withTileAdded } from '../tiles/tileCounts'
import type { Decomposition } from './decompose'
import { isWinningHand } from './winning'

export type WaitShape =
  | 'ryanmen'
  | 'kanchan'
  | 'penchan'
  | 'shanpon'
  | 'tanki'

export const waitingTiles = (counts: TileCounts): readonly number[] =>
  counts.flatMap((count, index) =>
    count < 4 && isWinningHand(withTileAdded(counts, index)) ? [index] : [],
  )

const rankOfIndex = (index: number): number => (index % 9) + 1

export const waitShapesIn = (
  decomposition: Decomposition,
  winIndex: number,
): readonly WaitShape[] => {
  const mutableShapes: WaitShape[] = []
  if (decomposition.pairIndex === winIndex) {
    mutableShapes.push('tanki')
  }
  for (const set of decomposition.sets) {
    if (set.kind === 'kotsu') {
      if (set.startIndex === winIndex) {
        mutableShapes.push('shanpon')
      }
      continue
    }
    const a = set.startIndex
    if (winIndex < a || winIndex > a + 2) {
      continue
    }
    if (winIndex === a + 1) {
      mutableShapes.push('kanchan')
    } else if (
      (winIndex === a + 2 && rankOfIndex(a) === 1) ||
      (winIndex === a && rankOfIndex(a) === 7)
    ) {
      mutableShapes.push('penchan')
    } else {
      mutableShapes.push('ryanmen')
    }
  }
  return [...new Set(mutableShapes)]
}
