import { useEffect, useMemo, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import type { CaptionClip, FxClip, Timeline } from '../timeline/timelineTypes'
import { eventIndexAtTime } from '../timeline/replay'
import { useHudStore, usePlaybackStore } from '../playbackStore'
import { PlaybackClock } from './PlaybackClock'
import { TileTrackPlayer } from './TileTrackPlayer'
import { CameraRig } from './CameraRig'

interface PlaybackDriverProps {
  readonly timeline: Timeline
  readonly tileRefs: RefObject<ReadonlyMap<string, THREE.Group>>
  readonly tableRef: RefObject<THREE.Group | null>
}

const progressOf = (clip: { t0: number; t1: number }, t: number): number =>
  Math.min(1, Math.max(0, (t - clip.t0) / Math.max(clip.t1 - clip.t0, 1e-6)))

export function PlaybackDriver({
  timeline,
  tileRefs,
  tableRef,
}: PlaybackDriverProps) {
  const camera = useThree((state) => state.camera)
  const advanceFrame = useThree((state) => state.advance)
  const clock = useMemo(() => new PlaybackClock(), [])

  useEffect(() => {
    const mutableHandles = { raf: 0 }
    const tick = () => {
      advanceFrame(performance.now() / 1000)
      mutableHandles.raf = window.requestAnimationFrame(tick)
    }
    mutableHandles.raf = window.requestAnimationFrame(tick)
    const interval = window.setInterval(() => {
      if (document.hidden) {
        advanceFrame(performance.now() / 1000)
      }
    }, 100)
    return () => {
      window.cancelAnimationFrame(mutableHandles.raf)
      window.clearInterval(interval)
    }
  }, [advanceFrame])
  const tilePlayer = useMemo(() => new TileTrackPlayer(timeline), [timeline])
  const rig = useMemo(() => new CameraRig(timeline), [timeline])
  const fxClips = useMemo(
    () => timeline.clips.filter((c): c is FxClip => c.track === 'fx'),
    [timeline],
  )
  const captionClips = useMemo(
    () =>
      timeline.clips.filter(
        (c): c is CaptionClip => c.track === 'caption',
      ),
    [timeline],
  )

  useFrame((_, delta) => {
    const playback = usePlaybackStore.getState()
    if (playback.seekTarget !== null) {
      clock.setTime(playback.seekTarget)
      tilePlayer.resync()
      rig.resync()
      playback.clearSeek()
    }
    const t =
      playback.status === 'playing'
        ? clock.advance(delta, playback.speed)
        : clock.now()
    if (playback.status === 'playing' && t >= timeline.duration) {
      playback.markEnded()
    }

    tilePlayer.apply(t, tileRefs.current ?? new Map())
    rig.apply(t, camera as THREE.PerspectiveCamera)

    const mutableHud = {
      fade: 0,
      captionIndex: null as number | null,
      calloutText: null as string | null,
      buttonGlow: 0,
      eventIndex: eventIndexAtTime(timeline, t),
      chapterCardVisible: false,
    }
    const mutableShake = { value: 0 }
    for (const fx of fxClips) {
      if (t < fx.t0 || t > fx.t1) {
        continue
      }
      const progress = progressOf(fx, t)
      switch (fx.fx) {
        case 'fadeIn':
          mutableHud.fade = Math.max(mutableHud.fade, 1 - progress)
          break
        case 'fadeOut':
          mutableHud.fade = Math.max(mutableHud.fade, progress)
          break
        case 'callout':
          mutableHud.calloutText = fx.text ?? null
          break
        case 'buttonGlow':
          mutableHud.buttonGlow = 0.5 + 0.5 * Math.sin(t * 4)
          break
        case 'tableShake':
          mutableShake.value = 0.015 * Math.sin(t * 60) * (1 - progress * 0.5)
          break
        case 'chapterCard':
          mutableHud.chapterCardVisible = true
          break
        case 'diceRoll':
        case 'scoreRoll':
        case 'endCard':
          break
      }
    }
    const table = tableRef.current
    if (table !== null) {
      table.position.set(mutableShake.value, 0, mutableShake.value * 0.6)
    }

    const captionIndex = captionClips.findIndex(
      (c) => t >= c.t0 && t <= c.t1,
    )
    mutableHud.captionIndex = captionIndex >= 0 ? captionIndex : null

    useHudStore.getState().update({
      fade: Math.round(mutableHud.fade * 20) / 20,
      captionIndex: mutableHud.captionIndex,
      calloutText: mutableHud.calloutText,
      buttonGlow: Math.round(mutableHud.buttonGlow * 10) / 10,
      eventIndex: mutableHud.eventIndex,
      chapterCardVisible: mutableHud.chapterCardVisible,
    })
    playback.reportTime(t)
  })

  return null
}
