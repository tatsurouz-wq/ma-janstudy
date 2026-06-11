import type { Difficulty } from './gameState'

export type GameAction =
  | {
      readonly type: 'START'
      readonly seed: number
      readonly difficulty: Difficulty
    }
  | { readonly type: 'DRAW' }
  | { readonly type: 'DISCARD'; readonly tileId: string }
  | { readonly type: 'DECLARE_RIICHI'; readonly discardTileId: string }
  | { readonly type: 'DECLARE_TSUMO' }
