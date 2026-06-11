import { describe, expect, it } from 'vitest'
import { countsFromTiles } from '../tiles/tileCounts'
import { shanten } from '../hand/shanten'
import type { GameAction } from './actions'
import type { GameState } from './gameState'
import { INITIAL_GAME_STATE } from './gameState'
import { gameReducer } from './gameReducer'
import {
  canDeclareTsumo,
  currentShanten,
  discardEvaluations,
} from './selectors'

const start = (seed = 1, difficulty: GameState['difficulty'] = 'normal') =>
  gameReducer(INITIAL_GAME_STATE, { type: 'START', seed, difficulty })

const apply = (state: GameState, actions: readonly GameAction[]) =>
  actions.reduce(gameReducer, state)

describe('gameReducer', () => {
  it('STARTで配牌13枚・ドラ表示1枚・残り山が正しい', () => {
    const state = start()
    expect(state.phase).toBe('awaitingDraw')
    expect(state.hand).toHaveLength(13)
    expect(state.doraIndicators).toHaveLength(1)
    expect(state.uraIndicators).toHaveLength(1)
    expect(state.wall.length).toBe(136 - 13 - 2)
    expect(state.turn).toBe(0)
  })

  it('同一シードなら同一の配牌になる', () => {
    const a = start(42)
    const b = start(42)
    expect(a.hand.map((t) => t.id)).toEqual(b.hand.map((t) => t.id))
    expect(a.doraIndicators[0]?.id).toBe(b.doraIndicators[0]?.id)
  })

  it('かんたんは2向聴以内で配牌される', () => {
    for (const seed of [1, 2, 3, 10, 99]) {
      const state = start(seed, 'easy')
      const counts = countsFromTiles(state.hand.map((t) => t.tile))
      expect(shanten(counts)).toBeLessThanOrEqual(2)
    }
  })

  it('むずかしいはツモ回数15回', () => {
    expect(start(1, 'hard').maxTurns).toBe(15)
    expect(start(1, 'normal').maxTurns).toBe(18)
  })

  it('DRAWでツモ牌が立ち、DISCARDで河に出て手牌13枚に戻る', () => {
    const drawn = apply(start(), [{ type: 'DRAW' }])
    expect(drawn.phase).toBe('awaitingDiscard')
    expect(drawn.drawnTile).not.toBeNull()
    expect(drawn.turn).toBe(1)

    const tileId = drawn.drawnTile?.id ?? ''
    const discarded = apply(drawn, [{ type: 'DISCARD', tileId }])
    expect(discarded.phase).toBe('awaitingDraw')
    expect(discarded.hand).toHaveLength(13)
    expect(discarded.discards).toHaveLength(1)
    expect(discarded.discards[0]?.id).toBe(tileId)
  })

  it('手出しもできる（ツモ牌が手に入り選んだ牌が河へ）', () => {
    const drawn = apply(start(), [{ type: 'DRAW' }])
    const handTileId = drawn.hand[0]?.id ?? ''
    const next = apply(drawn, [{ type: 'DISCARD', tileId: handTileId }])
    expect(next.hand.some((t) => t.id === drawn.drawnTile?.id)).toBe(true)
    expect(next.discards[0]?.id).toBe(handTileId)
  })

  it('ツモ回数上限に達するとDRAWで流局する', () => {
    const initial = start(1, 'hard')
    const played = Array.from({ length: 15 }).reduce<GameState>((state) => {
      const drawn = gameReducer(state, { type: 'DRAW' })
      if (drawn.phase !== 'awaitingDiscard') {
        return drawn
      }
      return gameReducer(drawn, {
        type: 'DISCARD',
        tileId: drawn.drawnTile?.id ?? '',
      })
    }, initial)
    const exhausted = gameReducer(played, { type: 'DRAW' })
    expect(exhausted.phase).toBe('exhausted')
  })

  it('テンパイしていない手ではリーチできない', () => {
    const drawn = apply(start(99, 'hard'), [{ type: 'DRAW' }])
    const before = currentShanten(drawn)
    if (before > 0) {
      const rejected = gameReducer(drawn, {
        type: 'DECLARE_RIICHI',
        discardTileId: drawn.drawnTile?.id ?? '',
      })
      expect(rejected.isRiichi).toBe(false)
    }
  })

  it('phase不一致のアクションは無視される', () => {
    const state = start()
    expect(gameReducer(state, { type: 'DISCARD', tileId: 'x' })).toBe(state)
    expect(gameReducer(state, { type: 'DECLARE_TSUMO' })).toBe(state)
    const drawn = gameReducer(state, { type: 'DRAW' })
    expect(gameReducer(drawn, { type: 'DRAW' })).toBe(drawn)
  })

  it('リーチ中は手出しできずツモ切りのみ', () => {
    const tenpaiState: GameState = {
      ...start(),
      isRiichi: true,
      riichiTurn: 1,
    }
    const drawn = gameReducer(tenpaiState, { type: 'DRAW' })
    const handTileId = drawn.hand[0]?.id ?? ''
    const rejected = gameReducer(drawn, { type: 'DISCARD', tileId: handTileId })
    expect(rejected).toBe(drawn)
    const accepted = gameReducer(drawn, {
      type: 'DISCARD',
      tileId: drawn.drawnTile?.id ?? '',
    })
    expect(accepted.phase).toBe('awaitingDraw')
  })

  it('和了形でなければツモ宣言できない', () => {
    const drawn = apply(start(7), [{ type: 'DRAW' }])
    if (!canDeclareTsumo(drawn)) {
      expect(gameReducer(drawn, { type: 'DECLARE_TSUMO' })).toBe(drawn)
    }
  })

  it('ツモ和了で結果が格納される（貪欲打牌で実際に和了する）', { timeout: 120000 }, () => {
    const playGreedy = (seed: number): GameState => {
      const initial = start(seed, 'easy')
      return Array.from({ length: 18 }).reduce<GameState>((state) => {
        if (state.phase === 'won' || state.phase === 'exhausted') {
          return state
        }
        const drawn = gameReducer(state, { type: 'DRAW' })
        if (drawn.phase !== 'awaitingDiscard') {
          return drawn
        }
        if (canDeclareTsumo(drawn)) {
          return gameReducer(drawn, { type: 'DECLARE_TSUMO' })
        }
        const best = [...discardEvaluations(drawn)].sort(
          (a, b) =>
            a.shantenAfter - b.shantenAfter || b.ukeireCount - a.ukeireCount,
        )[0]
        return gameReducer(drawn, {
          type: 'DISCARD',
          tileId: best?.tileId ?? drawn.drawnTile?.id ?? '',
        })
      }, initial)
    }
    const found = (() => {
      for (let seed = 0; seed < 60; seed += 1) {
        const final = playGreedy(seed)
        if (final.phase === 'won') {
          return final
        }
      }
      return null
    })()
    expect(found).not.toBeNull()
    expect(found?.result).not.toBeNull()
    expect(found?.result?.yaku.length).toBeGreaterThan(0)
    expect(found?.result?.points.payments.type).toBe('tsumo-dealer')
  })
})
