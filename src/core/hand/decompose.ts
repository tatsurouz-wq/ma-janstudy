import type { TileCounts } from '../tiles/tileCounts'
import { withTileRemoved } from '../tiles/tileCounts'

export type SetKind = 'shuntsu' | 'kotsu'

export interface DecomposedSet {
  readonly kind: SetKind
  readonly startIndex: number
}

export interface Decomposition {
  readonly pairIndex: number
  readonly sets: readonly DecomposedSet[]
}

const isNumberIndex = (index: number): boolean => index < 27

const rankOfIndex = (index: number): number => (index % 9) + 1

const canTakeShuntsu = (counts: TileCounts, index: number): boolean =>
  isNumberIndex(index) &&
  rankOfIndex(index) <= 7 &&
  (counts[index] ?? 0) > 0 &&
  (counts[index + 1] ?? 0) > 0 &&
  (counts[index + 2] ?? 0) > 0

const withShuntsuRemoved = (counts: TileCounts, index: number): TileCounts =>
  withTileRemoved(
    withTileRemoved(withTileRemoved(counts, index), index + 1),
    index + 2,
  )

const enumerateSets = (
  counts: TileCounts,
  startIndex: number,
): readonly (readonly DecomposedSet[])[] => {
  const index = counts.findIndex((c, i) => i >= startIndex && c > 0)
  if (index === -1) {
    return [[]]
  }
  const kotsuBranches =
    (counts[index] ?? 0) >= 3
      ? enumerateSets(withTileRemoved(counts, index, 3), index).map(
          (tail): readonly DecomposedSet[] => [
            { kind: 'kotsu', startIndex: index },
            ...tail,
          ],
        )
      : []
  const shuntsuBranches = canTakeShuntsu(counts, index)
    ? enumerateSets(withShuntsuRemoved(counts, index), index).map(
        (tail): readonly DecomposedSet[] => [
          { kind: 'shuntsu', startIndex: index },
          ...tail,
        ],
      )
    : []
  return [...kotsuBranches, ...shuntsuBranches]
}

const decompositionKey = (d: Decomposition): string =>
  `${d.pairIndex}|${d.sets
    .map((s) => `${s.kind}:${s.startIndex}`)
    .sort()
    .join(',')}`

export const decomposeStandard = (
  counts: TileCounts,
): readonly Decomposition[] => {
  const candidates = counts.flatMap((count, pairIndex) => {
    if (count < 2) {
      return []
    }
    const rest = withTileRemoved(counts, pairIndex, 2)
    return enumerateSets(rest, 0).map(
      (sets): Decomposition => ({ pairIndex, sets }),
    )
  })
  const mutableSeen = new Set<string>()
  return candidates.filter((d) => {
    const key = decompositionKey(d)
    if (mutableSeen.has(key)) {
      return false
    }
    mutableSeen.add(key)
    return true
  })
}
