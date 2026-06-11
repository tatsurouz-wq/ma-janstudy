import type {
  BoardState,
  ScenarioEvent,
  TileZone,
} from '@/core/sim/scenarioEvents'
import { applyEvent, INITIAL_BOARD } from '@/core/sim/scenarioEvents'
import type { LayoutContext, Pose } from '@/core/sim/boardLayout'
import { INSIDE_MACHINE_POSE, tilePoseFor } from '@/core/sim/boardLayout'
import type { SeatId } from '@/core/sim/seatTypes'
import type { HalfGameScenario } from '@/core/sim/halfGameSim'
import type {
  CaptionClip,
  Chapter,
  CompileOptions,
  Easing,
  FxClip,
  TileMoveClip,
  Timeline,
  TimelineClip,
} from './timelineTypes'
import type { CameraScriptState } from './cameraScript'
import {
  buildShot,
  cameraPlanFor,
  INITIAL_CAMERA_STATE,
} from './cameraScript'
import type { CaptionScriptState } from './captionScript'
import {
  captionFor,
  INITIAL_CAPTION_STATE,
  trackKyotakuBeforeWin,
} from './captionScript'

const FALLBACK_DICE: readonly [number, number] = [3, 4]

interface CompileCursor {
  readonly board: BoardState
  readonly dealer: SeatId
  readonly dice: readonly [number, number]
  readonly drawCountInKyoku: number
  readonly kyokuIndex: number
  readonly cameraState: CameraScriptState
  readonly captionState: CaptionScriptState
  readonly lastCaptionEnd: number
}

const eventDuration = (
  event: ScenarioEvent,
  cursor: CompileCursor,
): number => {
  const compressed = cursor.drawCountInKyoku > 12
  switch (event.kind) {
    case 'machineStart':
      return 6
    case 'kyokuStart':
      return event.digest === 'highlight' ? 3.5 : 0.6
    case 'shuffle':
      return cursor.kyokuIndex <= 1 ? 4 : 2
    case 'wallRise':
      return cursor.kyokuIndex <= 1 ? 3 : 1.6
    case 'dice':
      return cursor.kyokuIndex <= 1 ? 3.5 : 1.6
    case 'deal':
      return cursor.kyokuIndex <= 1 ? 9 : 5
    case 'boardSnapshot':
      return 1.6
    case 'draw':
      return event.seat === 1
        ? compressed
          ? 0.9
          : 1.3
        : compressed
          ? 0.45
          : 0.7
    case 'discard':
      return event.riichiDeclaration ? 2.4 : compressed ? 0.5 : 0.8
    case 'riichiStick':
      return 1.8
    case 'win':
      return 8
    case 'payment':
      return 5.5
    case 'exhaustiveDraw':
      return 3
    case 'kyokuEnd':
      return 1.2
    case 'digestSkip':
      return 5
    case 'gameEnd':
      return 12
  }
}

const zonesEqual = (a: TileZone, b: TileZone): boolean =>
  JSON.stringify(a) === JSON.stringify(b)

const layoutCtx = (
  cursor: CompileCursor,
): LayoutContext => ({
  dice: cursor.dice,
  dealer: cursor.dealer,
  userSeat: 1,
})

interface MoveTiming {
  readonly start: number
  readonly duration: number
  readonly arcHeight: number
  readonly easing: Easing
}

