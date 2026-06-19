import type { ScenarioEvent } from '@/core/sim/scenarioEvents'
import type { SeatId } from '@/core/sim/seatTypes'
import { seatAngle, wallTilePoseAt } from '@/core/sim/boardLayout'
import {
  DORA_INDICATOR_DEAD_INDEX,
  LIVE_WALL_SIZE,
  URA_INDICATOR_DEAD_INDEX,
} from '@/core/sim/scenarioEvents'
import type {
  CameraClip,
  CameraPose,
  CameraTransition,
  Vec3,
} from './timelineTypes'

export const BASE_VIEW: CameraPose = {
  position: [0, 3.5, 7.0],
  lookAt: [0, 0, 1.0],
  fov: 55,
}

export const HAND_VIEW: CameraPose = {
  position: [0, 3.0, 5.9],
  lookAt: [0, 0.4, 3.3],
  fov: 42,
}

export const WIDE_VIEW: CameraPose = {
  position: [0, 3.8, 7.2],
  lookAt: [0, 0, 0.4],
  fov: 62,
}

export const PANEL_VIEW: CameraPose = {
  position: [0, 2.2, 4.8],
  lookAt: [0, 0.1, 0],
  fov: 34,
}

export const LOW_VIEW: CameraPose = {
  position: [0, 1.6, 7.6],
  lookAt: [0, 0.3, 0],
  fov: 62,
}

export const RISE_VIEW: CameraPose = {
  position: [0, 5.6, 5.6],
  lookAt: [0, 0, 0.6],
  fov: 50,
}

export const OVERHEAD_VIEW: CameraPose = {
  position: [0, 12, 0.02],
  lookAt: [0, 0, 0],
  fov: 50,
}

const rotateY = (v: Vec3, angle: number): Vec3 => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [v[0] * cos + v[2] * sin, v[1], -v[0] * sin + v[2] * cos]
}

export const seatFocusView = (seat: SeatId, fov: number): CameraPose => ({
  position: BASE_VIEW.position,
  lookAt: rotateY([0, 0.2, 2.2], seatAngle(seat)),
  fov,
})

export const MAX_PAN_SPEED_DEG = 60
export const MAX_CONTINUOUS_MOVE = 2.0

const direction = (pose: CameraPose): Vec3 => {
  const d: Vec3 = [
    pose.lookAt[0] - pose.position[0],
    pose.lookAt[1] - pose.position[1],
    pose.lookAt[2] - pose.position[2],
  ]
  const len = Math.hypot(d[0], d[1], d[2]) || 1
  return [d[0] / len, d[1] / len, d[2] / len]
}

export const panAngleDeg = (a: CameraPose, b: CameraPose): number => {
  const da = direction(a)
  const db = direction(b)
  const dot = Math.min(
    1,
    Math.max(-1, da[0] * db[0] + da[1] * db[1] + da[2] * db[2]),
  )
  return (Math.acos(dot) * 180) / Math.PI
}

export const positionDelta = (a: CameraPose, b: CameraPose): number =>
  Math.hypot(
    b.position[0] - a.position[0],
    b.position[1] - a.position[1],
    b.position[2] - a.position[2],
  )

export interface CameraScriptState {
  readonly lastPose: CameraPose
}

export const INITIAL_CAMERA_STATE: CameraScriptState = {
  lastPose: PANEL_VIEW,
}

export interface ShotSpec {
  readonly to: CameraPose
  readonly offset: number
  readonly duration: number
  readonly transition?: CameraTransition
}

export const buildShot = (
  state: CameraScriptState,
  spec: ShotSpec,
  t0: number,
  reducedMotion: boolean,
): readonly [CameraClip, CameraScriptState] => {
  const from = state.lastPose
  const requested = spec.transition ?? 'continuous'
  const angle = panAngleDeg(from, spec.to)
  const move = positionDelta(from, spec.to)
  const exceedsLimits =
    angle / Math.max(spec.duration, 0.01) > MAX_PAN_SPEED_DEG ||
    move > MAX_CONTINUOUS_MOVE
  const transition: CameraTransition = reducedMotion
    ? requested === 'fadeCut'
      ? 'fadeCut'
      : 'cut'
    : requested === 'continuous' && exceedsLimits
      ? 'cut'
      : requested
  const clip: CameraClip = {
    track: 'camera',
    t0: t0 + spec.offset,
    t1: t0 + spec.offset + spec.duration,
    from: transition === 'continuous' ? from : spec.to,
    to: spec.to,
    easing: 'inOutCubic',
    transition,
  }
  return [clip, { lastPose: spec.to }]
}

export interface EventCameraPlan {
  readonly shots: readonly ShotSpec[]
}

