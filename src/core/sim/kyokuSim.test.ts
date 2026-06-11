import { describe, expect, it } from 'vitest'
import { createRng } from '../tiles/random'
import { calculateScore } from '../score/calculate'
import { DEFAULT_RULE } from '../rules/ruleset'
import { seatWindFor } from './seatTypes'
import type { Scores } from './scenarioEvents'
import { applyEvent, INITIAL_BOARD } from './scenarioEvents'
import type { KyokuConfig, KyokuOutcome } from './kyokuSim'
import { simulateKyoku } from './kyokuSim'

const BASE_CONFIG: KyokuConfig = {
  round: 1,
  kyoku: 1,
  dealer: 0,
  honba: 0,
  kyotaku: 0,
  scores: [25000, 25000, 25000, 25000],
}

const run = (seed: number, config: Partial<KyokuConfig> = {}): KyokuOutcome =>
  simulateKyoku(createRng(seed), { ...BASE_CONFIG, ...config })[0]

const sumOf = (scores: Scores): number => scores.reduce((a, b) => a + b, 0)

describe('simulateKyoku', () => {
  it('同一シードで完全に同じイベント列になる（決定性）', () => {
    const a = run(11)
    const b = run(11)
    expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events))
  })

  it('イベント列は kyokuStart→shuffle→wallRise→dice→deal で始まり kyokuEnd で終わる', () => {
    const outcome = run(1)
    const kinds = outcome.events.map((e) => e.kind)
    expect(kinds.slice(0, 5)).toEqual([
      'kyokuStart',
      'shuffle',
      'wallRise',
      'dice',
      'deal',
    ])
    expect(kinds.at(-1)).toBe('kyokuEnd')
    expect(kinds.at(-2)).toBe('payment')
  })

  it('配牌は各家13枚、wallRiseは136枚', () => {
    const outcome = run(2)
    const deal = outcome.events.find((e) => e.kind === 'deal')
    const wallRise = outcome.events.find((e) => e.kind === 'wallRise')
    if (deal?.kind !== 'deal' || wallRise?.kind !== 'wallRise') {
      throw new Error('イベントが見つかりません')
    }
    expect(wallRise.tiles).toHaveLength(136)
    expect(new Set(wallRise.tiles.map((t) => t.id)).size).toBe(136)
    for (const hand of deal.hands) {
      expect(hand).toHaveLength(13)
    }
  })

  it('点数移動後の4人合計+供託は常に100000点', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const outcome = run(seed)
      expect(sumOf(outcome.scoresAfter) + outcome.kyotakuAfter * 1000).toBe(
        100000,
      )
    }
  })

  it('和了イベントの結果はcalculateScoreで再現できる', () => {
    const found = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      .map((seed) => run(seed))
      .find((o) => o.result.type === 'win')
    expect(found).toBeDefined()
    const win = found?.events.find((e) => e.kind === 'win')
    if (found === undefined || win?.kind !== 'win') {
      throw new Error('和了イベントなし')
    }
    const board = found.events
      .slice(
        0,
        found.events.findIndex((e) => e.kind === 'win'),
      )
      .reduce(applyEvent, INITIAL_BOARD)
    const handTiles = [...board.tiles.values()]
      .filter((p) => p.zone.kind === 'hand' && p.zone.seat === win.seat)
      .map((p) => p.tile)
    const concealed =
      win.winType === 'tsumo'
        ? handTiles
        : [...handTiles, win.winTile]
    const riichiState = board.riichiDeclared[win.seat] ?? false
    const replayed = calculateScore({
      concealed: concealed.map((t) => t.tile),
      melds: [],
      winTile: win.winTile.tile,
      win: {
        winType: win.winType,
        riichi: riichiState ? 'riichi' : 'none',
        ippatsu: win.result.yaku.some((y) => y.id === 'ippatsu'),
        haitei: win.result.yaku.some((y) => y.id === 'haitei'),
        houtei: win.result.yaku.some((y) => y.id === 'houtei'),
        rinshan: false,
        chankan: false,
        tenhou: false,
        chiihou: false,
        seatWind: seatWindFor(win.seat, BASE_CONFIG.dealer),
        roundWind: 1,
      },
      doraIndicators: [
        ...[...board.tiles.values()]
          .filter((p) => p.zone.kind === 'deadWall' && p.zone.faceUp)
          .map((p) => p.tile.tile),
      ],
      uraIndicators: win.uraIndicators.map((t) => t.tile),
      redFives: concealed.filter((t) => t.isRed).length,
      honba: 0,
      kyotaku: board.kyotaku,
      rule: DEFAULT_RULE,
    })
    expect(replayed.ok).toBe(true)
    if (replayed.ok) {
      expect(replayed.result.points.payments.total).toBe(
        win.result.points.payments.total,
      )
    }
  })

  it('リーチ宣言後の打牌はすべてツモ切りで、リーチ棒は供託される', () => {
    const withRiichi = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      .map((seed) => run(seed))
      .find((o) => o.events.some((e) => e.kind === 'riichiStick'))
    expect(withRiichi).toBeDefined()
    if (withRiichi === undefined) {
      return
    }
    const events = withRiichi.events
    const stickIndex = events.findIndex((e) => e.kind === 'riichiStick')
    const stick = events[stickIndex]
    if (stick?.kind !== 'riichiStick') {
      return
    }
    const laterDiscards = events
      .slice(stickIndex)
      .filter((e) => e.kind === 'discard' && e.seat === stick.seat)
    for (const d of laterDiscards) {
      if (d.kind === 'discard') {
        expect(d.tsumogiri).toBe(true)
      }
    }
  })

  it('盤面復元: 任意のイベント時点で牌の総数が136枚保たれる', () => {
    const outcome = run(3)
    const wallRiseIndex = outcome.events.findIndex(
      (e) => e.kind === 'wallRise',
    )
    for (
      let i = wallRiseIndex + 1;
      i <= outcome.events.length;
      i += Math.max(1, Math.floor(outcome.events.length / 12))
    ) {
      const board = outcome.events.slice(0, i).reduce(applyEvent, INITIAL_BOARD)
      expect(board.tiles.size).toBe(136)
    }
  })

  it('流局時はノーテン罰符が移動し本場が増える', () => {
    const drawOutcome = Array.from({ length: 40 }, (_, seed) =>
      run(seed + 100),
    ).find((o) => o.result.type === 'draw')
    expect(drawOutcome).toBeDefined()
    if (drawOutcome === undefined || drawOutcome.result.type !== 'draw') {
      return
    }
    expect(drawOutcome.honbaAfter).toBe(1)
    const t = drawOutcome.result.tenpaiSeats.length
    const payment = drawOutcome.events.find((e) => e.kind === 'payment')
    if (payment?.kind === 'payment') {
      const transferred = payment.deltas
        .filter((d) => d > 0)
        .reduce((a, b) => a + b, 0)
      expect(transferred).toBe(t === 0 || t === 4 ? 0 : 3000)
    }
  })
})