const moveTiming = (
  event: ScenarioEvent,
  beforeZone: TileZone | null,
  afterZone: TileZone | null,
  rank: number,
  eventDur: number,
): MoveTiming => {
  switch (event.kind) {
    case 'wallRise':
      return { start: 0.6, duration: 1.2, arcHeight: 0, easing: 'outQuint' }
    case 'deal': {
      if (beforeZone?.kind === 'wall') {
        const group = Math.floor(rank / 4)
        const start =
          rank < 48
            ? 0.4 + group * (eventDur * 0.55) / 12
            : 0.4 + eventDur * 0.55 + (rank - 48) * 0.25
        return { start, duration: 0.45, arcHeight: 0.4, easing: 'outQuint' }
      }
      if (afterZone?.kind === 'deadWall') {
        return {
          start: eventDur - 2.0,
          duration: 0.8,
          arcHeight: 0.25,
          easing: 'inOutCubic',
        }
      }
      return {
        start: eventDur - 1.4 + rank * 0.04,
        duration: 0.35,
        arcHeight: 0.05,
        easing: 'outQuint',
      }
    }
    case 'draw':
      return { start: 0, duration: 0.5, arcHeight: 0.35, easing: 'outQuint' }
    case 'discard':
      if (afterZone?.kind === 'river') {
        return { start: 0.05, duration: 0.55, arcHeight: 0.5, easing: 'outQuint' }
      }
      return {
        start: 0.45 + rank * 0.03,
        duration: 0.3,
        arcHeight: 0.03,
        easing: 'outQuint',
      }
    case 'win':
      if (afterZone?.kind === 'winReveal') {
        return {
          start: 1.2 + rank * 0.07,
          duration: 0.4,
          arcHeight: 0.15,
          easing: 'outBack',
        }
      }
      return { start: 4.6, duration: 0.6, arcHeight: 0.2, easing: 'inOutCubic' }
    case 'boardSnapshot':
      return { start: 0, duration: 0.01, arcHeight: 0, easing: 'linear' }
    case 'kyokuStart':
    case 'digestSkip':
      return {
        start: 0.1,
        duration: 0.9,
        arcHeight: 0,
        easing: 'inOutCubic',
      }
    default:
      return { start: 0.1, duration: 0.5, arcHeight: 0.1, easing: 'outQuint' }
  }
}

const tileClipsFor = (
  event: ScenarioEvent,
  before: BoardState,
  after: BoardState,
  cursor: CompileCursor,
  t: number,
  eventDur: number,
): readonly TileMoveClip[] => {
  const ctx = layoutCtx(cursor)
  
  const mutableMoves: {
    readonly tileId: string
    readonly from: Pose
    readonly to: Pose
    readonly beforeZone: TileZone | null
    readonly afterZone: TileZone | null
    readonly sortKey: number
  }[] = []

  for (const [tileId, placed] of after.tiles) {
    const previous = before.tiles.get(tileId)
    if (previous !== undefined && zonesEqual(previous.zone, placed.zone)) {
      continue
    }
    const to = tilePoseFor(placed.zone, ctx)
    const from =
      event.kind === 'wallRise'
        ? { p: [to.p[0], to.p[1] - 1.1, to.p[2]] as const, e: to.e }
        : previous !== undefined
          ? tilePoseFor(previous.zone, ctx)
          : INSIDE_MACHINE_POSE
    const sortKey =
      previous?.zone.kind === 'wall'
        ? previous.zone.drawIndex
        : placed.zone.kind === 'winReveal'
          ? placed.zone.index
          : placed.zone.kind === 'hand'
            ? placed.zone.index
            : 0
    mutableMoves.push({
      tileId,
      from,
      to,
      beforeZone: previous?.zone ?? null,
      afterZone: placed.zone,
      sortKey,
    })
  }
  for (const [tileId, placed] of before.tiles) {
    if (!after.tiles.has(tileId)) {
      mutableMoves.push({
        tileId,
        from: tilePoseFor(placed.zone, ctx),
        to: INSIDE_MACHINE_POSE,
        beforeZone: placed.zone,
        afterZone: null,
        sortKey: 0,
      })
    }
  }

  const sorted = [...mutableMoves].sort((a, b) => a.sortKey - b.sortKey)
  return sorted.map((move, rank) => {
    const timing = moveTiming(
      event,
      move.beforeZone,
      move.afterZone,
      rank,
      eventDur,
    )
    return {
      track: 'tile' as const,
      tileId: move.tileId,
      t0: t + timing.start,
      t1: t + timing.start + timing.duration,
      from: move.from,
      to: move.to,
      arcHeight: timing.arcHeight,
      easing: timing.easing,
    }
  })
}

