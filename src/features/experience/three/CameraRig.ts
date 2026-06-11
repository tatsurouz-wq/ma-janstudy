import type * as THREE from 'three'
import type { CameraClip, CameraPose, Timeline } from '../timeline/timelineTypes'
import { applyEasing, lerpCamera } from '../timeline/interpolate'

export class CameraRig {
  private readonly clips: readonly CameraClip[]
  private cursor = 0

  constructor(timeline: Timeline) {
    this.clips = timeline.clips.filter(
      (c): c is CameraClip => c.track === 'camera',
    )
  }

  resync(): void {
    this.cursor = 0
  }

  poseAt(t: number): CameraPose | null {
    while (
      this.cursor + 1 < this.clips.length &&
      (this.clips[this.cursor + 1]?.t0 ?? Infinity) <= t
    ) {
      this.cursor += 1
    }
    while (this.cursor > 0 && (this.clips[this.cursor]?.t0 ?? 0) > t) {
      this.cursor -= 1
    }
    const clip = this.clips[this.cursor]
    if (clip === undefined) {
      return null
    }
    if (t < clip.t0) {
      return clip.from
    }
    if (t >= clip.t1) {
      return clip.to
    }
    const progress = applyEasing(
      clip.easing,
      (t - clip.t0) / Math.max(clip.t1 - clip.t0, 1e-6),
    )
    return lerpCamera(clip.from, clip.to, progress)
  }

  apply(t: number, camera: THREE.PerspectiveCamera): void {
    const pose = this.poseAt(t)
    if (pose === null) {
      return
    }
    camera.position.set(pose.position[0], pose.position[1], pose.position[2])
    camera.lookAt(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2])
    if (Math.abs(camera.fov - pose.fov) > 0.01) {
      camera.fov = pose.fov
      camera.updateProjectionMatrix()
    }
  }
}
