import type * as THREE from 'three'
import type { Pose } from '@/core/sim/boardLayout'
import { INSIDE_MACHINE_POSE } from '@/core/sim/boardLayout'
import type { TileMoveClip, Timeline } from '../timeline/timelineTypes'
import { applyEasing, lerpPose } from '../timeline/interpolate'

interface TileTrack {
  readonly clips: readonly TileMoveClip[]
  cursor: number
}

export class TileTrackPlayer {
  private readonly tracks = new Map<string, TileTrack>()

  constructor(timeline: Timeline) {
    for (const clip of timeline.clips) {
      if (clip.track !== 'tile') {
        continue
      }
      const track = this.tracks.get(clip.tileId)
      if (track === undefined) {
        this.tracks.set(clip.tileId, { clips: [clip], cursor: 0 })
      } else {
        this.tracks.set(clip.tileId, {
          clips: [...track.clips, clip],
          cursor: 0,
        })
      }
    }
  }

  resync(): void {
    for (const track of this.tracks.values()) {
      track.cursor = 0
    }
  }

  private poseAt(track: TileTrack, t: number): Pose {
    while (
      track.cursor + 1 < track.clips.length &&
      (track.clips[track.cursor + 1]?.t0 ?? Infinity) <= t
    ) {
      track.cursor += 1
    }
    while (track.cursor > 0 && (track.clips[track.cursor]?.t0 ?? 0) > t) {
      track.cursor -= 1
    }
    const clip = track.clips[track.cursor]
    if (clip === undefined || t < clip.t0) {
      return clip?.from ?? INSIDE_MACHINE_POSE
    }
    if (t >= clip.t1) {
      return clip.to
    }
    const progress = applyEasing(
      clip.easing,
      (t - clip.t0) / Math.max(clip.t1 - clip.t0, 1e-6),
    )
    return lerpPose(clip.from, clip.to, progress, clip.arcHeight)
  }

  apply(t: number, refs: ReadonlyMap<string, THREE.Group>): void {
    for (const [tileId, track] of this.tracks) {
      const group = refs.get(tileId)
      if (group === undefined) {
        continue
      }
      const pose = this.poseAt(track, t)
      group.position.set(pose.p[0], pose.p[1], pose.p[2])
      group.rotation.set(pose.e[0], pose.e[1], pose.e[2])
    }
  }
}