export const cameraPlanFor = (
  event: ScenarioEvent,
  context: {
    readonly userSeat: SeatId
    readonly drawCountInKyoku: number
    readonly duration: number
    readonly dice: readonly [number, number]
    readonly dealer: SeatId
  },
): EventCameraPlan => {
  const { userSeat, drawCountInKyoku, duration } = context
  switch (event.kind) {
    case 'machineStart':
      return {
        shots: [
          {
            to: { ...PANEL_VIEW, fov: 29 },
            offset: 0.4,
            duration: duration - 0.4,
            transition: 'fadeCut',
          },
        ],
      }
    case 'shuffle':
      return {
        shots: [{ to: BASE_VIEW, offset: 0, duration: 1.2, transition: 'cut' }],
      }
    case 'wallRise':
      return {
        shots: [{ to: LOW_VIEW, offset: 0, duration: 1.0, transition: 'cut' }],
      }
    case 'dice':
      return {
        shots: [
          {
            to: { ...LOW_VIEW, fov: 36 },
            offset: 0.2,
            duration: duration - 0.4,
          },
        ],
      }
    case 'dealBlock': {
      if (event.blockIndex === 0) {
        return {
          shots: [
            {
              to: seatFocusView(context.dealer, 44),
              offset: 0,
              duration: 0.9,
              transition: 'cut',
            },
          ],
        }
      }
      if (event.blockIndex === 4) {
        return {
          shots: [{ to: WIDE_VIEW, offset: 0, duration: 0.8 }],
        }
      }
      // ユーザーの1枚取り（13枚目）。blockIndex 12-15 が各家の1枚取り、16 は親の
      // チョンチョン。座席=ユーザーかつ1枚取り（チョンチョン以外）で手元に寄る。
      if (
        event.seat === userSeat &&
        event.tiles.length === 1 &&
        event.blockIndex < 16
      ) {
        return {
          shots: [
            { to: HAND_VIEW, offset: 0, duration: 0.7, transition: 'cut' },
          ],
        }
      }
      return { shots: [] }
    }
    case 'dealDora': {
      const indicatorPose = wallTilePoseAt(
        context.dice,
        context.dealer,
        LIVE_WALL_SIZE + DORA_INDICATOR_DEAD_INDEX,
        true,
      )
      return {
        shots: [
          {
            to: {
              position: [
                indicatorPose.p[0] * 0.45,
                2.4,
                indicatorPose.p[2] * 0.45 + 3.6,
              ],
              lookAt: indicatorPose.p,
              fov: 30,
            },
            offset: 0.15,
            duration: 0.9,
            transition: 'cut',
          },
        ],
      }
    }
    case 'dealSort': {
      const wideOffset = Math.max(duration - 1.0, 0.9)
      return {
        shots: [
          { to: HAND_VIEW, offset: 0, duration: 0.8, transition: 'cut' },
          {
            to: WIDE_VIEW,
            offset: wideOffset,
            // イベント長を超えて次イベント（boardSnapshot等）のカメラと重ならないよう収める。
            duration: Math.min(1.0, Math.max(0.3, duration - wideOffset)),
          },
        ],
      }
    }
    case 'boardSnapshot':
      return {
        shots: [
          { to: WIDE_VIEW, offset: 0, duration: 1.0, transition: 'fadeCut' },
        ],
      }
    case 'draw': {
      if (event.seat === userSeat) {
        return {
          shots: [
            { to: HAND_VIEW, offset: 0, duration: 0.8, transition: 'cut' },
          ],
        }
      }
      if (drawCountInKyoku <= 8) {
        return {
          shots: [
            {
              to: seatFocusView(event.seat, 48),
              offset: 0,
              duration: Math.min(0.6, duration),
            },
          ],
        }
      }
      return { shots: [] }
    }
    case 'discard': {
      if (event.riichiDeclaration) {
        return {
          shots: [
            {
              to: seatFocusView(event.seat, 30),
              offset: 0,
              duration: 0.8,
              transition: 'cut',
            },
          ],
        }
      }
      return { shots: [] }
    }
    case 'riichiStick':
      return {
        shots: [
          {
            to: { ...PANEL_VIEW, fov: 38 },
            offset: 0,
            duration: 0.8,
            transition: 'cut',
          },
          {
            to: BASE_VIEW,
            offset: duration - 0.6,
            duration: 0.6,
            transition: 'cut',
          },
        ],
      }
    case 'win': {
      // 裏ドラは王牌で捲れる。サイコロ・親で位置が変わるため実位置に寄る（ドラ表示と同様）。
      const uraPose = wallTilePoseAt(
        context.dice,
        context.dealer,
        LIVE_WALL_SIZE + URA_INDICATOR_DEAD_INDEX,
        true,
      )
      return {
        shots: [
          {
            to: seatFocusView(event.seat, 34),
            offset: 0,
            duration: 0.7,
            transition: 'cut',
          },
          {
            to:
              event.uraIndicators.length > 0
                ? {
                    position: [
                      uraPose.p[0] * 0.45,
                      2.4,
                      uraPose.p[2] * 0.45 + 3.6,
                    ],
                    lookAt: uraPose.p,
                    fov: 28,
                  }
                : seatFocusView(event.seat, 30),
            offset: duration * 0.6,
            duration: 1.0,
            transition: 'cut',
          },
        ],
      }
    }
    case 'payment':
      return {
        shots: [
          { to: RISE_VIEW, offset: 0, duration: 1.0, transition: 'cut' },
        ],
      }
    case 'exhaustiveDraw':
      return {
        shots: [
          { to: WIDE_VIEW, offset: 0, duration: 1.0, transition: 'cut' },
        ],
      }
    case 'kyokuEnd':
      return {
        shots: [
          { to: BASE_VIEW, offset: 0, duration: 0.8, transition: 'cut' },
        ],
      }
    case 'kyokuStart':
      return event.digest === 'highlight'
        ? {
            shots: [
              {
                to: WIDE_VIEW,
                offset: 0,
                duration: 1.0,
                transition: 'fadeCut',
              },
            ],
          }
        : { shots: [] }
    case 'digestSkip':
      return {
        shots: [
          { to: BASE_VIEW, offset: 0, duration: 1.0, transition: 'fadeCut' },
        ],
      }
    case 'gameEnd':
      return {
        shots: [
          {
            to: OVERHEAD_VIEW,
            offset: 0.5,
            duration: 1.0,
            transition: 'fadeCut',
          },
        ],
      }
  }
}
