import { describe, expect, it } from 'vitest'
import { parseTiles } from '../tiles/notation'
import type { Tile, TileInstance } from '../tiles/tile'
import type { GameState } from './gameState'
import { INITIAL_GAME_STATE } from './gameState'
import { gameReducer } from './gameReducer'
import {
  canDeclareRiichi,
  canDeclareTsumo,
  currentShanten,
  currentWaits,
  discardEvaluations,
  solveTsumo,
  visibleCounts,
} from './selectors'

const instances = (notation: string, prefix = 'h'): readonly TileInstance[] =>
  parseTiles(notation).map((tile, i) => ({
    id: `${prefix}-${tile}-${i}`,
    tile,
    isRed: false,
  }))

const tenpaiState = (drawn: Tile | null): GameState => ({
  ...INITIAL_GAME_STATE,
  phase: drawn !== null ? 'awaitingDiscard' : 'awaitingDraw',
  hand: instances('23m456p789s11122z'),
  drawnTile:
    drawn !== null ? { id: `d-${drawn}`, tile: drawn, isRed: false } : null,
  turn: 3,
  maxTurns: 18,
  doraIndicators: instances('9p', 'dora'),
  uraIndicators: instances('1s', 'ura'),
})

describe('selectors', () => {
  it('currentShanten: 空の手牌は8、テンパイ手牌は0', () => {
    expect(currentShanten(INITIAL_GAME_STATE)).toBe(8)
    expect(currentShanten(tenpaiState(null))).toBe(0)
    expect(currentShanten(tenpaiState('z3'))).toBe(0)
  })

  it('currentWaits: 手牌13枚部分の待ちを返す', () => {
    const waits = currentWaits(tenpaiState(null))
    expect(waits.length).toBe(2)
    expect(currentWaits(tenpaiState('z3'))).toEqual(waits)
    expect(currentWaits(INITIAL_GAME_STATE)).toEqual([])
  })

  it('visibleCounts は河とドラ表示牌を合算する', () => {
    const state: GameState = {
      ...tenpaiState(null),
      discards: instances('55m5m', 'r'),
    }
    const counts = visibleCounts(state)
    expect(counts[4]).toBe(3)
    expect(counts[17]).toBe(1)
  })

  it('discardEvaluations: 打牌フェーズ以外は空', () => {
    expect(discardEvaluations(tenpaiState(null))).toEqual([])
    const evaluations = discardEvaluations(tenpaiState('z3'))
    expect(evaluations).toHaveLength(14)
    const dropDrawn = evaluations.find((e) => e.tileId === 'd-z3')
    expect(dropDrawn?.shantenAfter).toBe(0)
    expect(dropDrawn?.ukeireCount).toBeGreaterThan(0)
  })

  it('canDeclareRiichi: テンパイ維持できる打牌があるときだけ可能', () => {
    expect(canDeclareRiichi(tenpaiState('z3'))).toBe(true)
    expect(
      canDeclareRiichi({ ...tenpaiState('z3'), isRiichi: true }),
    ).toBe(false)
    expect(canDeclareRiichi(tenpaiState(null))).toBe(false)
  })

  it('solveTsumo: 和了牌なら結果を、外れ牌ならnullを返す', () => {
    expect(solveTsumo(tenpaiState('z3'))).toBeNull()
    expect(solveTsumo(tenpaiState(null))).toBeNull()
    const win = solveTsumo(tenpaiState('m1'))
    expect(win).not.toBeNull()
    expect(win?.yaku.map((y) => y.id)).toContain('menzen-tsumo')
  })

  it('canDeclareTsumo は打牌フェーズかつ和了形のときだけtrue', () => {
    expect(canDeclareTsumo(tenpaiState('m1'))).toBe(true)
    expect(canDeclareTsumo(tenpaiState('z3'))).toBe(false)
  })
})

describe('gameReducer リーチからの和了', () => {
  it('リーチ宣言後にツモ和了すると裏ドラと一発が乗る', () => {
    const withDrawn: GameState = {
      ...tenpaiState('z3'),
      wall: [{ id: 'w-m1', tile: 'm1', isRed: false }],
    }
    const declared = gameReducer(withDrawn, {
      type: 'DECLARE_RIICHI',
      discardTileId: 'd-z3',
    })
    expect(declared.isRiichi).toBe(true)
    expect(declared.riichiTileId).toBe('d-z3')
    expect(declared.phase).toBe('awaitingDraw')

    const drawn = gameReducer(declared, { type: 'DRAW' })
    expect(drawn.drawnTile?.tile).toBe('m1')

    const won = gameReducer(drawn, { type: 'DECLARE_TSUMO' })
    expect(won.phase).toBe('won')
    const ids = won.result?.yaku.map((y) => y.id) ?? []
    expect(ids).toContain('riichi')
    expect(ids).toContain('ippatsu')
    expect(ids).toContain('menzen-tsumo')
  })

  it('リーチ宣言は不正な牌IDなら無視される', () => {
    const state = tenpaiState('z3')
    expect(
      gameReducer(state, { type: 'DECLARE_RIICHI', discardTileId: 'nope' }),
    ).toBe(state)
  })

  it('DISCARDで存在しない牌IDは無視される', () => {
    const state = tenpaiState('z3')
    expect(gameReducer(state, { type: 'DISCARD', tileId: 'nope' })).toBe(state)
  })

  it('山が空のときDRAWで流局する', () => {
    const state: GameState = { ...tenpaiState(null), wall: [] }
    expect(gameReducer(state, { type: 'DRAW' }).phase).toBe('exhausted')
  })
})
