import { describe, expect, it } from 'vitest'
import { parseTiles } from '@/core/tiles/notation'
import { calculateScore } from '@/core/score/calculate'
import { DEFAULT_RULE } from '@/core/rules/ruleset'
import type { TileInstance } from '@/core/tiles/tile'
import type { ScenarioEvent } from '@/core/sim/scenarioEvents'
import type { ScoreResult } from '@/core/score/types'
import {
  captionFor,
  INITIAL_CAPTION_STATE,
  trackKyotakuBeforeWin,
} from './captionScript'
import type { CaptionSegment } from './timelineTypes'

const tileInst = (tile: TileInstance['tile'], id: string): TileInstance => ({
  id,
  tile,
  isRed: false,
})

// 子の平和ロン（30符1翻）の ScoreResult を本場込みで生成する。
const ronResult = (honba: number): ScoreResult => {
  const outcome = calculateScore({
    concealed: parseTiles('234m456p789s34555s'),
    melds: [],
    winTile: 's3',
    win: {
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
    },
    doraIndicators: [],
    uraIndicators: [],
    redFives: 0,
    honba,
    kyotaku: 0,
    rule: DEFAULT_RULE,
  })
  if (!outcome.ok) {
    throw new Error(`計算に失敗: ${outcome.reason}`)
  }
  return outcome.result
}

const joinText = (segments: readonly CaptionSegment[]): string =>
  segments.map((s) => (s.kind === 'tile' ? '' : s.text)).join('')

const paymentCaption = (honba: number, kyotakuBeforeWin: number) => {
  const result = ronResult(honba)
  const winEvent: ScenarioEvent = {
    kind: 'win',
    seat: 1,
    winType: 'ron',
    fromSeat: 0,
    winTile: tileInst('s3', 'win-tile'),
    result,
    uraIndicators: [],
  }
  const afterWin = captionFor(winEvent, INITIAL_CAPTION_STATE, {
    userSeat: 1,
    honba,
  })
  const withKyotaku = trackKyotakuBeforeWin(afterWin.state, kyotakuBeforeWin)
  const paymentEvent: ScenarioEvent = {
    kind: 'payment',
    deltas: [0, 0, 0, 0],
    scoresAfter: [25000, 25000, 25000, 25000],
    kyotakuAfter: 0,
  }
  const res = captionFor(paymentEvent, withKyotaku, { userSeat: 1, honba })
  return { spec: res.spec, result }
}

describe('captionFor 精算字幕', () => {
  it('符を翻より先に表記する（30符2翻）', () => {
    const { spec } = paymentCaption(0, 0)
    expect(spec).not.toBeNull()
    const head = spec?.segments[0]
    expect(head?.kind).toBe('emphasis')
    if (head?.kind !== 'tile') {
      const fuIndex = head?.text.indexOf('符') ?? -1
      const hanIndex = head?.text.indexOf('翻') ?? -1
      expect(fuIndex).toBeGreaterThanOrEqual(0)
      expect(hanIndex).toBeGreaterThan(fuIndex)
      expect(head?.text).toBe('30符1翻')
    }
  })

  it('本場ぶんは点数に含めず、別途加算として表示する', () => {
    const { spec, result } = paymentCaption(2, 0)
    const text = joinText(spec?.segments ?? [])
    const payments = result.points.payments
    if (payments.type !== 'ron') {
      throw new Error('ロンのはず')
    }
    const base = (payments.fromDiscarder - 2 * 300).toLocaleString()
    expect(text).toContain(`${base}点`)
    // 本場込みの額は素点として出さない。
    expect(text).not.toContain(`${payments.fromDiscarder.toLocaleString()}点で`)
    expect(text).toContain('2本場')
    expect(text).toContain((2 * 300).toLocaleString())
  })

  it('供託があれば和了者がもらう旨を表示する', () => {
    const { spec } = paymentCaption(0, 1)
    const text = joinText(spec?.segments ?? [])
    expect(text).toContain('供託')
    expect(text).toContain('1本')
  })
})
