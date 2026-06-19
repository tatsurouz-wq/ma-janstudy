import { describe, expect, it } from 'vitest'
import { generateHalfGame, SHOWCASE_SEED } from '@/core/sim/halfGameSim'
import {
  MAX_CONTINUOUS_MOVE,
  MAX_PAN_SPEED_DEG,
  panAngleDeg,
  positionDelta,
} from './cameraScript'
import { applyEasing, lerpPose } from './interpolate'
import { compileTimeline } from './compileTimeline'
import { eventIndexAtTime, boardPosesAt } from './replay'

const scenario = generateHalfGame(SHOWCASE_SEED)
const timeline = compileTimeline(scenario, { reducedMotion: false })

describe('compileTimeline', () => {
  it('クリップはt0昇順で、すべてt1>=t0', () => {
    const mutablePrev = { value: 0 }
    for (const clip of timeline.clips) {
      expect(clip.t0).toBeGreaterThanOrEqual(mutablePrev.value)
      expect(clip.t1).toBeGreaterThanOrEqual(clip.t0)
      mutablePrev.value = clip.t0
    }
  })

  it('全体尺は2.5分から9分の範囲に収まる', () => {
    expect(timeline.duration).toBeGreaterThan(150)
    expect(timeline.duration).toBeLessThan(540)
  })

  it('必須チャプターがそろっている', () => {
    const ids = timeline.chapters.map((c) => c.id)
    for (const required of ['start', 'deal', 'play', 'win', 'settle', 'end']) {
      expect(ids).toContain(required)
    }
    const mutablePrevT = { value: -1 }
    for (const chapter of timeline.chapters) {
      expect(chapter.t).toBeGreaterThan(mutablePrevT.value)
      mutablePrevT.value = chapter.t
    }
  })

  it('「対局開始」チャプターは親の第一打（最初のdiscard）に置かれる', () => {
    const play = timeline.chapters.find((c) => c.id === 'play')
    expect(play).toBeDefined()
    const firstDiscardIndex = scenario.events.findIndex(
      (e) => e.kind === 'discard',
    )
    const firstDrawIndex = scenario.events.findIndex((e) => e.kind === 'draw')
    expect(firstDiscardIndex).toBeGreaterThan(-1)
    // 親の第一打は最初のツモより前にある（チョンチョンの14枚目はツモを伴わない）。
    expect(firstDiscardIndex).toBeLessThan(firstDrawIndex)
    expect(play?.eventIndex).toBe(firstDiscardIndex)
    expect(scenario.events[play?.eventIndex ?? -1]?.kind).toBe('discard')
  })

  it('連続カメラ移動は角速度60度/s・移動量2.0unit以内（機械検証）', () => {
    const cameraClips = timeline.clips.filter((c) => c.track === 'camera')
    expect(cameraClips.length).toBeGreaterThan(10)
    for (const clip of cameraClips) {
      if (clip.track !== 'camera' || clip.transition !== 'continuous') {
        continue
      }
      const duration = Math.max(clip.t1 - clip.t0, 0.01)
      expect(panAngleDeg(clip.from, clip.to) / duration).toBeLessThanOrEqual(
        MAX_PAN_SPEED_DEG + 1e-6,
      )
      expect(positionDelta(clip.from, clip.to)).toBeLessThanOrEqual(
        MAX_CONTINUOUS_MOVE + 1e-6,
      )
    }
  })

  it('reducedMotion時は連続カメラ移動が存在しない', () => {
    const reduced = compileTimeline(scenario, { reducedMotion: true })
    const continuous = reduced.clips.filter(
      (c) => c.track === 'camera' && c.transition === 'continuous',
    )
    expect(continuous).toHaveLength(0)
  })

  it('学習字幕は4.4秒以上表示される（2倍速でも2.2秒確保）', () => {
    const captions = timeline.clips.filter((c) => c.track === 'caption')
    expect(captions.length).toBeGreaterThan(10)
    for (const caption of captions) {
      if (caption.track === 'caption' && caption.learning) {
        expect(caption.t1 - caption.t0).toBeGreaterThanOrEqual(4.4 - 1e-6)
      }
    }
  })

  it('字幕同士は重ならない', () => {
    const captions = timeline.clips.filter((c) => c.track === 'caption')
    for (let i = 1; i < captions.length; i += 1) {
      const prev = captions[i - 1]
      const current = captions[i]
      if (prev !== undefined && current !== undefined) {
        expect(current.t0).toBeGreaterThanOrEqual(prev.t1 - 1e-6)
      }
    }
  })

  it('「親は14枚、子は13枚」の学習字幕が配牌で出る', () => {
    const dealCaption = timeline.clips.find(
      (c) =>
        c.track === 'caption' &&
        c.segments.some(
          (s) => s.kind === 'emphasis' && s.text.includes('親は14枚'),
        ),
    )
    expect(dealCaption).toBeDefined()
  })

  it('牌移動クリップは妥当な数があり、同一牌の連続クリップで姿勢がつながる', () => {
    const tileClips = timeline.clips.filter((c) => c.track === 'tile')
    expect(tileClips.length).toBeGreaterThan(300)
    const byTile = new Map<string, typeof tileClips>()
    for (const clip of tileClips) {
      if (clip.track === 'tile') {
        byTile.set(clip.tileId, [...(byTile.get(clip.tileId) ?? []), clip])
      }
    }
    const sample = [...byTile.values()].slice(0, 12)
    for (const clips of sample) {
      for (let i = 1; i < clips.length; i += 1) {
        const prev = clips[i - 1]
        const current = clips[i]
        if (
          prev?.track === 'tile' &&
          current?.track === 'tile' &&
          prev.t1 <= current.t0
        ) {
          const gap = Math.hypot(
            current.from.p[0] - prev.to.p[0],
            current.from.p[1] - prev.to.p[1],
            current.from.p[2] - prev.to.p[2],
          )
          expect(gap).toBeLessThan(0.001)
        }
      }
    }
  })
})

