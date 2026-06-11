import type { Tile } from '@/core/tiles/tile'
import { isNumberTile, numberRank, suitOf, tileToIndex } from '@/core/tiles/tile'
import type { Meld, MeldType, Wind } from '@/core/score/types'

export interface PickedTile {
  readonly tile: Tile
  readonly isRed: boolean
}

export interface CalculatorState {
  readonly concealed: readonly PickedTile[]
  readonly melds: readonly Meld[]
  readonly winTileIndex: number | null
  readonly winType: 'tsumo' | 'ron'
  readonly seatWind: Wind
  readonly roundWind: Wind
  readonly riichi: 'none' | 'riichi' | 'double'
  readonly ippatsu: boolean
  readonly doraIndicators: readonly Tile[]
  readonly uraIndicators: readonly Tile[]
  readonly honba: number
  readonly meldMode: MeldType | null
}

export const INITIAL_CALCULATOR_STATE: CalculatorState = {
  concealed: [],
  melds: [],
  winTileIndex: null,
  winType: 'ron',
  seatWind: 2,
  roundWind: 1,
  riichi: 'none',
  ippatsu: false,
  doraIndicators: [],
  uraIndicators: [],
  honba: 0,
  meldMode: null,
}

export type CalculatorAction =
  | { readonly type: 'ADD_TILE'; readonly tile: Tile; readonly isRed: boolean }
  | { readonly type: 'REMOVE_TILE'; readonly index: number }
  | { readonly type: 'SET_MELD_MODE'; readonly mode: MeldType | null }
  | { readonly type: 'ADD_MELD'; readonly tile: Tile }
  | { readonly type: 'REMOVE_MELD'; readonly index: number }
  | { readonly type: 'SET_WIN_TILE'; readonly index: number }
  | { readonly type: 'SET_WIN_TYPE'; readonly winType: 'tsumo' | 'ron' }
  | { readonly type: 'SET_SEAT_WIND'; readonly wind: Wind }
  | { readonly type: 'SET_ROUND_WIND'; readonly wind: Wind }
  | { readonly type: 'SET_RIICHI'; readonly riichi: 'none' | 'riichi' | 'double' }
  | { readonly type: 'SET_IPPATSU'; readonly ippatsu: boolean }
  | { readonly type: 'ADD_DORA'; readonly tile: Tile; readonly ura: boolean }
  | { readonly type: 'REMOVE_DORA'; readonly index: number; readonly ura: boolean }
  | { readonly type: 'SET_HONBA'; readonly honba: number }
  | { readonly type: 'RESET' }

export const concealedCapacity = (state: CalculatorState): number =>
  14 - state.melds.length * 3

export const usedTileCount = (state: CalculatorState, tile: Tile): number => {
  const inHand = state.concealed.filter((t) => t.tile === tile).length
  const inMelds = state.melds
    .flatMap((m) => m.tiles)
    .filter((t) => t === tile).length
  return inHand + inMelds
}

const meldTilesFor = (mode: MeldType, tile: Tile): readonly Tile[] | null => {
  if (mode === 'chi') {
    const rank = numberRank(tile)
    if (!isNumberTile(tile) || rank === null || rank > 7) {
      return null
    }
    const suit = suitOf(tile)
    return [tile, `${suit}${rank + 1}` as Tile, `${suit}${rank + 2}` as Tile]
  }
  const count = mode === 'pon' ? 3 : 4
  return Array.from({ length: count }, () => tile)
}

const canAddMeld = (state: CalculatorState, tiles: readonly Tile[]): boolean => {
  if (state.melds.length >= 4) {
    return false
  }
  if (state.concealed.length > concealedCapacity(state) - 3) {
    return false
  }
  const mutableByTile = new Map<Tile, number>()
  for (const t of tiles) {
    mutableByTile.set(t, (mutableByTile.get(t) ?? 0) + 1)
  }
  return [...mutableByTile.entries()].every(
    ([t, n]) => usedTileCount(state, t) + n <= 4,
  )
}

export const calculatorReducer = (
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState => {
  switch (action.type) {
    case 'ADD_TILE': {
      if (state.meldMode !== null) {
        return calculatorReducer(state, {
          type: 'ADD_MELD',
          tile: action.tile,
        })
      }
      if (
        state.concealed.length >= concealedCapacity(state) ||
        usedTileCount(state, action.tile) >= 4
      ) {
        return state
      }
      const concealed = [
        ...state.concealed,
        { tile: action.tile, isRed: action.isRed },
      ]
      return { ...state, concealed, winTileIndex: concealed.length - 1 }
    }
    case 'REMOVE_TILE': {
      const concealed = state.concealed.filter((_, i) => i !== action.index)
      const winTileIndex =
        state.winTileIndex === action.index
          ? concealed.length > 0
            ? concealed.length - 1
            : null
          : state.winTileIndex !== null && state.winTileIndex > action.index
            ? state.winTileIndex - 1
            : state.winTileIndex
      return { ...state, concealed, winTileIndex }
    }
    case 'SET_MELD_MODE':
      return { ...state, meldMode: action.mode }
    case 'ADD_MELD': {
      const mode = state.meldMode ?? 'pon'
      const tiles = meldTilesFor(mode, action.tile)
      if (tiles === null || !canAddMeld(state, tiles)) {
        return { ...state, meldMode: null }
      }
      return {
        ...state,
        melds: [...state.melds, { type: mode, tiles }],
        meldMode: null,
      }
    }
    case 'REMOVE_MELD':
      return {
        ...state,
        melds: state.melds.filter((_, i) => i !== action.index),
      }
    case 'SET_WIN_TILE':
      return action.index < state.concealed.length
        ? { ...state, winTileIndex: action.index }
        : state
    case 'SET_WIN_TYPE':
      return { ...state, winType: action.winType }
    case 'SET_SEAT_WIND':
      return { ...state, seatWind: action.wind }
    case 'SET_ROUND_WIND':
      return { ...state, roundWind: action.wind }
    case 'SET_RIICHI':
      return {
        ...state,
        riichi: action.riichi,
        ippatsu: action.riichi === 'none' ? false : state.ippatsu,
      }
    case 'SET_IPPATSU':
      return { ...state, ippatsu: action.ippatsu }
    case 'ADD_DORA': {
      const key = action.ura ? 'uraIndicators' : 'doraIndicators'
      const list = state[key]
      if (list.length >= 5) {
        return state
      }
      return { ...state, [key]: [...list, action.tile] }
    }
    case 'REMOVE_DORA': {
      const key = action.ura ? 'uraIndicators' : 'doraIndicators'
      return {
        ...state,
        [key]: state[key].filter((_, i) => i !== action.index),
      }
    }
    case 'SET_HONBA':
      return { ...state, honba: Math.max(0, Math.min(9, action.honba)) }
    case 'RESET':
      return INITIAL_CALCULATOR_STATE
  }
}

export const sortedConcealed = (
  state: CalculatorState,
): readonly { readonly picked: PickedTile; readonly originalIndex: number }[] =>
  state.concealed
    .map((picked, originalIndex) => ({ picked, originalIndex }))
    .sort(
      (a, b) =>
        tileToIndex(a.picked.tile) - tileToIndex(b.picked.tile) ||
        a.originalIndex - b.originalIndex,
    )
