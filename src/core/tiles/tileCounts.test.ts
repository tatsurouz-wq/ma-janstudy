import { describe, expect, it } from 'vitest'
import type { Tile } from './tile'
import {
  countsFromTiles,
  EMPTY_COUNTS,
  tilesFromCounts,
  totalTiles,
  withTileAdded,
  withTileRemoved,
} from './tileCounts'

describe('tileCounts', () => {
  it('EMPTY_COUNTS は34要素すべて0', () => {
    expect(EMPTY_COUNTS).toHaveLength(34)
    expect(EMPTY_COUNTS.every((c) => c === 0)).toBe(true)
  })

  it('牌リストからカウント配列を作る', () => {
    const tiles: readonly Tile[] = ['m1', 'm1', 'm9', 'z7']
    const counts = countsFromTiles(tiles)
    expect(counts[0]).toBe(2)
    expect(counts[8]).toBe(1)
    expect(counts[33]).toBe(1)
    expect(totalTiles(counts)).toBe(4)
  })

  it('カウント配列から牌リストに戻せる', () => {
    const tiles: readonly Tile[] = ['m1', 'm1', 'p5', 'z1']
    const restored = tilesFromCounts(countsFromTiles(tiles))
    expect(restored).toEqual(['m1', 'm1', 'p5', 'z1'])
  })

  it('withTileAdded は元の配列を変更しない', () => {
    const before = countsFromTiles(['m1'])
    const after = withTileAdded(before, 0)
    expect(before[0]).toBe(1)
    expect(after[0]).toBe(2)
  })

  it('withTileRemoved は元の配列を変更しない', () => {
    const before = countsFromTiles(['m1', 'm1', 'm1'])
    const after = withTileRemoved(before, 0, 2)
    expect(before[0]).toBe(3)
    expect(after[0]).toBe(1)
  })

  it('withTileRemoved で0未満になる場合はエラー', () => {
    expect(() => withTileRemoved(EMPTY_COUNTS, 0, 1)).toThrow()
  })

  it('withTileAdded で4を超える場合はエラー', () => {
    const four = countsFromTiles(['m1', 'm1', 'm1', 'm1'])
    expect(() => withTileAdded(four, 0)).toThrow()
  })
})
