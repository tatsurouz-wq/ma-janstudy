import { countsFromTiles } from '../tiles/tileCounts'
import { shanten } from '../hand/shanten'
import { waitingTiles } from '../hand/waits'
import { ukeire } from '../hand/ukeire'
import { calculateScore } from '../score/calculate'
import type { ScoreResult } from '../score/types'
import { DEFAULT_RULE } from '../rules/ruleset'
import type { GameState } from './gameState'

export const currentShanten = (state: GameState): number => {
  if (state.hand.length === 0) {
    return 8
  }
  const tiles =
    state.drawnTile !== null
      ? [...state.hand, state.drawnTile]
      : [...state.hand]
  return shanten(countsFromTiles(tiles.map((t) => t.tile)))
}

export const currentWaits = (state: GameState): readonly number[] => {
  if (state.hand.length !== 13) {
    return []
  }
  return waitingTiles(countsFromTiles(state.hand.map((t) => t.tile)))
}

export const visibleCounts = (state: GameState) =>
  countsFromTiles([
    ...state.discards.map((t) => t.tile),
    ...state.doraIndicators.map((t) => t.tile),
  ])

export interface DiscardEvaluation {
  readonly tileId: string
  readonly shantenAfter: number
  readonly ukeireCount: number
}

export const discardEvaluations = (
  state: GameState,
): readonly DiscardEvaluation[] => {
  if (state.phase !== 'awaitingDiscard' || state.drawnTile === null) {
    return []
  }
  const all = [...state.hand, state.drawnTile]
  const visible = visibleCounts(state)
  return all.map((candidate) => {
    const remaining = all.filter((t) => t.id !== candidate.id)
    const counts = countsFromTiles(remaining.map((t) => t.tile))
    const shantenAfter = shanten(counts)
    const ukeireCount = ukeire(counts, visible).reduce(
      (sum, entry) => sum + entry.remaining,
      0,
    )
    return { tileId: candidate.id, shantenAfter, ukeireCount }
  })
}

export const solveTsumo = (state: GameState): ScoreResult | null => {
  if (state.drawnTile === null) {
    return null
  }
  const concealed = [...state.hand, state.drawnTile]
  const outcome = calculateScore({
    concealed: concealed.map((t) => t.tile),
    melds: [],
    winTile: state.drawnTile.tile,
    win: {
      winType: 'tsumo',
      riichi: state.isRiichi ? 'riichi' : 'none',
      ippatsu: state.isRiichi && state.riichiTurn === state.turn - 1,
      haitei: state.turn >= state.maxTurns || state.wall.length === 0,
      houtei: false,
      rinshan: false,
      chankan: false,
      tenhou: false,
      chiihou: false,
      seatWind: 1,
      roundWind: 1,
    },
    doraIndicators: state.doraIndicators.map((t) => t.tile),
    uraIndicators: state.isRiichi
      ? state.uraIndicators.map((t) => t.tile)
      : [],
    redFives: concealed.filter((t) => t.isRed).length,
    honba: 0,
    kyotaku: 0,
    rule: DEFAULT_RULE,
  })
  return outcome.ok ? outcome.result : null
}

export const canDeclareTsumo = (state: GameState): boolean =>
  state.phase === 'awaitingDiscard' && solveTsumo(state) !== null

export const canDeclareRiichi = (state: GameState): boolean => {
  if (
    state.phase !== 'awaitingDiscard' ||
    state.drawnTile === null ||
    state.isRiichi
  ) {
    return false
  }
  return discardEvaluations(state).some((e) => e.shantenAfter === 0)
}
