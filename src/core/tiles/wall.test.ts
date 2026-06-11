import { describe, expect, it } from 'vitest'
import { createRng } from './random'
import { createWall, RED_FIVE_COUNT_PER_SUIT } from './wall'

describe('createWall', () => {
  it('136枚で各牌4枚ずつ、赤5は各色1枚', () => {
    const [wall] = createWall(createRng(1))
    expect(wall).toHaveLength(136)
    const byTile = new Map<string, number>()
    for (const t of wall) {
      byTile.set(t.tile, (byTile.get(t.tile) ?? 0) + 1)
    }
    expect([...byTile.values()].every((c) => c === 4)).toBe(true)
    expect(byTile.size).toBe(34)
    const reds = wall.filter((t) => t.isRed)
    expect(reds).toHaveLength(3)
    expect(new Set(reds.map((t) => t.tile))).toEqual(
      new Set(['m5', 'p5', 's5']),
    )
  })

  it('IDはすべて一意', () => {
    const [wall] = createWall(createRng(2))
    expect(new Set(wall.map((t) => t.id)).size).toBe(136)
  })

  it('同一シードで同一の牌山になる', () => {
    const [a] = createWall(createRng(42))
    const [b] = createWall(createRng(42))
    expect(a.map((t) => t.id)).toEqual(b.map((t) => t.id))
  })

  it('赤5の枚数定数', () => {
    expect(RED_FIVE_COUNT_PER_SUIT).toBe(1)
  })
})
