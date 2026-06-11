import type { Pose } from '@/core/sim/boardLayout'
import type { CameraPose, Easing, Vec3 } from './timelineTypes'

export const applyEasing = (easing: Easing, t: number): number => {
  const clamped = Math.min(1, Math.max(0, t))
  switch (easing) {
    case 'linear':
      return clamped
    case 'outQuint':
      return 1 - (1 - clamped) ** 5
    case 'inOutCubic':
      return clamped < 0.5
        ? 4 * clamped ** 3
        : 1 - (-2 * clamped + 2) ** 3 / 2
    case 'outBack': {
      const c1 = 1.70158
      const c3 = c1 + 1
      return 1 + c3 * (clamped - 1) ** 3 + c1 * (clamped - 1) ** 2
    }
  }
}

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t

export const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
]

const lerpAngle = (a: number, b: number, t: number): number => {
  const tau = Math.PI * 2
  const delta = (((b - a) % tau) + tau * 1.5) % tau - Math.PI
  return a + delta * t
}

export const lerpPose = (
  from: Pose,
  to: Pose,
  t: number,
  arcHeight: number,
): Pose => {
  const arc = arcHeight * 4 * t * (1 - t)
  return {
    p: [
      lerp(from.p[0], to.p[0], t),
      lerp(from.p[1], to.p[1], t) + arc,
      lerp(from.p[2], to.p[2], t),
    ],
    e: [
      lerpAngle(from.e[0], to.e[0], t),
      lerpAngle(from.e[1], to.e[1], t),
      lerpAngle(from.e[2], to.e[2], t),
    ],
  }
}

export const lerpCamera = (
  from: CameraPose,
  to: CameraPose,
  t: number,
): CameraPose => ({
  position: lerpVec3(from.position, to.position, t),
  lookAt: lerpVec3(from.lookAt, to.lookAt, t),
  fov: lerp(from.fov, to.fov, t),
})
