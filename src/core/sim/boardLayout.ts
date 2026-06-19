import type { SeatId } from './seatTypes'
import type { TileZone } from './scenarioEvents'
import { DEAD_WALL_SIZE, LIVE_WALL_SIZE } from './scenarioEvents'

export const TILE_WIDTH = 0.2
export const TILE_LENGTH = 0.26
export const TILE_THICKNESS = 0.16

export const TABLE_TOP_Y = 0
const LYING_Y = TILE_THICKNESS / 2
const STANDING_Y = TILE_LENGTH / 2
const WALL_COLUMNS = 17
const WALL_GAP = 0.005
const WALL_PITCH = TILE_WIDTH + WALL_GAP
const HAND_PITCH = TILE_WIDTH + 0.012
const RIVER_PITCH = TILE_WIDTH + 0.012
const RIVER_ROW_PITCH = TILE_LENGTH + 0.02
const HAND_EDGE_Z = 3.3
const STAGING_EDGE_Z = 2.92
const WALL_EDGE_Z = 2.42
const RIVER_EDGE_Z = 1.3
// 河の2段目(中心1.86, 上限約1.99)と倒牌列(半長0.13)が重ならないよう手前に置く。
const WIN_REVEAL_Z = 2.15
const STAGING_BLOCK_GAP = 0.07

export interface Pose {
  readonly p: readonly [number, number, number]
  readonly e: readonly [number, number, number]
}

export const seatAngle = (seat: SeatId): number =>
  (((seat - 1 + 4) % 4) * Math.PI) / 2

const rotateAroundY = (
  x: number,
  z: number,
  angle: number,
): readonly [number, number] => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [x * cos + z * sin, -x * sin + z * cos]
}

const seatPosition = (
  seat: SeatId,
  localX: number,
  y: number,
  localZ: number,
): readonly [number, number, number] => {
  const [x, z] = rotateAroundY(localX, localZ, seatAngle(seat))
  return [x, y, z]
}

const standingPose = (
  seat: SeatId,
  localX: number,
  localZ: number,
  leanBack: number,
): Pose => ({
  p: seatPosition(seat, localX, STANDING_Y, localZ),
  e: [leanBack, seatAngle(seat), 0],
})

const lyingPose = (
  seat: SeatId,
  localX: number,
  y: number,
  localZ: number,
  faceUp: boolean,
  extraYaw = 0,
): Pose => ({
  p: seatPosition(seat, localX, y, localZ),
  e: [
    faceUp ? -Math.PI / 2 : Math.PI / 2,
    0,
    seatAngle(seat) + extraYaw,
  ],
})

export interface WallSlot {
  readonly side: SeatId
  readonly column: number
  readonly level: 0 | 1
}

// 実ルールの開門: サイコロ合計で割れ目（breakSide の breakColumn と breakColumn+1 の
// 間）が決まり、配牌は割れ目の左側の幢から「列を減らす方向（卓に対して時計回り）」に
// 消費する。王牌は割れ目の右側に7幢（14枚）残し、ドラ表示牌は割れ目側から3幢目の上段。
// ここでは牌山をリングとして扱い、割れ目から live=61幢 / dead=7幢 を逆方向に列挙する。
export const wallSlotSequence = (
  dice: readonly [number, number],
  dealer: SeatId,
): readonly WallSlot[] => {
  const sum = (dice[0] ?? 1) + (dice[1] ?? 1)
  const breakSide = (((dealer + sum - 1) % 4) + 4) % 4
  const breakColumn = WALL_COLUMNS - 1 - sum
  const mutableSlots: WallSlot[] = []
  const pushStack = (side: SeatId, column: number) => {
    mutableSlots.push({ side, column, level: 1 })
    mutableSlots.push({ side, column, level: 0 })
  }
  const LIVE_STACKS = LIVE_WALL_SIZE / 2
  const DEAD_STACKS = DEAD_WALL_SIZE / 2
  // 生牌: 割れ目の左から列を減らす方向へ。角を越えたら側を1つ戻して列16から続ける。
  const mutableLive = { side: breakSide as SeatId, column: breakColumn }
  for (let i = 0; i < LIVE_STACKS; i += 1) {
    pushStack(mutableLive.side, mutableLive.column)
    mutableLive.column -= 1
    if (mutableLive.column < 0) {
      mutableLive.side = ((((mutableLive.side + 3) % 4) + 4) % 4) as SeatId
      mutableLive.column = WALL_COLUMNS - 1
    }
  }
  // 王牌: 割れ目の右から列を増やす方向へ（割れ目側から外側へ）。
  const mutableDead = { side: breakSide as SeatId, column: breakColumn + 1 }
  if (mutableDead.column >= WALL_COLUMNS) {
    mutableDead.side = ((((mutableDead.side + 1) % 4) + 4) % 4) as SeatId
    mutableDead.column = 0
  }
  for (let i = 0; i < DEAD_STACKS; i += 1) {
    pushStack(mutableDead.side, mutableDead.column)
    mutableDead.column += 1
    if (mutableDead.column >= WALL_COLUMNS) {
      mutableDead.side = ((((mutableDead.side + 1) % 4) + 4) % 4) as SeatId
      mutableDead.column = 0
    }
  }
  return mutableSlots
}

