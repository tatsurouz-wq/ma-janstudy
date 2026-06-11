import { createRng, type Rng } from '../tiles/random'
import { createWall } from '../tiles/wall'
import type { TileInstance } from '../tiles/tile'
import { countsFromTiles } from '../tiles/tileCounts'
import { shanten } from '../hand/shanten'
import type { GameAction } from './actions'
import type { Difficulty, GameState } from './gameState'
import { INITIAL_GAME_STATE } from './gameState'
import { solveTsumo } from './selectors'

const DIFFICULTY_MAX_TURNS: Readonly<Record<Difficulty, number>> = {
  easy: 18,
  normal: 18,
  hard: 15,
}

const DIFFICULTY_MAX_SHANTEN: Readonly<Record<Difficulty, number>> = {
  easy: 2,
  normal: 4,
  hard: 8,
}

const MAX_DEAL_ATTEMPTS = 50

interface Deal {
  readonly hand: readonly TileInstance[]
  readonly wall: readonly TileInstance[]
  readonly doraIndicators: readonly TileInstance[]
  readonly uraIndicators: readonly TileInstance[]
}

const dealOnce = (rng: Rng): readonly [Deal, Rng] => {
  const [wall, nextRng] = createWall(rng)
  const hand = wall.slice(0, 13)
  const doraIndicators = wall.slice(13, 14)
  const uraIndicators = wall.slice(14, 15)
  return [
    { hand, wall: wall.slice(15), doraIndicators, uraIndicators },
    nextRng,
  ]
}

const dealForDifficulty = (seed: number, difficulty: Difficulty): Deal => {
  const target = DIFFICULTY_MAX_SHANTEN[difficulty]
  const attempt = (rng: Rng, remaining: number): Deal => {
    const [deal, nextRng] = dealOnce(rng)
    if (remaining <= 0) {
      return deal
    }
    const handShanten = shanten(
      countsFromTiles(deal.hand.map((t) => t.tile)),
    )
    return handShanten <= target
      ? deal
      : attempt(nextRng, remaining - 1)
  }
  return attempt(createRng(seed), MAX_DEAL_ATTEMPTS)
}

export const gameReducer = (
  state: GameState,
  action: GameAction,
): GameState => {
  switch (action.type) {
    case 'START': {
      const deal = dealForDifficulty(action.seed, action.difficulty)
      return {
        ...INITIAL_GAME_STATE,
        phase: 'awaitingDraw',
        difficulty: action.difficulty,
        maxTurns: DIFFICULTY_MAX_TURNS[action.difficulty],
        hand: deal.hand,
        wall: deal.wall,
        doraIndicators: deal.doraIndicators,
        uraIndicators: deal.uraIndicators,
      }
    }
    case 'DRAW': {
      if (state.phase !== 'awaitingDraw') {
        return state
      }
      if (state.turn >= state.maxTurns || state.wall.length === 0) {
        return { ...state, phase: 'exhausted' }
      }
      const drawnTile = state.wall[0] ?? null
      return {
        ...state,
        phase: 'awaitingDiscard',
        wall: state.wall.slice(1),
        drawnTile,
        turn: state.turn + 1,
      }
    }
    case 'DISCARD': {
      if (state.phase !== 'awaitingDiscard' || state.drawnTile === null) {
        return state
      }
      if (state.isRiichi && action.tileId !== state.drawnTile.id) {
        return state
      }
      const all = [...state.hand, state.drawnTile]
      const discarded = all.find((t) => t.id === action.tileId)
      if (discarded === undefined) {
        return state
      }
      return {
        ...state,
        phase: 'awaitingDraw',
        hand: all.filter((t) => t.id !== action.tileId),
        drawnTile: null,
        discards: [...state.discards, discarded],
      }
    }
    case 'DECLARE_RIICHI': {
      if (
        state.phase !== 'awaitingDiscard' ||
        state.drawnTile === null ||
        state.isRiichi
      ) {
        return state
      }
      const all = [...state.hand, state.drawnTile]
      const remaining = all.filter((t) => t.id !== action.discardTileId)
      if (remaining.length !== 13) {
        return state
      }
      const isTenpai =
        shanten(countsFromTiles(remaining.map((t) => t.tile))) === 0
      if (!isTenpai) {
        return state
      }
      const discarded = all.find((t) => t.id === action.discardTileId)
      if (discarded === undefined) {
        return state
      }
      return {
        ...state,
        phase: 'awaitingDraw',
        hand: remaining,
        drawnTile: null,
        discards: [...state.discards, discarded],
        isRiichi: true,
        riichiTurn: state.turn,
        riichiTileId: discarded.id,
      }
    }
    case 'DECLARE_TSUMO': {
      if (state.phase !== 'awaitingDiscard' || state.drawnTile === null) {
        return state
      }
      const outcome = solveTsumo(state)
      if (outcome === null) {
        return state
      }
      return { ...state, phase: 'won', result: outcome }
    }
  }
}
