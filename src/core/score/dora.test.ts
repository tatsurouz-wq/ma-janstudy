import { describe, expect, it } from 'vitest'
import { countsFromTiles } from '../tiles/tileCounts'
import { parseTiles } from '../tiles/notation'
import { countDora, doraFromIndicator } from './dora'

describe('doraFromIndicator', () => {
  it('数牌は次の数字がドラ', () => {
    expect(doraFromIndicator('m3')).toBe('m4')
    expect(doraFromIndicator('p8')).toBe('p9')
  })

  it('9の次は1に循環する', () => {
    expect(doraFromIndicator('m9')).toBe('m1')
    expect(doraFromIndicator('s9')).toBe('s1')
  })

  it('風牌は東南西北の順に循環する', () => {
    expect(doraFromIndicator('z1')).toBe('z2')
    expect(doraFromIndicator('z4')).toBe('z1')
  })

  it('三元牌は白發中の順に循環する', () => {
    expect(doraFromIndicator('z5')).toBe('z6')
    expect(doraFromIndicator('z7')).toBe('z5')
  })
})

describe('countDora', () => {
  it('手牌中のドラ枚数を数える', () => {
    const hand = countsFromTiles(parseTiles('44m456p789s11122z'))
    expect(countDora(hand, ['m3'])).toBe(2)
  })

  it('複数の表示牌に対応する', () => {
    const hand = countsFromTiles(parseTiles('44m456p789s11122z'))
    expect(countDora(hand, ['m3', 'p3'])).toBe(3)
    expect(countDora(hand, ['m3', 'm3'])).toBe(4)
  })

  it('該当なしは0', () => {
    const hand = countsFromTiles(parseTiles('44m456p789s11122z'))
    expect(countDora(hand, ['s1'])).toBe(0)
  })
})
