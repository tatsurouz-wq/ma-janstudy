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
const WALL_EDGE_Z = 2.42
const RIVER_EDGE_Z = 1.3
const WIN_REVEAL_Z = 2.0

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

const seatLocalPose = (
  seat: SeatId,
  localX: number,
  y: number,
  localZ: number,
  localEuler: readonly [number, number, number],
): Pose => {
  const angle = seatAngle(seat)
  const [x, z] = rotateAroundY(localX, localZ, angle)
  return {
    p: [x, y, z],
    e: [localEuler[0], localEuler[1] + angle, localEuler[2]],
  }
}

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

const wallSlotPose = (slot: WallSlot, faceUp: boolean): Pose => {
  const localX = (slot.column - (WALL_COLUMNS - 1) / 2) * WALL_PITCH
  const y =
    slot.level === 0
      ? LYING_Y
      : LYING_Y + TILE_THICKNESS
  return seatLocalPose(slot.side, localX, y, WALL_EDGE_Z, [
    faceUp ? -Math.PI / 2 : Math.PI / 2,
    0,
    0,
  ])
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
  return seatLocalPose(seat, localX, STANDING_Y, HAND_EDGE_Z, [
    leanBack,
    0,
    0,
  ])
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
  return seatLocalPose(seat, localX, LYING_Y, localZ, [
    -Math.PI / 2,
    riichiTilt ? Math.PI / 2 : 0,
    0,
  ])
}

export const winRevealPose = (seat: SeatId, index: number): Pose => {
  const localX = (index - 6.5) * HAND_PITCH
  return seatLocalPose(seat, localX, LYING_Y, WIN_REVEAL_Z, [
    -Math.PI / 2,
    0,
    0,
  ])
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
  switch (zone.kind) {
    case 'wall': {
      const sequence = wallSlotSequence(ctx.dice ?? [1, 1], ctx.dealer)
      const slot = sequence[zone.drawIndex]
      return slot === undefined
        ? INSIDE_MACHINE_POSE
        : wallSlotPose(slot, false)
    }
    case 'deadWall': {
      const sequence = wallSlotSequence(ctx.dice ?? [1, 1], ctx.dealer)
      const slot = sequence[LIVE_WALL_SIZE + zone.index]
      return slot === undefined
        ? INSIDE_MACHINE_POSE
        : wallSlotPose(slot, zone.faceUp)
    }
    case 'hand':
      return handTilePose(zone.seat, zone.index, zone.drawn, ctx.userSeat)
    case 'river':
      return riverTilePose(zone.seat, zone.index, zone.riichiTilt)
    case 'winReveal':
      return winRevealPose(zone.seat, zone.index)
  }
}

export const wallSequenceLength = (): number =>
  LIVE_WALL_SIZE + DEAD_WALL_SIZE
