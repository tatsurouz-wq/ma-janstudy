import type { Tile } from '@/core/tiles/tile'
import type { Pose } from '@/core/sim/boardLayout'
import type { SeatId } from '@/core/sim/seatTypes'

export type Vec3 = readonly [number, number, number]

export type Easing = 'linear' | 'outQuint' | 'inOutCubic' | 'outBack'

export interface CameraPose {
  readonly position: Vec3
  readonly lookAt: Vec3
  readonly fov: number
}

export type CameraTransition = 'continuous' | 'cut' | 'fadeCut'

export interface TileMoveClip {
  readonly track: 'tile'
  readonly tileId: string
  readonly t0: number
  readonly t1: number
  readonly from: Pose
  readonly to: Pose
  readonly arcHeight: number
  readonly easing: Easing
}

export interface CameraClip {
  readonly track: 'camera'
  readonly t0: number
  readonly t1: number
  readonly from: CameraPose
  readonly to: CameraPose
  readonly easing: Easing
  readonly transition: CameraTransition
}

export type CaptionSegment =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'emphasis'; readonly text: string }
  | { readonly kind: 'tile'; readonly tile: Tile }

export interface CaptionClip {
  readonly track: 'caption'
  readonly t0: number
  readonly t1: number
  readonly segments: readonly CaptionSegment[]
  readonly learning: boolean
}

export type FxKind =
  | 'fadeIn'
  | 'fadeOut'
  | 'buttonGlow'
  | 'tableShake'
  | 'diceRoll'
  | 'callout'
  | 'scoreRoll'
  | 'chapterCard'
  | 'endCard'

export interface FxClip {
  readonly track: 'fx'
  readonly t0: number
  readonly t1: number
  readonly fx: FxKind
  readonly seat?: SeatId
  readonly text?: string
}

export type TimelineClip = TileMoveClip | CameraClip | CaptionClip | FxClip

export interface Chapter {
  readonly id: string
  readonly label: string
  readonly t: number
  readonly eventIndex: number
}

export interface Timeline {
  readonly clips: readonly TimelineClip[]
  readonly chapters: readonly Chapter[]
  readonly duration: number
  readonly eventTimes: readonly {
    readonly t: number
    readonly eventIndex: number
  }[]
}

export interface CompileOptions {
  readonly reducedMotion: boolean
}