describe('interpolate', () => {
  it('イージングは端点0と1を固定する', () => {
    for (const easing of ['linear', 'outQuint', 'inOutCubic', 'outBack'] as const) {
      expect(applyEasing(easing, 0)).toBeCloseTo(0)
      expect(applyEasing(easing, 1)).toBeCloseTo(1)
    }
  })

  it('lerpPoseのアーク補間は中間で持ち上がり端点では一致する', () => {
    const from = { p: [0, 0, 0] as const, e: [0, 0, 0] as const }
    const to = { p: [1, 0, 1] as const, e: [0, Math.PI / 2, 0] as const }
    const mid = lerpPose(from, to, 0.5, 0.4)
    expect(mid.p[1]).toBeCloseTo(0.4)
    expect(lerpPose(from, to, 0, 0.4).p[1]).toBeCloseTo(0)
    expect(lerpPose(from, to, 1, 0.4).p[1]).toBeCloseTo(0)
  })
})

describe('replay', () => {
  it('eventIndexAtTimeは時刻から直前のイベントを返す', () => {
    const chapter = timeline.chapters.find((c) => c.id === 'win')
    expect(chapter).toBeDefined()
    if (chapter !== undefined) {
      expect(eventIndexAtTime(timeline, chapter.t + 0.01)).toBeGreaterThanOrEqual(
        chapter.eventIndex,
      )
    }
  })

  it('boardPosesAtは全136牌の姿勢を返す', () => {
    const allTileIds = [
      ...new Set(
        timeline.clips.flatMap((c) => (c.track === 'tile' ? [c.tileId] : [])),
      ),
    ]
    expect(allTileIds.length).toBe(136)
    const dealChapter = timeline.chapters.find((c) => c.id === 'deal')
    if (dealChapter !== undefined) {
      const { poses } = boardPosesAt(
        scenario.events,
        dealChapter.eventIndex,
        scenario.userSeat,
        allTileIds,
      )
      expect(poses.size).toBe(136)
    }
  })
})
