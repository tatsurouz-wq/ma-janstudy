import { describe, expect, it } from 'vitest'
import { parseTiles } from '../tiles/notation'
import type { Tile } from '../tiles/tile'
import { DEFAULT_RULE } from '../rules/ruleset'
import { calculateScore } from './calculate'
import type { Meld, ScoreInput, ScoreResult, WinContext } from './types'

const baseWin: WinContext = {
  winType: 'ron',
  riichi: 'none',
  ippatsu: false,
  haitei: false,
  houtei: false,
  rinshan: false,
  chankan: false,
  tenhou: false,
  chiihou: false,
  seatWind: 2,
  roundWind: 1,
}

const score = (
  concealed: string,
  winTile: Tile,
  overrides: Partial<ScoreInput> = {},
  winOverrides: Partial<WinContext> = {},
) =>
  calculateScore({
    concealed: parseTiles(concealed),
    melds: [],
    winTile,
    win: { ...baseWin, ...winOverrides },
    doraIndicators: [],
    uraIndicators: [],
    redFives: 0,
    honba: 0,
    kyotaku: 0,
    rule: DEFAULT_RULE,
    ...overrides,
  })

const expectYaku = (
  outcome: ReturnType<typeof calculateScore>,
  yakuId: string,
): ScoreResult => {
  if (!outcome.ok) {
    throw new Error(`計算に失敗: ${outcome.reason}`)
  }
  expect(outcome.result.yaku.map((y) => y.id)).toContain(yakuId)
  return outcome.result
}

describe('役満の判定', () => {
  it('大三元', () => {
    const result = expectYaku(
      score('555666777z11m234p', 'p4'),
      'daisangen',
    )
    expect(result.isYakuman).toBe(true)
    expect(result.points.payments.total).toBe(32000)
  })

  it('小四喜', () => {
    expectYaku(score('111222333z44z567m', 'm5'), 'shousuushi')
  })

  it('大四喜（ダブル役満設定で64000点）', () => {
    const single = expectYaku(score('111222333444z55m', 'm5'), 'daisuushi')
    expect(single.points.payments.total).toBe(32000)

    const double = expectYaku(
      score('111222333444z55m', 'm5', {
        rule: { ...DEFAULT_RULE, doubleYakuman: true },
      }),
      'daisuushi',
    )
    expect(double.yakumanUnits).toBe(2)
    expect(double.points.payments.total).toBe(64000)
  })

  it('字一色', () => {
    expectYaku(score('111222z555666z77z', 'z7'), 'tsuuiisou')
  })

  it('複合役満の加算はstackedYakuman設定に従う', () => {
    const stacked = expectYaku(
      score('111222333444z55z', 'z5', {
        rule: { ...DEFAULT_RULE, stackedYakuman: true },
      }),
      'daisuushi',
    )
    expect(stacked.yaku.map((y) => y.id)).toContain('tsuuiisou')
    expect(stacked.yaku.map((y) => y.id)).toContain('suuankou')
    expect(stacked.yakumanUnits).toBe(3)
    expect(stacked.points.payments.total).toBe(96000)

    const unstacked = expectYaku(score('111222333444z55z', 'z5'), 'daisuushi')
    expect(unstacked.yakumanUnits).toBe(1)
  })

  it('清老頭', () => {
    expectYaku(score('111999m111p999s99p', 'm1'), 'chinroutou')
  })

  it('九蓮宝燈（純正はダブル役満設定で2倍）', () => {
    expectYaku(score('11123456789999m', 'm9'), 'chuuren')

    const junsei = expectYaku(
      score(
        '11122345678999m',
        'm2',
        { rule: { ...DEFAULT_RULE, doubleYakuman: true } },
        { winType: 'tsumo' },
      ),
      'chuuren',
    )
    expect(junsei.yakumanUnits).toBe(2)
  })

  it('四槓子', () => {
    const ankan = (tile: Tile): Meld => ({
      type: 'ankan',
      tiles: [tile, tile, tile, tile],
    })
    const outcome = score('55z', 'z5', {
      melds: [ankan('m1'), ankan('p2'), ankan('s3'), ankan('m9')],
    })
    expectYaku(outcome, 'suukantsu')
  })

  it('四暗刻単騎はデフォルトでシングル役満', () => {
    const result = expectYaku(
      score('111m222p333s444p55z', 'z5', {}, { winType: 'tsumo' }),
      'suuankou',
    )
    expect(result.yakumanUnits).toBe(1)
  })

  it('天和と地和', () => {
    expectYaku(
      score(
        '123m456p789s11122z',
        'm1',
        {},
        { winType: 'tsumo', seatWind: 1, tenhou: true },
      ),
      'tenhou',
    )
    expectYaku(
      score(
        '123m456p789s11122z',
        'm1',
        {},
        { winType: 'tsumo', seatWind: 2, chiihou: true },
      ),
      'chiihou',
    )
  })

  it('国士無双13面待ちはダブル役満設定で2倍', () => {
    const thirteenWait = expectYaku(
      score('19m19p19s12345677z', 'z7', {
        rule: { ...DEFAULT_RULE, doubleYakuman: true },
      }),
      'kokushi',
    )
    expect(thirteenWait.yakumanUnits).toBe(2)

    const singleWait = expectYaku(
      score('119m19p19s123456z7z', 'z7', {
        rule: { ...DEFAULT_RULE, doubleYakuman: true },
      }),
      'kokushi',
    )
    expect(singleWait.yakumanUnits).toBe(1)
  })
})

describe('状況役と中級役の判定', () => {
  it('海底摸月と河底撈魚', () => {
    expectYaku(
      score('234m456p789s34555s', 's3', {}, { winType: 'tsumo', haitei: true }),
      'haitei',
    )
    expectYaku(
      score('123m456p789s99s555z', 'z5', {}, { winType: 'ron', houtei: true }),
      'houtei',
    )
  })

  it('嶺上開花と搶槓', () => {
    expectYaku(
      score(
        '234m456p789s34555s',
        's3',
        {},
        { winType: 'tsumo', rinshan: true },
      ),
      'rinshan',
    )
    expectYaku(
      score('123m456p789s99s555z', 'z5', {}, { winType: 'ron', chankan: true }),
      'chankan',
    )
  })

  it('小三元', () => {
    const result = expectYaku(score('555666z77z123m456p', 'p4'), 'shousangen')
    const ids = result.yaku.map((y) => y.id)
    expect(ids).toContain('yakuhai-haku')
    expect(ids).toContain('yakuhai-hatsu')
  })

  it('三色同刻', () => {
    expectYaku(score('111m111p111s345m22z', 'm3'), 'sanshoku-doukou')
  })

  it('三槓子', () => {
    const ankan = (tile: Tile): Meld => ({
      type: 'ankan',
      tiles: [tile, tile, tile, tile],
    })
    const outcome = score('123m44z', 'm1', {
      melds: [ankan('p2'), ankan('s3'), ankan('m9')],
    })
    expectYaku(outcome, 'sankantsu')
  })

  it('ダブルリーチ', () => {
    expectYaku(
      score('234m456p789s34555s', 's3', {}, { riichi: 'double' }),
      'double-riichi',
    )
  })

  it('和了牌が手牌にない入力はinvalid-hand', () => {
    const outcome = score('123m456p789s11122z', 'm9')
    expect(outcome).toEqual({ ok: false, reason: 'invalid-hand' })
  })

  it('枚数不正の入力はinvalid-hand', () => {
    const outcome = score('123m456p789s11z', 'm1')
    expect(outcome).toEqual({ ok: false, reason: 'invalid-hand' })
  })
})
