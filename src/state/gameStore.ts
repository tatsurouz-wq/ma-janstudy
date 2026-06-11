import { create } from 'zustand'
import type { GameAction } from '@/core/game/actions'
import type { GameState } from '@/core/game/gameState'
import { INITIAL_GAME_STATE } from '@/core/game/gameState'
import { gameReducer } from '@/core/game/gameReducer'

interface GameStore {
  readonly game: GameState
  readonly dispatch: (action: GameAction) => void
}

export const useGameStore = create<GameStore>()((set) => ({
  game: INITIAL_GAME_STATE,
  dispatch: (action) =>
    set((store) => ({ game: gameReducer(store.game, action) })),
}))
