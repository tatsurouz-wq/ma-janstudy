import { describe, expect, it } from 'vitest'
import { countsFromTiles, EMPTY_COUNTS } from '../tiles/tileCounts'
import { parseTiles } from '../tiles/notation'
import { indexToTile, tileToIndex } from '../tiles/tile'
import { ukeire } from './ukeire'

const counts = (notation: string) => countsFromTiles(parseTiles(notation))

describe('ukeire', () => {
  it('両面塔子は8枚、嵌張は4枚の受け入れ', () => {
    const ryanmen = ukeire(counts('23m456p789s11z456s'), EMPTY_COUNTS)
    const ryanmenTiles = ryanmen.map((u) => indexToTile(u.tileIndex))
    expect(ryanmenTiles).toContain('m1')
    expect(ryanmenTiles).toContain('m4')
    const total = ryanmen.reduce((sum, u) => sum + u.remaining, 0)
    expect(total).toBe(8)

    const kanchan = ukeire(counts('13m456p789s11z456s'), EMPTY_COUNTS)
    expect(kanchan.map((u) => indexToTile(u.tileIndex))).toEqual(['m2'])
    expect(kanchan[0]?.remaining).toBe(4)
  })

  it('可視牌（河・ドラ表示牌）の枚数を差し引く', () => {
    const visible = countsFromTiles(parseTiles('22m'))
    const result = ukeire(counts('13m456p789s11z456s'), visible)
    expect(result[0]?.remaining).toBe(2)
  })

  it('自分の手牌で使っている枚数も差し引く', () => {
    const result = ukeire(counts('1133m456p789s11z4s'), EMPTY_COUNTS)
    const m2 = result.find((u) => u.tileIndex === tileToIndex('m2'))
    expect(m2?.remaining).toBe(4)
    const m1 = result.find((u) => u.tileIndex === tileToIndex('m1'))
    if (m1 !== undefined) {
      expect(m1.remaining).toBe(2)
    }
  })

  it('和了形に向聴数が下がる牌だけを返す', () => {
    const result = ukeire(counts('123m456p789s1122z'), EMPTY_COUNTS)
    expect(result.map((u) => indexToTile(u.tileIndex)).sort()).toEqual([
      'z1',
      'z2',
    ])
  })
})