const fxClipsFor = (
  event: ScenarioEvent,
  t: number,
  eventDur: number,
): readonly FxClip[] => {
  switch (event.kind) {
    case 'machineStart':
      return [
        { track: 'fx', t0: t, t1: t + 1.4, fx: 'fadeIn' },
        { track: 'fx', t0: t + 1.2, t1: t + eventDur, fx: 'buttonGlow' },
      ]
    case 'shuffle':
      return [{ track: 'fx', t0: t + 0.3, t1: t + eventDur - 0.4, fx: 'tableShake' }]
    case 'dice':
      return [{ track: 'fx', t0: t + 0.4, t1: t + Math.min(2.4, eventDur), fx: 'diceRoll' }]
    case 'discard':
      return event.riichiDeclaration
        ? [
            {
              track: 'fx',
              t0: t,
              t1: t + 1.6,
              fx: 'callout',
              seat: event.seat,
              text: 'リーチ',
            },
          ]
        : []
    case 'riichiStick':
      return [{ track: 'fx', t0: t, t1: t + 1.5, fx: 'scoreRoll', seat: event.seat }]
    case 'win':
      return [
        {
          track: 'fx',
          t0: t + 0.15,
          t1: t + 1.8,
          fx: 'callout',
          seat: event.seat,
          text: event.winType === 'tsumo' ? 'ツモ' : 'ロン',
        },
      ]
    case 'payment':
      return [{ track: 'fx', t0: t + 0.6, t1: t + 3, fx: 'scoreRoll' }]
    case 'kyokuStart':
      return event.digest === 'highlight'
        ? [{ track: 'fx', t0: t, t1: t + 2.6, fx: 'chapterCard' }]
        : []
    case 'digestSkip':
      return [{ track: 'fx', t0: t, t1: t + eventDur - 0.5, fx: 'chapterCard' }]
    case 'gameEnd':
      return [
        { track: 'fx', t0: t + 2, t1: t + eventDur, fx: 'endCard' },
        { track: 'fx', t0: t + eventDur - 1.2, t1: t + eventDur, fx: 'fadeOut' },
      ]
    default:
      return []
  }
}

const lookaheadDice = (
  events: readonly ScenarioEvent[],
  fromIndex: number,
): readonly [number, number] => {
  for (let i = fromIndex; i < events.length; i += 1) {
    const e = events[i]
    if (e?.kind === 'dice') {
      return e.values
    }
    if (e?.kind === 'kyokuStart' && i > fromIndex) {
      break
    }
  }
  return FALLBACK_DICE
}

