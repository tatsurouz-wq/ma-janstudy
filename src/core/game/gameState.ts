import type { TileInstance } from '../tiles/tile'
import type { ScoreResult } from '../score/types'

export type GamePhase =
  | 'ready'
  | 'awaitingDraw'
  | 'awaitingDiscard'
  | 'won'
  | 'exhausted'

export type Difficulty = 'easy' | 'normal' | 'hard'

export interface GameState {
  readonly phase: GamePhase
  readonly difficulty: Difficulty
  readonly wall: readonly TileInstance[]
  readonly hand: readonly TileInstance[]
  readonly drawnTile: TileInstance | null
  readonly discards: readonly TileInstance[]
  readonly doraIndicators: readonly TileInstance[]
  readonly uraIndicators: readonly TileInstance[]
  readonly isRiichi: boolean
  readonly riichiTurn: number | null
  readonly riichiTileId: string | null
  readonly turn: number
  readonly maxTurns: number
  readonly result: ScoreResult | null
}

export const INITIAL_GAME_STATE: GameState = {
  phase: 'ready',
  difficulty: 'normal',
  wall: [],
  hand: [],
  drawnTile: null,
  discards: [],
  doraIndicators: [],
  uraIndicators: [],
  isRiichi: false,
  riichiTurn: null,
  riichiTileId: null,
  turn: 0,
  maxTurns: 18,
  result: null,
}
