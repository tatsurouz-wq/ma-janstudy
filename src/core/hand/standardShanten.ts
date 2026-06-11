import type { TileCounts } from '../tiles/tileCounts'
import { withTileRemoved } from '../tiles/tileCounts'

const isNumberIndex = (index: number): boolean => index < 27

const rankOfIndex = (index: number): number => (index % 9) + 1

interface WalkInput {
  readonly original: TileCounts
  readonly maxBlocks: number
  readonly base: number
}

const walk = (
  input: WalkInput,
  counts: TileCounts,
  startIndex: number,
  melds: number,
  partials: number,
  pairFixed: boolean,
): number => {
  const value =
    input.base - 2 * melds - partials - (pairFixed ? 1 : 0)
  if (melds + partials >= input.maxBlocks) {
    return value
  }
  const index = counts.findIndex((c, i) => i >= startIndex && c > 0)
  if (index === -1) {
    return value
  }
  const count = counts[index] ?? 0
  const mutableCandidates: number[] = [
    walk(input, counts, index + 1, melds, partials, pairFixed),
  ]
  if (count >= 3) {
    mutableCandidates.push(
      walk(
        input,
        withTileRemoved(counts, index, 3),
        index,
        melds + 1,
        partials,
        pairFixed,
      ),
    )
  }
  if (
    isNumberIndex(index) &&
    rankOfIndex(index) <= 7 &&
    (counts[index + 1] ?? 0) > 0 &&
    (counts[index + 2] ?? 0) > 0
  ) {
    const removed = withTileRemoved(
      withTileRemoved(withTileRemoved(counts, index), index + 1),
      index + 2,
    )
    mutableCandidates.push(
      walk(input, removed, index, melds + 1, partials, pairFixed),
    )
  }
  if (count >= 2 && (input.original[index] ?? 0) < 4) {
    mutableCandidates.push(
      walk(
        input,
        withTileRemoved(counts, index, 2),
        index + 1,
        melds,
        partials + 1,
        pairFixed,
      ),
    )
  }
  if (
    isNumberIndex(index) &&
    rankOfIndex(index) <= 8 &&
    (counts[index + 1] ?? 0) > 0
  ) {
    mutableCandidates.push(
      walk(
        input,
        withTileRemoved(withTileRemoved(counts, index), index + 1),
        index,
        melds,
        partials + 1,
        pairFixed,
      ),
    )
  }
  if (
    isNumberIndex(index) &&
    rankOfIndex(index) <= 7 &&
    (counts[index + 2] ?? 0) > 0
  ) {
    mutableCandidates.push(
      walk(
        input,
        withTileRemoved(withTileRemoved(counts, index), index + 2),
        index,
        melds,
        partials + 1,
        pairFixed,
      ),
    )
  }
  return Math.min(...mutableCandidates)
}

export const standardShanten = (
  counts: TileCounts,
  meldCount = 0,
): number => {
  const input: WalkInput = {
    original: counts,
    maxBlocks: 4 - meldCount,
    base: 8 - 2 * meldCount,
  }
  const noPair = walk(input, counts, 0, 0, 0, false)
  const withPair = counts.reduce((best, count, index) => {
    if (count < 2) {
      return best
    }
    const candidate = walk(
      input,
      withTileRemoved(counts, index, 2),
      0,
      0,
      0,
      true,
    )
    return Math.min(best, candidate)
  }, Number.POSITIVE_INFINITY)
  return Math.min(noPair, withPair)
}
