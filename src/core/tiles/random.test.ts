import { describe, expect, it } from 'vitest'
import { createRng, shuffled } from './random'

describe('random', () => {
  it('同一シードは同一の乱数列を生む', () => {
    const a = createRng(42)
    const b = createRng(42)
    const [v1] = a.next()
    const [v2] = b.next()
    expect(v1).toBe(v2)
  })

  it('rng はイミュータブル（同じ状態から何度でも同じ値）', () => {
    const rng = createRng(7)
    const [v1] = rng.next()
    const [v2] = rng.next()
    expect(v1).toBe(v2)
  })

  it('異なるシードは異なる列を生む', () => {
    const [v1] = createRng(1).next()
    const [v2] = createRng(2).next()
    expect(v1).not.toBe(v2)
  })

  it('shuffled は同一シードで同一の並びを返し、元配列を変更しない', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const [a] = shuffled(original, createRng(123))
    const [b] = shuffled(original, createRng(123))
    expect(a).toEqual(b)
    expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect([...a].sort((x, y) => x - y)).toEqual(original)
  })
})
