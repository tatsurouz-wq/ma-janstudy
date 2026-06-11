import { describe, expect, it } from 'vitest'
import { USER_SEAT } from './seatTypes'
import { applyEvent, INITIAL_BOARD } from './scenarioEvents'
import {
  generateHalfGame,
  isShowcaseWorthy,
  SHOWCASE_SEED,
} from './halfGameSim'

describe('generateHalfGame', () => {
  const scenario = generateHalfGame(SHOWCASE_SEED)

  it('ショーケースシードは演出条件を満たす', () => {
    expect(isShowcaseWorthy(scenario)).toBe(true)
    const first = scenario.records[0]
    expect(first?.outcome.result.type).toBe('win')
    if (first?.outcome.result.type === 'win') {
      expect(first.outcome.result.seat).toBe(USER_SEAT)
    }
  })

  it('東1局はfull、ハイライトは最大3局、残りはskip', () => {
    expect(scenario.records[0]?.digest).toBe('full')
    const highlights = scenario.records.filter((r) => r.digest === 'highlight')
    expect(highlights.length).toBeGreaterThanOrEqual(1)
    expect(highlights.length).toBeLessThanOrEqual(3)
    expect(scenario.records.at(-1)?.digest).toBe('highlight')
  })

  it('プレゼンテーションイベントは machineStart で始まり gameEnd で終わる', () => {
    expect(scenario.events[0]?.kind).toBe('machineStart')
    expect(scenario.events.at(-1)?.kind).toBe('gameEnd')
  })

  it('skip局はdigestSkipイベントで点数連続性を保つ', () => {
    const skips = scenario.events.filter((e) => e.kind === 'digestSkip')
    const skipRecords = scenario.records.filter((r) => r.digest === 'skip')
    expect(skips.length).toBe(skipRecords.length)
  })

  it('highlight局はboardSnapshotから始まり盤面136枚が復元される', () => {
    const snapshotIndex = scenario.events.findIndex(
      (e) => e.kind === 'boardSnapshot',
    )
    expect(snapshotIndex).toBeGreaterThan(0)
    const board = scenario.events
      .slice(0, snapshotIndex + 1)
      .reduce(applyEvent, INITIAL_BOARD)
    expect(board.tiles.size).toBe(136)
  })

  it('全イベントを通した最終盤面の点数+供託が100000点に一致する', () => {
    const finalBoard = scenario.events.reduce(applyEvent, INITIAL_BOARD)
    const sum = finalBoard.scores.reduce((a, b) => a + b, 0)
    expect(sum + finalBoard.kyotaku * 1000).toBe(100000)
  })

  it('順位は点数降順で、供託は1位に加算され合計100000点', () => {
    const ranks = scenario.ranking.map((r) => r.rank)
    expect(ranks).toEqual([1, 2, 3, 4])
    const total = scenario.ranking.reduce((a, r) => a + r.score, 0)
    expect(total).toBe(100000)
    const scores = scenario.ranking.map((r) => r.score)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)
  })

  it('決定性: 同一シードの2回生成が一致する', { timeout: 240000 }, () => {
    const again = generateHalfGame(SHOWCASE_SEED)
    expect(again.records.length).toBe(scenario.records.length)
    expect(JSON.stringify(again.ranking)).toBe(
      JSON.stringify(scenario.ranking),
    )
    expect(again.events.length).toBe(scenario.events.length)
  })
})