export const compileTimeline = (
  scenario: HalfGameScenario,
  options: CompileOptions,
): Timeline => {
  const events = scenario.events
  const highlightStartIndices = events.flatMap((e, i) =>
    e.kind === 'kyokuStart' && e.digest === 'highlight' ? [i] : [],
  )
  const lastHighlightIndex = highlightStartIndices.at(-1)

  const mutableClips: TimelineClip[] = []
  const mutableChapters: Chapter[] = []
  const mutableEventTimes: { t: number; eventIndex: number }[] = []
  const mutableSeenChapters = new Set<string>()

  const mutableCursor = {
    value: {
      board: INITIAL_BOARD,
      dealer: 0 as SeatId,
      dice: FALLBACK_DICE,
      drawCountInKyoku: 0,
      kyokuIndex: 0,
      cameraState: INITIAL_CAMERA_STATE,
      captionState: INITIAL_CAPTION_STATE,
      lastCaptionEnd: 0,
    } satisfies CompileCursor,
  }
  const mutableTime = { value: 0 }

  const addChapter = (id: string, label: string, eventIndex: number) => {
    if (mutableSeenChapters.has(id)) {
      return
    }
    mutableSeenChapters.add(id)
    mutableChapters.push({ id, label, t: mutableTime.value, eventIndex })
  }

  events.forEach((event, eventIndex) => {
    const cursorBefore = mutableCursor.value
    const updatedMeta: Partial<CompileCursor> =
      event.kind === 'kyokuStart'
        ? {
            dealer: event.dealer,
            dice: lookaheadDice(events, eventIndex),
            drawCountInKyoku: 0,
            kyokuIndex: cursorBefore.kyokuIndex + 1,
            captionState: trackKyotakuBeforeWin(
              cursorBefore.captionState,
              event.kyotaku,
            ),
          }
        : event.kind === 'draw'
          ? { drawCountInKyoku: cursorBefore.drawCountInKyoku + 1 }
          : event.kind === 'riichiStick'
            ? {
                captionState: trackKyotakuBeforeWin(
                  cursorBefore.captionState,
                  cursorBefore.board.kyotaku + 1,
                ),
              }
            : {}
    const cursor: CompileCursor = { ...cursorBefore, ...updatedMeta }
    const t = mutableTime.value
    const duration = eventDuration(event, cursor)
    const after = applyEvent(cursor.board, event)

    mutableEventTimes.push({ t, eventIndex })
    mutableClips.push(
      ...tileClipsFor(event, cursor.board, after, cursor, t, duration),
    )

    const plan = cameraPlanFor(event, {
      userSeat: scenario.userSeat,
      drawCountInKyoku: cursor.drawCountInKyoku,
      duration,
    })
    const mutableCameraState = { value: cursor.cameraState }
    for (const shot of plan.shots) {
      const [clip, nextState] = buildShot(
        mutableCameraState.value,
        shot,
        t,
        options.reducedMotion,
      )
      mutableClips.push(clip)
      if (clip.transition === 'fadeCut') {
        mutableClips.push(
          {
            track: 'fx',
            t0: Math.max(0, clip.t0 - 0.25),
            t1: clip.t0,
            fx: 'fadeOut',
          },
          { track: 'fx', t0: clip.t0, t1: clip.t0 + 0.3, fx: 'fadeIn' },
        )
      }
      mutableCameraState.value = nextState
    }

    const captionResult = captionFor(event, cursor.captionState, {
      userSeat: scenario.userSeat,
    })
    const mutableLastCaptionEnd = { value: cursor.lastCaptionEnd }
    if (captionResult.spec !== null) {
      const start = Math.max(t + 0.25, cursor.lastCaptionEnd + 0.15)
      const end = start + captionResult.spec.minDuration
      const captionClip: CaptionClip = {
        track: 'caption',
        t0: start,
        t1: end,
        segments: captionResult.spec.segments,
        learning: captionResult.spec.learning,
      }
      mutableClips.push(captionClip)
      mutableLastCaptionEnd.value = end
    }

    mutableClips.push(...fxClipsFor(event, t, duration))

    switch (event.kind) {
      case 'machineStart':
        addChapter('start', '卓起動', eventIndex)
        break
      case 'deal':
        addChapter('deal', '配牌', eventIndex)
        break
      case 'draw':
        addChapter('play', '対局開始', eventIndex)
        break
      case 'riichiStick':
        addChapter('riichi', 'リーチ', eventIndex)
        break
      case 'win':
        addChapter('win', '和了', eventIndex)
        break
      case 'payment':
        if (cursor.captionState.lastWin !== null) {
          addChapter('settle', '精算', eventIndex)
        }
        break
      case 'kyokuStart':
        if (event.digest === 'highlight') {
          const label =
            event.dealer === scenario.userSeat
              ? '自分の親番'
              : eventIndex === lastHighlightIndex
                ? 'オーラス'
                : '見どころ'
          addChapter(`kyoku-${eventIndex}`, label, eventIndex)
        }
        break
      case 'gameEnd':
        addChapter('end', '終局', eventIndex)
        break
      default:
        break
    }

    mutableCursor.value = {
      ...cursor,
      board: after,
      cameraState: mutableCameraState.value,
      captionState: captionResult.state,
      lastCaptionEnd: mutableLastCaptionEnd.value,
    }
    mutableTime.value = t + duration
  })

  const sortedClips = [...mutableClips].sort((a, b) => a.t0 - b.t0)
  return {
    clips: sortedClips,
    chapters: mutableChapters,
    duration: mutableTime.value,
    eventTimes: mutableEventTimes,
  }
}
