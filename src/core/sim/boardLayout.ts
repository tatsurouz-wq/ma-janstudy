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
const WIN_REVEAL_Z = 2.0
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

export const wallSlotSequence = (
  dice: readonly [number, number],
  dealer: SeatId,
): readonly WallSlot[] => {
  const sum = (dice[0] ?? 1) + (dice[1] ?? 1)
  const breakSide = (((dealer + sum - 1) % 4) + 4) % 4
  const startColumn = Math.min(sum, WALL_COLUMNS - 1)
  const mutableSlots: WallSlot[] = []
  for (let sideOffset = 0; sideOffset < 4; sideOffset += 1) {
    const side = (((breakSide + sideOffset) % 4) + 4) % 4
    const fromColumn = sideOffset === 0 ? startColumn : 0
    for (let column = fromColumn; column < WALL_COLUMNS; column += 1) {
      mutableSlots.push({ side: side as SeatId, column, level: 1 })
      mutableSlots.push({ side: side as SeatId, column, level: 0 })
    }
  }
  const breakSideTyped = breakSide as SeatId
  for (let column = 0; column < startColumn; column += 1) {
    mutableSlots.push({ side: breakSideTyped, column, level: 1 })
    mutableSlots.push({ side: breakSideTyped, column, level: 0 })
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
): Pose => {
  const row = Math.min(Math.floor(index / 6), 3)
  const column = row >= 3 ? index - 18 + 6 : index % 6
  const localX = (column - 2.5) * RIVER_PITCH + (riichiTilt ? 0.03 : 0)
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
      return riverTilePose(zone.seat, zone.index, zone.riichiTilt)
    case 'winReveal':
      return winRevealPose(zone.seat, zone.index)
  }
}

export const wallSequenceLength = (): number =>
  LIVE_WALL_SIZE + DEAD_WALL_SIZE
