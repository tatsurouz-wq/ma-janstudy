import { describe, expect, it } from 'vitest'
import type { CalculatorAction, CalculatorState } from './calculatorState'
import {
  calculatorReducer,
  concealedCapacity,
  INITIAL_CALCULATOR_STATE,
} from './calculatorState'

const apply = (
  actions: readonly CalculatorAction[],
  initial: CalculatorState = INITIAL_CALCULATOR_STATE,
): CalculatorState => actions.reduce(calculatorReducer, initial)

describe('calculatorReducer', () => {
  it('牌を追加すると最後の牌が和了牌になる', () => {
    const state = apply([
      { type: 'ADD_TILE', tile: 'm1', isRed: false },
      { type: 'ADD_TILE', tile: 'p5', isRed: true },
    ])
    expect(state.concealed).toHaveLength(2)
    expect(state.winTileIndex).toBe(1)
  })

  it('同一牌は4枚まで', () => {
    const add: CalculatorAction = { type: 'ADD_TILE', tile: 'm1', isRed: false }
    const state = apply([add, add, add, add, add])
    expect(state.concealed).toHaveLength(4)
  })

  it('手牌は14枚まで、副露1つにつき3枚減る', () => {
    const fill = Array.from({ length: 20 }, (_, i): CalculatorAction => ({
      type: 'ADD_TILE',
      tile: i % 2 === 0 ? 'm1' : 'm2',
      isRed: false,
    }))
    const full = apply([
      { type: 'ADD_TILE', tile: 's1', isRed: false },
      { type: 'ADD_TILE', tile: 's1', isRed: false },
      { type: 'ADD_TILE', tile: 's1', isRed: false },
      { type: 'ADD_TILE', tile: 's2', isRed: false },
      ...fill,
    ])
    expect(full.concealed.length).toBeLessThanOrEqual(14)

    const withMeld = apply([
      { type: 'SET_MELD_MODE', mode: 'pon' },
      { type: 'ADD_TILE', tile: 'z5', isRed: false },
    ])
    expect(withMeld.melds).toHaveLength(1)
    expect(concealedCapacity(withMeld)).toBe(11)
  })

  it('チーは連続3枚を追加し、8以上の牌からは作れない', () => {
    const ok = apply([
      { type: 'SET_MELD_MODE', mode: 'chi' },
      { type: 'ADD_TILE', tile: 'm7', isRed: false },
    ])
    expect(ok.melds[0]?.tiles).toEqual(['m7', 'm8', 'm9'])

    const ng = apply([
      { type: 'SET_MELD_MODE', mode: 'chi' },
      { type: 'ADD_TILE', tile: 'm8', isRed: false },
    ])
    expect(ng.melds).toHaveLength(0)
  })

  it('暗槓は同一牌4枚を使う', () => {
    const state = apply([
      { type: 'SET_MELD_MODE', mode: 'ankan' },
      { type: 'ADD_TILE', tile: 'z7', isRed: false },
    ])
    expect(state.melds[0]).toEqual({
      type: 'ankan',
      tiles: ['z7', 'z7', 'z7', 'z7'],
    })
  })

  it('牌を削除すると和了牌の位置を調整する', () => {
    const state = apply([
      { type: 'ADD_TILE', tile: 'm1', isRed: false },
      { type: 'ADD_TILE', tile: 'm2', isRed: false },
      { type: 'ADD_TILE', tile: 'm3', isRed: false },
      { type: 'SET_WIN_TILE', index: 2 },
      { type: 'REMOVE_TILE', index: 0 },
    ])
    expect(state.winTileIndex).toBe(1)
    expect(state.concealed.map((t) => t.tile)).toEqual(['m2', 'm3'])
  })

  it('リーチを解除すると一発も解除される', () => {
    const state = apply([
      { type: 'SET_RIICHI', riichi: 'riichi' },
      { type: 'SET_IPPATSU', ippatsu: true },
      { type: 'SET_RIICHI', riichi: 'none' },
    ])
    expect(state.ippatsu).toBe(false)
  })
})
