import { describe, expect, it } from 'vitest'
import { countsFromTiles } from '../tiles/tileCounts'
import { parseTiles } from '../tiles/notation'
import { decomposeStandard } from './decompose'

const decompose = (notation: string) =>
  decomposeStandard(countsFromTiles(parseTiles(notation)))

describe('decomposeStandard', () => {
  it('単純な4面子1雀頭を1通りに分解する', () => {
    const results = decompose('123m456p789s111z22z')
    expect(results).toHaveLength(1)
    const d = results[0]
    expect(d?.pairIndex).toBe(28)
    expect(d?.sets).toEqual([
      { kind: 'shuntsu', startIndex: 0 },
      { kind: 'shuntsu', startIndex: 12 },
      { kind: 'shuntsu', startIndex: 24 },
      { kind: 'kotsu', startIndex: 27 },
    ])
  })

  it('222333444 は刻子3つと順子3つの両方に分解される', () => {
    const results = decompose('222333444m567s55z')
    expect(results).toHaveLength(2)
    const kinds = results.map((r) =>
      r.sets.filter((s) => s.startIndex < 9).map((s) => s.kind),
    )
    expect(kinds).toContainEqual(['kotsu', 'kotsu', 'kotsu'])
    expect(kinds).toContainEqual(['shuntsu', 'shuntsu', 'shuntsu'])
  })

  it('1面子+雀頭の部分手牌も分解できる', () => {
    const results = decompose('11123m')
    expect(results).toHaveLength(1)
    expect(results[0]?.pairIndex).toBe(0)
    expect(results[0]?.sets).toEqual([{ kind: 'shuntsu', startIndex: 0 }])
  })

  it('和了形でない手は空配列を返す', () => {
    expect(decompose('123m456p789s12z3z4z')).toHaveLength(0)
  })

  it('七対子形は標準形として分解されない', () => {
    expect(decompose('1199m1199p1199s11z')).toHaveLength(0)
  })

  it('同一牌4枚使いでも重複なく分解する', () => {
    const results = decompose('111123m999s44z')
    expect(results).toHaveLength(1)
    expect(results[0]?.sets).toEqual([
      { kind: 'kotsu', startIndex: 0 },
      { kind: 'shuntsu', startIndex: 0 },
      { kind: 'kotsu', startIndex: 26 },
    ])
    expect(results[0]?.pairIndex).toBe(30)
  })

  it('九蓮宝燈形（純正含み）を分解できる', () => {
    const results = decompose('11112345678999m')
    expect(results.length).toBeGreaterThan(0)
  })

  it('9-1はつながらない（8-9-1の順子を作らない）', () => {
    expect(decompose('891m11p')).toHaveLength(0)
  })
})
