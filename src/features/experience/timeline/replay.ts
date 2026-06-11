import type { BoardState, ScenarioEvent } from '@/core/sim/scenarioEvents'
import { boardAt } from '@/core/sim/scenarioEvents'
import type { LayoutContext, Pose } from '@/core/sim/boardLayout'
import { INSIDE_MACHINE_POSE, tilePoseFor } from '@/core/sim/boardLayout'
import type { SeatId } from '@/core/sim/seatTypes'
import type { Timeline } from './timelineTypes'

export const eventIndexAtTime = (
  timeline: Timeline,
  t: number,
): number => {
  const times = timeline.eventTimes
  const mutableRange = { lo: 0, hi: times.length - 1, result: 0 }
  while (mutableRange.lo <= mutableRange.hi) {
    const mid = (mutableRange.lo + mutableRange.hi) >> 1
    const entry = times[mid]
    if (entry === undefined) {
      break
    }
    if (entry.t <= t) {
      mutableRange.result = entry.eventIndex
      mutableRange.lo = mid + 1
    } else {
      mutableRange.hi = mid - 1
    }
  }
  return mutableRange.result
}

const diceFromEvents = (
  events: readonly ScenarioEvent[],
  uptoIndex: number,
): readonly [number, number] => {
  for (let i = uptoIndex; i >= 0; i -= 1) {
    const e = events[i]
    if (e?.kind === 'dice') {
      return e.values
    }
    if (e?.kind === 'kyokuStart') {
      for (let j = i; j < events.length; j += 1) {
        const next = events[j]
        if (next?.kind === 'dice') {
          return next.values
        }
        if (next?.kind === 'kyokuStart' && j > i) {
          break
        }
      }
      break
    }
  }
  return [3, 4]
}

const dealerFromEvents = (
  events: readonly ScenarioEvent[],
  uptoIndex: number,
): SeatId => {
  for (let i = uptoIndex; i >= 0; i -= 1) {
    const e = events[i]
    if (e?.kind === 'kyokuStart') {
      return e.dealer
    }
  }
  return 0
}

export interface BoardPoses {
  readonly board: BoardState
  readonly poses: ReadonlyMap<string, Pose>
}

export const boardPosesAt = (
  events: readonly ScenarioEvent[],
  eventIndex: number,
  userSeat: SeatId,
  allTileIds: readonly string[],
): BoardPoses => {
  const board = boardAt(events, eventIndex + 1)
  const ctx: LayoutContext = {
    dice: diceFromEvents(events, eventIndex),
    dealer: dealerFromEvents(events, eventIndex),
    userSeat,
  }
  const mutablePoses = new Map<string, Pose>()
  for (const tileId of allTileIds) {
    const placed = board.tiles.get(tileId)
    mutablePoses.set(
      tileId,
      placed === undefined
        ? INSIDE_MACHINE_POSE
        : tilePoseFor(placed.zone, ctx),
    )
  }
  return { board, poses: mutablePoses }
}
