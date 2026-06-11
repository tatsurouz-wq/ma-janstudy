import type { Tile, TileInstance } from '../tiles/tile'
import { tileToIndex } from '../tiles/tile'
import type { TileCounts } from '../tiles/tileCounts'
import { countsFromTiles, withTileRemoved } from '../tiles/tileCounts'
import { shanten } from '../hand/shanten'
import { ukeire } from '../hand/ukeire'

export interface DiscardKindEvaluation {
  readonly tile: Tile
  readonly shantenAfter: number
  readonly ukeireCount: number
}

export interface DiscardDecision {
  readonly tileId: string
  readonly shantenAfter: number
  readonly declareRiichi: boolean
}

const distinctTiles = (hand: readonly TileInstance[]): readonly Tile[] =>
  [...new Set(hand.map((t) => t.tile))]

export const evaluateDiscardKinds = (
  hand14: readonly TileInstance[],
  visible: TileCounts,
): readonly DiscardKindEvaluation[] => {
  const counts = countsFromTiles(hand14.map((t) => t.tile))
  const shantenByKind = distinctTiles(hand14).map((tile) => {
    const remaining = withTileRemoved(counts, tileToIndex(tile))
    return { tile, remaining, shantenAfter: shanten(remaining) }
  })
  const best = Math.min(...shantenByKind.map((e) => e.shantenAfter))
  return shantenByKind.map((entry) => ({
    tile: entry.tile,
    shantenAfter: entry.shantenAfter,
    ukeireCount:
      entry.shantenAfter === best
        ? ukeire(entry.remaining, visible).reduce(
            (sum, u) => sum + u.remaining,
            0,
          )
        : 0,
  }))
}

const pickInstance = (
  hand14: readonly TileInstance[],
  tile: Tile,
): TileInstance => {
  const candidates = hand14.filter((t) => t.tile === tile)
  const sorted = [...candidates].sort((a, b) => {
    if (a.isRed !== b.isRed) {
      return a.isRed ? 1 : -1
    }
    return a.id.localeCompare(b.id)
  })
  const picked = sorted[0]
  if (picked === undefined) {
    throw new Error(`手牌に${tile}がありません`)
  }
  return picked
}

const bestKind = (
  evaluations: readonly DiscardKindEvaluation[],
): DiscardKindEvaluation => {
  const sorted = [...evaluations].sort(
    (a, b) =>
      a.shantenAfter - b.shantenAfter ||
      b.ukeireCount - a.ukeireCount ||
      tileToIndex(b.tile) - tileToIndex(a.tile),
  )
  const top = sorted[0]
  if (top === undefined) {
    throw new Error('打牌候補がありません')
  }
  return top
}

export interface ChooseDiscardOptions {
  readonly alreadyRiichi: boolean
  readonly canRiichi: boolean
}

export const chooseDiscard = (
  hand14: readonly TileInstance[],
  drawnTile: TileInstance,
  visible: TileCounts,
  options: ChooseDiscardOptions,
): DiscardDecision => {
  if (options.alreadyRiichi) {
    return {
      tileId: drawnTile.id,
      shantenAfter: 0,
      declareRiichi: false,
    }
  }
  const evaluations = evaluateDiscardKinds(hand14, visible)
  const top = bestKind(evaluations)
  const declareRiichi = options.canRiichi && top.shantenAfter === 0
  return {
    tileId: pickInstance(hand14, top.tile).id,
    shantenAfter: top.shantenAfter,
    declareRiichi,
  }
}
