import { describe, expect, it } from 'vitest'
import type { SeatId } from './seatTypes'
import {
  deadWallSlot,
  handTilePose,
  riverTilePose,
  seatAngle,
  stagingTilePose,
  tilePoseFor,
  wallSlotSequence,
  wallTilePoseAt,
  winRevealPose,
} from './boardLayout'
import { LIVE_WALL_SIZE } from './scenarioEvents'

type Vec3 = readonly [number, number, number]

const applyEuler = (e: Vec3, v: Vec3): Vec3 => {
  const [ex, ey, ez] = e
  const afterZ: Vec3 = [
    v[0] * Math.cos(ez) - v[1] * Math.sin(ez),
    v[0] * Math.sin(ez) + v[1] * Math.cos(ez),
    v[2],
  ]
  const afterY: Vec3 = [
    afterZ[0] * Math.cos(ey) + afterZ[2] * Math.sin(ey),
    afterZ[1],
    -afterZ[0] * Math.sin(ey) + afterZ[2] * Math.cos(ey),
  ]
  return [
    afterY[0],
    afterY[1] * Math.cos(ex) - afterY[2] * Math.sin(ex),
    afterY[1] * Math.sin(ex) + afterY[2] * Math.cos(ex),
  ]
}

const faceNormalOf = (e: Vec3): Vec3 => applyEuler(e, [0, 0, 1])

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

  it('開門は割れ目から: 生牌の先頭と王牌の先頭は割れ目を挟んで隣接し、生牌は列を減らす方向へ進む', () => {
    for (const dice of [
      [1, 1],
      [2, 5],
      [4, 4],
      [6, 6],
    ] as const) {
      for (const dealer of [0, 1, 2, 3] as const) {
        const sequence = wallSlotSequence([dice[0], dice[1]], dealer)
        const liveHead = sequence[0]
        const liveSecond = sequence[2]
        const deadHead = sequence[LIVE_WALL_SIZE]
        // 生牌の先頭(割れ目の左)と王牌の先頭(割れ目の右)は同じ辺で隣接する。
        expect(deadHead?.side).toBe(liveHead?.side)
        expect((deadHead?.column ?? -9) - (liveHead?.column ?? 0)).toBe(1)
        // 生牌は列を1つずつ減らす方向に消費する。
        expect((liveHead?.column ?? 0) - (liveSecond?.column ?? 0)).toBe(1)
        expect(liveHead?.level).toBe(1)
      }
    }
  })

  it('ドラ表示牌は王牌の3幢目・上段に出る（サイコロ値に依らない）', () => {
    for (const dice of [
      [1, 1],
      [2, 5],
      [4, 4],
      [6, 6],
    ] as const) {
      for (const dealer of [0, 1, 2, 3] as const) {
        const sequence = wallSlotSequence([dice[0], dice[1]], dealer)
        const deadWall = sequence.slice(LIVE_WALL_SIZE)
        expect(deadWall).toHaveLength(14)
        const indicator = deadWallSlot([dice[0], dice[1]], dealer, 4)
        expect(indicator?.level).toBe(1)
        const columnsInOrder = [
          ...new Set(deadWall.map((s) => `${s.side}-${s.column}`)),
        ]
        expect(columnsInOrder).toHaveLength(7)
        expect(`${indicator?.side}-${indicator?.column}`).toBe(
          columnsInOrder[2],
        )
      }
    }
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

  it('全座席で河牌の牌面は上を向く', () => {
    for (const seat of [0, 1, 2, 3] as const) {
      const normal = faceNormalOf(riverTilePose(seat, 2, false).e)
      expect(normal[1]).toBeCloseTo(1)
    }
  })

  it('リーチ牌は牌面が上を向いたまま面内で90度回る（全座席）', () => {
    for (const seat of [0, 1, 2, 3] as const) {
      const upright = riverTilePose(seat, 3, false)
      const tilted = riverTilePose(seat, 3, true)
      expect(faceNormalOf(tilted.e)[1]).toBeCloseTo(1)
      expect(Math.abs(tilted.e[2] - upright.e[2])).toBeCloseTo(Math.PI / 2)
      const uprightLong = applyEuler(upright.e, [0, 1, 0])
      const tiltedLong = applyEuler(tilted.e, [0, 1, 0])
      const dot =
        uprightLong[0] * tiltedLong[0] +
        uprightLong[1] * tiltedLong[1] +
        uprightLong[2] * tiltedLong[2]
      expect(Math.abs(dot)).toBeLessThan(1e-6)
    }
  })

  it('河は3段目を作らず2段目を右に延長する（index12は2段目の左端）', () => {
    const first = riverTilePose(1, 0, false)
    const second = riverTilePose(1, 6, false)
    const third = riverTilePose(1, 12, false)
    // index 0/6/12 はいずれも各段の左端で、同じローカルX（同じ世界X）に並ぶ。
    expect(third.p[0]).toBeCloseTo(first.p[0])
    expect(third.p[0]).toBeCloseTo(second.p[0])
    // 段が進むごとに手前から奥へ等間隔。
    const gap1 = second.p[2] - first.p[2]
    const gap2 = third.p[2] - second.p[2]
    expect(gap2).toBeCloseTo(gap1)
  })

  it('リーチ宣言牌の後ろの同段牌は右へずれ、横向き牌と重ならない', () => {
    const baseline = riverTilePose(1, 1, false, null)
    const pushed = riverTilePose(1, 1, false, 0)
    expect(pushed.p[0] - baseline.p[0]).toBeGreaterThan(0.05)
    const riichiTile = riverTilePose(1, 0, true, 0)
    // 横向き牌(半長0.13)と次の通常牌(半幅0.10)の中心間距離が0.23以上で重ならない。
    const distance = Math.abs(pushed.p[0] - riichiTile.p[0])
    expect(distance).toBeGreaterThanOrEqual(0.23)
  })

  it('和了の倒牌は河の2段目より手前に置かれ重ならない', () => {
    const reveal = winRevealPose(1, 5)
    const riverRow1 = riverTilePose(1, 11, false)
    // 倒牌の手前端 > 河2段目の奥端（どちらも長辺0.26がZに沿う、半長0.13）。
    expect(reveal.p[2] - 0.13).toBeGreaterThan(riverRow1.p[2] + 0.13)
  })

  it('山の牌は全座席で牌面が下を向き、表示牌だけ上を向く', () => {
    const dice: readonly [number, number] = [3, 4]
    for (const index of [0, 40, 80, 121]) {
      const pose = wallTilePoseAt(dice, 0, index, false)
      expect(faceNormalOf(pose.e)[1]).toBeCloseTo(-1)
    }
    const indicatorUp = wallTilePoseAt(dice, 0, LIVE_WALL_SIZE + 4, true)
    expect(faceNormalOf(indicatorUp.e)[1]).toBeCloseTo(1)
  })

  it('配牌の仮置きは裏向きで、4枚ごとにブロック間隔があく', () => {
    const seat: SeatId = 1
    const inBlock = stagingTilePose(seat, 4).p[0] - stagingTilePose(seat, 3).p[0]
    const inSame = stagingTilePose(seat, 2).p[0] - stagingTilePose(seat, 1).p[0]
    expect(inBlock).toBeGreaterThan(inSame + 0.03)
    expect(faceNormalOf(stagingTilePose(seat, 0).e)[1]).toBeCloseTo(-1)
  })

  it('和了の倒牌は全座席で牌面が上を向く', () => {
    for (const seat of [0, 1, 2, 3] as const) {
      expect(faceNormalOf(tilePoseFor(
        { kind: 'winReveal', seat, index: 5 },
        { dice: [2, 3], dealer: 0, userSeat: 1 },
      ).e)[1]).toBeCloseTo(1)
    }
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
        { kind: 'handStaging', seat: 0, index: 7 },
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