export const deadWallSlot = (
  dice: readonly [number, number],
  dealer: SeatId,
  deadIndex: number,
): WallSlot | undefined =>
  wallSlotSequence(dice, dealer)[LIVE_WALL_SIZE + deadIndex]

const wallSlotPose = (slot: WallSlot, faceUp: boolean): Pose => {
  const localX = (slot.column - (WALL_COLUMNS - 1) / 2) * WALL_PITCH
  const y = slot.level === 0 ? LYING_Y : LYING_Y + TILE_THICKNESS
  return lyingPose(slot.side, localX, y, WALL_EDGE_Z, faceUp)
}

export const wallTilePoseAt = (
  dice: readonly [number, number],
  dealer: SeatId,
  sequenceIndex: number,
  faceUp: boolean,
): Pose => {
  const slot = wallSlotSequence(dice, dealer)[sequenceIndex]
  return slot === undefined ? INSIDE_MACHINE_POSE : wallSlotPose(slot, faceUp)
}

export const handTilePose = (
  seat: SeatId,
  index: number,
  drawn: boolean,
  userSeat: SeatId,
): Pose => {
  const drawnGap = drawn ? 0.18 : 0
  const localX = (index - 6) * HAND_PITCH + drawnGap
  const leanBack = seat === userSeat ? -0.18 : 0
  return standingPose(seat, localX, HAND_EDGE_Z, leanBack)
}

export const stagingTilePose = (seat: SeatId, index: number): Pose => {
  const blockGap = Math.floor(index / 4) * STAGING_BLOCK_GAP
  const localX = (index - 6.5) * (TILE_WIDTH + 0.006) + blockGap - 0.1
  return lyingPose(seat, localX, LYING_Y, STAGING_EDGE_Z, false)
}

export const riverTilePose = (
  seat: SeatId,
  index: number,
  riichiTilt: boolean,
  riichiIndex: number | null = null,
): Pose => {
  // 河は1段6枚。3段目以降は到達することがほとんどないが、3段目を右へ延長する
  // （実卓と同じく段を増やさない）慣習に合わせる。
  const row = Math.min(Math.floor(index / 6), 2)
  const column = row >= 2 ? index - 12 : index % 6
  // 横向き（リーチ宣言）牌は牌長(0.26)ぶん幅を取るため、同じ段でその牌より後ろの
  // 牌を牌長-牌幅(0.06)だけ右へずらして重なりを防ぐ。宣言牌自体は半幅(0.03)右へ。
  const tiltShift = riichiTilt ? (TILE_LENGTH - TILE_WIDTH) / 2 : 0
  const pushedByRiichi =
    riichiIndex !== null &&
    index > riichiIndex &&
    Math.min(Math.floor(riichiIndex / 6), 2) === row
      ? TILE_LENGTH - TILE_WIDTH
      : 0
  const localX = (column - 2.5) * RIVER_PITCH + tiltShift + pushedByRiichi
  const localZ = RIVER_EDGE_Z + row * RIVER_ROW_PITCH
  return lyingPose(
    seat,
    localX,
    LYING_Y,
    localZ,
    true,
    riichiTilt ? Math.PI / 2 : 0,
  )
}

export const winRevealPose = (seat: SeatId, index: number): Pose => {
  const localX = (index - 6.5) * HAND_PITCH
  return lyingPose(seat, localX, LYING_Y, WIN_REVEAL_Z, true)
}

export const INSIDE_MACHINE_POSE: Pose = {
  p: [0, -0.8, 0],
  e: [Math.PI / 2, 0, 0],
}

export interface LayoutContext {
  readonly dice: readonly [number, number] | null
  readonly dealer: SeatId
  readonly userSeat: SeatId
  // 各席のリーチ宣言牌の河インデックス（未宣言は null）。横向き牌の後続を右へ寄せるため。
  readonly riichiRiverIndex?: readonly (number | null)[]
}

export const tilePoseFor = (zone: TileZone, ctx: LayoutContext): Pose => {
  const dice = ctx.dice ?? [1, 1]
  switch (zone.kind) {
    case 'wall':
      return wallTilePoseAt(dice, ctx.dealer, zone.drawIndex, false)
    case 'deadWall':
      return wallTilePoseAt(
        dice,
        ctx.dealer,
        LIVE_WALL_SIZE + zone.index,
        zone.faceUp,
      )
    case 'hand':
      return handTilePose(zone.seat, zone.index, zone.drawn, ctx.userSeat)
    case 'handStaging':
      return stagingTilePose(zone.seat, zone.index)
    case 'river':
      return riverTilePose(
        zone.seat,
        zone.index,
        zone.riichiTilt,
        ctx.riichiRiverIndex?.[zone.seat] ?? null,
      )
    case 'winReveal':
      return winRevealPose(zone.seat, zone.index)
  }
}

export const wallSequenceLength = (): number =>
  LIVE_WALL_SIZE + DEAD_WALL_SIZE
