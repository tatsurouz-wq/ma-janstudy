import { describe, expect, it } from 'vitest'
import { DEFAULT_RULE } from '../rules/ruleset'
import { calculatePoints } from './points'

const ron = (han: number, fu: number, isDealer = false) =>
  calculatePoints(han, fu, false, 1, isDealer, 'ron', 0, 0, DEFAULT_RULE)

const tsumo = (han: number, fu: number, isDealer = false) =>
  calculatePoints(han, fu, false, 1, isDealer, 'tsumo', 0, 0, DEFAULT_RULE)

describe('点数表（子のロン）', () => {
  it.each([
    [1, 30, 1000],
    [2, 30, 2000],
    [3, 30, 3900],
    [4, 30, 7700],
    [1, 40, 1300],
    [2, 40, 2600],
    [3, 40, 5200],
    [4, 40, 8000],
    [2, 25, 1600],
    [3, 25, 3200],
    [4, 25, 6400],
    [1, 110, 3600],
    [2, 110, 7100],
  ])('%i翻%i符 = %i点', (han, fu, expected) => {
    const result = ron(han, fu)
    expect(result.payments.type).toBe('ron')
    expect(result.payments.total).toBe(expected)
  })

  it('3翻70符は基本点2240で満貫に切り上げ', () => {
    const result = ron(3, 70)
    expect(result.limit).toBe('mangan')
    expect(result.payments.total).toBe(8000)
  })
})

describe('点数表（親のロン）', () => {
  it.each([
    [1, 30, 1500],
    [2, 30, 2900],
    [3, 30, 5800],
    [4, 30, 11600],
  ])('%i翻%i符 = %i点', (han, fu, expected) => {
    expect(ron(han, fu, true).payments.total).toBe(expected)
  })
})

describe('ツモの支払い', () => {
  it('子の2翻30符ツモは 500/1000', () => {
    const result = tsumo(2, 30)
    expect(result.payments).toMatchObject({
      type: 'tsumo-nondealer',
      fromOthers: 500,
      fromDealer: 1000,
      total: 2000,
    })
  })

  it('親の2翻30符ツモは 1000オール', () => {
    const result = tsumo(2, 30, true)
    expect(result.payments).toMatchObject({
      type: 'tsumo-dealer',
      fromEach: 1000,
      total: 3000,
    })
  })

  it('子の平和ツモ（2翻20符）は 400/700', () => {
    const result = tsumo(2, 20)
    expect(result.payments).toMatchObject({
      fromOthers: 400,
      fromDealer: 700,
      total: 1500,
    })
  })
})

describe('満貫以上の打ち切り', () => {
  it.each([
    [5, 'mangan', 8000],
    [6, 'haneman', 12000],
    [7, 'haneman', 12000],
    [8, 'baiman', 16000],
    [10, 'baiman', 16000],
    [11, 'sanbaiman', 24000],
    [13, 'yakuman', 32000],
  ] as const)('%i翻は%s（子ロン%i点）', (han, limit, expected) => {
    const result = ron(han, 30)
    expect(result.limit).toBe(limit)
    expect(result.payments.total).toBe(expected)
  })

  it('親の役満ロンは48000点', () => {
    const result = calculatePoints(
      13,
      0,
      true,
      1,
      true,
      'ron',
      0,
      0,
      DEFAULT_RULE,
    )
    expect(result.payments.total).toBe(48000)
  })

  it('切り上げ満貫ルールで4翻30符は8000点', () => {
    const result = calculatePoints(
      4,
      30,
      false,
      1,
      false,
      'ron',
      0,
      0,
      { ...DEFAULT_RULE, kiriageMangan: true },
    )
    expect(result.limit).toBe('mangan')
    expect(result.payments.total).toBe(8000)
  })
})

describe('本場と供託', () => {
  it('ロンは1本場につき300点加算', () => {
    expect(
      calculatePoints(1, 30, false, 1, false, 'ron', 2, 0, DEFAULT_RULE)
        .payments.total,
    ).toBe(1600)
  })

  it('ツモは1本場につき各家100点加算、供託は1000点ずつ', () => {
    const result = calculatePoints(
      2,
      30,
      false,
      1,
      false,
      'tsumo',
      1,
      2,
      DEFAULT_RULE,
    )
    expect(result.payments).toMatchObject({
      fromOthers: 600,
      fromDealer: 1100,
      total: 4300,
    })
  })
})
