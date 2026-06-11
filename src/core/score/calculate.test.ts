import { describe, expect, it } from 'vitest'
import { parseTiles } from '../tiles/notation'
import type { Tile } from '../tiles/tile'
import { DEFAULT_RULE } from '../rules/ruleset'
import { calculateScore } from './calculate'
import type { ScoreInput, ScoreResult, WinContext } from './types'

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
): ReturnType<typeof calculateScore> =>
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

const expectOk = (
  outcome: ReturnType<typeof calculateScore>,
): ScoreResult => {
  if (!outcome.ok) {
    throw new Error(`計算に失敗: ${outcome.reason}`)
  }
  return outcome.result
}

describe('calculateScore ゴールデンケース', () => {
  it('平和ツモ（子）= 2翻20符 400/700', () => {
    const result = expectOk(
      score('234m456p789s34555s', 's3', {}, { winType: 'tsumo' }),
    )
    expect(result.yaku.map((y) => y.id).sort()).toEqual([
      'menzen-tsumo',
      'pinfu',
    ])
    expect(result.totalHan).toBe(2)
    expect(result.fu?.rounded).toBe(20)
    expect(result.fu?.isFixed).toBe(true)
    expect(result.points.payments).toMatchObject({
      fromOthers: 400,
      fromDealer: 700,
      total: 1500,
    })
  })

  it('平和門前ロン（子）= 1翻30符 1000点', () => {
    const result = expectOk(score('234m456p789s34555s', 's3'))
    expect(result.yaku.map((y) => y.id)).toEqual(['pinfu'])
    expect(result.fu?.rounded).toBe(30)
    expect(result.points.payments.total).toBe(1000)
  })

  it('七対子ロン（子）= 2翻25符 1600点', () => {
    const result = expectOk(score('223399m445566p88s', 's8'))
    expect(result.handKind).toBe('chiitoi')
    expect(result.yaku.map((y) => y.id)).toEqual(['chiitoi'])
    expect(result.fu?.rounded).toBe(25)
    expect(result.points.payments.total).toBe(1600)
  })

  it('国士無双（親ツモ）= 役満 16000オール', () => {
    const result = expectOk(
      score(
        '119m19p19s1234567z',
        'm1',
        {},
        { winType: 'tsumo', seatWind: 1 },
      ),
    )
    expect(result.isYakuman).toBe(true)
    expect(result.yaku.map((y) => y.id)).toEqual(['kokushi'])
    expect(result.points.payments).toMatchObject({
      type: 'tsumo-dealer',
      fromEach: 16000,
      total: 48000,
    })
  })

  it('タンヤオ三色平和の4翻30符ロン = 7700点（満貫にならない）', () => {
    const result = expectOk(score('234567m234p234s88s', 'm7'))
    expect(result.totalHan).toBe(4)
    expect(result.fu?.rounded).toBe(30)
    expect(result.points.limit).toBe('none')
    expect(result.points.payments.total).toBe(7700)
  })

  it('同じ手でも切り上げ満貫ルールなら8000点', () => {
    const result = expectOk(
      score('234567m234p234s88s', 'm7', {
        rule: { ...DEFAULT_RULE, kiriageMangan: true },
      }),
    )
    expect(result.points.limit).toBe('mangan')
    expect(result.points.payments.total).toBe(8000)
  })

  it('リーチ一発ドラ2の4翻40符ロン = 満貫8000点', () => {
    const result = expectOk(
      score(
        '123999m456p789s55s',
        'm2',
        { doraIndicators: ['s4'] },
        { riichi: 'riichi', ippatsu: true },
      ),
    )
    expect(result.totalHan).toBe(4)
    expect(result.fu?.rounded).toBe(40)
    expect(result.points.limit).toBe('mangan')
    expect(result.points.payments.total).toBe(8000)
  })

  it('高点法: 一盃口より三暗刻の解釈を採用する', () => {
    const result = expectOk(
      score('111222333m456p99s', 'p5', {}, { winType: 'tsumo' }),
    )
    expect(result.yaku.map((y) => y.id)).toContain('sanankou')
    expect(result.totalHan).toBe(3)
    const alternativeYaku = !result.yaku.some((y) => y.id === 'iipeiko')
    expect(alternativeYaku).toBe(true)
  })

  it('高点法の代替解釈（一盃口）もalternativesで参照できる', () => {
    const outcome = score('111222333m456p99s', 'p5', {}, { winType: 'tsumo' })
    if (!outcome.ok) {
      throw new Error('計算に失敗')
    }
    const hasIipeikoAlternative = outcome.alternatives.some((alt) =>
      alt.yaku.some((y) => y.id === 'iipeiko'),
    )
    expect(hasIipeikoAlternative).toBe(true)
  })

  it('役なしドラのみは和了できない', () => {
    const outcome = score('234m456p789s44p333z', 'p4', {
      doraIndicators: ['m3', 'm3'],
    })
    expect(outcome).toEqual({ ok: false, reason: 'no-yaku' })
  })

  it('和了形でない手はnot-winning', () => {
    const outcome = score('1239m456p789s1234z', 'z1')
    expect(outcome).toEqual({ ok: false, reason: 'not-winning' })
  })

  it('喰いタンなしルールでは鳴いたタンヤオは無効', () => {
    const input = {
      melds: [{ type: 'pon' as const, tiles: parseTiles('555m') }],
      rule: { ...DEFAULT_RULE, kuitan: false },
    }
    const outcome = score('234m345p888s44s', 's8', input)
    expect(outcome).toEqual({ ok: false, reason: 'no-yaku' })
  })

  it('連風牌の雀頭はデフォルト2符（設定で4符に切替可能）', () => {
    const hand = '234m999p567s678s11z'
    const win: Partial<WinContext> = { seatWind: 1, roundWind: 1, riichi: 'riichi' }
    const default2 = expectOk(score(hand, 'm4', {}, win))
    expect(default2.fu?.rounded).toBe(40)
    expect(default2.points.payments.total).toBe(2000)

    const rule4 = expectOk(
      score(hand, 'm4', { rule: { ...DEFAULT_RULE, doubleWindPairFu: 4 } }, win),
    )
    expect(rule4.fu?.rounded).toBe(50)
    expect(rule4.points.payments.total).toBe(2400)
  })

  it('喰い平和形のロンは30符に繰り上げ', () => {
    const result = expectOk(
      score('345p678s22s567m', 'm7', {
        melds: [{ type: 'chi' as const, tiles: parseTiles('234m') }],
      }),
    )
    expect(result.yaku.map((y) => y.id)).toEqual(['tanyao'])
    expect(result.fu?.rounded).toBe(30)
    expect(result.fu?.isFixed).toBe(true)
    expect(result.points.payments.total).toBe(1000)
  })

  it('鳴いた役牌のツモ = 1翻30符 300/500', () => {
    const result = expectOk(
      score('234m567p44888s', 's8', {
        melds: [{ type: 'pon' as const, tiles: parseTiles('777z') }],
      }, { winType: 'tsumo' }),
    )
    expect(result.yaku.map((y) => y.id)).toEqual(['yakuhai-chun'])
    expect(result.fu?.rounded).toBe(30)
    expect(result.points.payments).toMatchObject({
      fromOthers: 300,
      fromDealer: 500,
    })
  })

  it('リーチ時は裏ドラを数え、赤ドラも加算する', () => {
    const result = expectOk(
      score(
        '234m456p789s34555s',
        's3',
        {
          doraIndicators: ['s4'],
          uraIndicators: ['s2'],
          redFives: 1,
        },
        { winType: 'tsumo', riichi: 'riichi' },
      ),
    )
    expect(result.dora).toEqual({ omote: 3, ura: 1, aka: 1 })
    expect(result.totalHan).toBe(8)
    expect(result.points.limit).toBe('baiman')
  })

  it('ダブル役満設定: 四暗刻単騎', () => {
    const hand = '111m222p333s444p55z'
    const win: Partial<WinContext> = { winType: 'tsumo' }
    const single = expectOk(score(hand, 'z5', {}, win))
    expect(single.yaku.map((y) => y.id)).toContain('suuankou')
    expect(single.yakumanUnits).toBe(1)
    expect(single.points.payments.total).toBe(32000)

    const double = expectOk(
      score(hand, 'z5', { rule: { ...DEFAULT_RULE, doubleYakuman: true } }, win),
    )
    expect(double.yakumanUnits).toBe(2)
    expect(double.points.payments.total).toBe(64000)
  })

  it('四暗刻はロンの双碰和了では成立しない（三暗刻+対々和になる）', () => {
    const result = expectOk(
      score('111m222p333s44455z', 'z4', {}, { winType: 'ron' }),
    )
    expect(result.isYakuman).toBe(false)
    expect(result.yaku.map((y) => y.id)).toContain('sanankou')
    expect(result.yaku.map((y) => y.id)).toContain('toitoi')
  })

  it('ステップ解説が分解から支払いまで揃っている', () => {
    const result = expectOk(score('234567m234p234s88s', 'm7'))
    const kinds = result.steps.map((s) => s.kind)
    expect(kinds[0]).toBe('parse')
    expect(kinds).toContain('yaku')
    expect(kinds).toContain('fuItem')
    expect(kinds).toContain('fuRound')
    expect(kinds).toContain('base')
    expect(kinds.at(-1)).toBe('payment')
  })
})
