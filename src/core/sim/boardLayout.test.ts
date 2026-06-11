import { describe, expect, it } from 'vitest'
import {
  handTilePose,
  riverTilePose,
  seatAngle,
  tilePoseFor,
  wallSlotSequence,
} from './boardLayout'

describe('wallSlotSequence', () => {
  it('全136スロットを重複なく列挙する', () => {
    for (const dice of [
      [1, 1],
      [3, 5],
      [6, 6],
    ] as const) {
      const sequence = wallSlotSequence([dice[0], dice[1]], 0)
      expect(sequence).toHaveLength(136)
      const keys = new Set(
        sequence.map((s) => `${s.side}-${s.column}-${s.level}`),
      )
      expect(keys.size).toBe(136)
    }
  })

  it('各辺は17列×2段', () => {
    const sequence = wallSlotSequence([2, 3], 0)
    for (const side of [0, 1, 2, 3]) {
      const onSide = sequence.filter((s) => s.side === side)
      expect(onSide).toHaveLength(34)
    }
  })

  it('上段が下段より先に消費される', () => {
    const sequence = wallSlotSequence([4, 2], 1)
    const first = sequence[0]
    const second = sequence[1]
    expect(first?.level).toBe(1)
    expect(second?.level).toBe(0)
    expect(first?.column).toBe(second?.column)
  })
})

describe('poses', () => {
  it('seatAngle: ユーザー(1)は0、対面(3)はπ', () => {
    expect(seatAngle(1)).toBe(0)
    expect(seatAngle(3)).toBeCloseTo(Math.PI)
  })

  it('ユーザーの手牌は手前(+Z)に立って並ぶ', () => {
    const pose = handTilePose(1, 0, false, 1)
    expect(pose.p[2]).toBeCloseTo(3.3)
    expect(pose.p[1]).toBeCloseTo(0.13)
  })

  it('対面の手牌は奥(-Z)に並ぶ', () => {
    const pose = handTilePose(3, 6, false, 1)
    expect(pose.p[2]).toBeLessThan(0)
  })

  it('ツモ牌は手牌より右に間隔をあけて置かれる', () => {
    const normal = handTilePose(1, 13, false, 1)
    const drawn = handTilePose(1, 13, true, 1)
    expect(drawn.p[0]).toBeGreaterThan(normal.p[0])
  })

  it('河は6枚で折り返す', () => {
    const fifth = riverTilePose(1, 5, false)
    const sixth = riverTilePose(1, 6, false)
    expect(sixth.p[2]).toBeGreaterThan(fifth.p[2])
    expect(sixth.p[0]).toBeLessThan(fifth.p[0])
  })

  it('リーチ牌は横向き（ヨー90度）になる', () => {
    const normal = riverTilePose(2, 3, false)
    const tilted = riverTilePose(2, 3, true)
    expect(Math.abs(tilted.e[1] - normal.e[1])).toBeCloseTo(Math.PI / 2)
  })

  it('tilePoseForは全ゾーンを解決する', () => {
    const ctx = {
      dice: [3, 4] as const,
      dealer: 0 as const,
      userSeat: 1 as const,
    }
    expect(
      tilePoseFor({ kind: 'wall', drawIndex: 0 }, ctx).p,
    ).toBeDefined()
    expect(
      tilePoseFor({ kind: 'deadWall', index: 4, faceUp: true }, ctx).p,
    ).toBeDefined()
    expect(
      tilePoseFor(
        { kind: 'hand', seat: 2, index: 3, drawn: false },
        ctx,
      ).p,
    ).toBeDefined()
    expect(
      tilePoseFor(
        { kind: 'river', seat: 0, index: 7, riichiTilt: false },
        ctx,
      ).p,
    ).toBeDefined()
    expect(
      tilePoseFor({ kind: 'winReveal', seat: 1, index: 13 }, ctx).p,
    ).toBeDefined()
  })
})
