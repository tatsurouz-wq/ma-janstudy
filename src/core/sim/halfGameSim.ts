import { createRng } from '../tiles/random'
import type { TileInstance } from '../tiles/tile'
import type { Wind } from '../score/types'
import type { SeatId } from './seatTypes'
import { nextSeat, SEAT_LABELS, USER_SEAT } from './seatTypes'
import type {
  BoardState,
  KyokuSummary,
  RankEntry,
  ScenarioEvent,
  Scores,
  SnapshotBoard,
} from './scenarioEvents'
import { applyEvent, INITIAL_BOARD } from './scenarioEvents'
import type { KyokuConfig, KyokuOutcome } from './kyokuSim'
import { simulateKyoku } from './kyokuSim'

export type DigestLevel = 'full' | 'highlight' | 'skip'

export const SHOWCASE_SEED = 4

export interface KyokuRecord {
  readonly config: KyokuConfig
  readonly outcome: KyokuOutcome
  readonly digest: DigestLevel
}

export interface HalfGameScenario {
  readonly seed: number
  readonly userSeat: SeatId
  readonly records: readonly KyokuRecord[]
  readonly events: readonly ScenarioEvent[]
  readonly ranking: readonly RankEntry[]
}

const TAIL_DRAW_COUNT = 6

const paymentLabelOf = (outcome: KyokuOutcome): string => {
  if (outcome.result.type === 'draw') {
    return `流局（テンパイ${outcome.result.tenpaiSeats.length}人）`
  }
  const { seat, winType, result } = outcome.result
  const total = result.points.payments.total.toLocaleString()
  const how = winType === 'tsumo' ? 'ツモ' : 'ロン'
  return `${SEAT_LABELS[seat]}が${total}点を${how}和了`
}

const rankingOf = (
  scores: Scores,
  kyotaku: number,
): readonly RankEntry[] => {
  const ordered = ([0, 1, 2, 3] as const)
    .map((seat) => ({ seat, score: scores[seat] ?? 0 }))
    .sort((a, b) => b.score - a.score || a.seat - b.seat)
  return ordered.map((entry, index) => ({
    seat: entry.seat,
    score: index === 0 ? entry.score + kyotaku * 1000 : entry.score,
    rank: index + 1,
  }))
}

const extractSnapshot = (
  board: BoardState,
  turnSeat: SeatId,
): SnapshotBoard => {
  const placements = [...board.tiles.values()]
  const handsFor = (seat: SeatId): readonly TileInstance[] =>
    placements
      .filter((p) => p.zone.kind === 'hand' && p.zone.seat === seat)
      .sort((a, b) =>
        a.zone.kind === 'hand' && b.zone.kind === 'hand'
          ? a.zone.index - b.zone.index
          : 0,
      )
      .map((p) => p.tile)
  const riversFor = (seat: SeatId) =>
    placements
      .filter((p) => p.zone.kind === 'river' && p.zone.seat === seat)
      .sort((a, b) =>
        a.zone.kind === 'river' && b.zone.kind === 'river'
          ? a.zone.index - b.zone.index
          : 0,
      )
      .map((p) => ({
        tile: p.tile,
        riichiTilt: p.zone.kind === 'river' && p.zone.riichiTilt,
      }))
  const liveWall = placements
    .filter((p) => p.zone.kind === 'wall')
    .sort((a, b) =>
      a.zone.kind === 'wall' && b.zone.kind === 'wall'
        ? a.zone.drawIndex - b.zone.drawIndex
        : 0,
    )
    .map((p) => p.tile)
  const deadPlacements = placements
    .filter((p) => p.zone.kind === 'deadWall')
    .sort((a, b) =>
      a.zone.kind === 'deadWall' && b.zone.kind === 'deadWall'
        ? a.zone.index - b.zone.index
        : 0,
    )
  const doraIndicator = deadPlacements.find(
    (p) => p.zone.kind === 'deadWall' && p.zone.faceUp,
  )
  if (doraIndicator === undefined) {
    throw new Error('スナップショットにドラ表示牌がありません')
  }
  return {
    hands: ([0, 1, 2, 3] as const).map((seat) => handsFor(seat)),
    rivers: ([0, 1, 2, 3] as const).map((seat) => riversFor(seat)),
    liveWall,
    deadWall: deadPlacements.map((p) => p.tile),
    doraIndicator: doraIndicator.tile,
    riichiDeclared: board.riichiDeclared,
    scores: board.scores,
    kyotaku: board.kyotaku,
    honba: board.honba,
    turnSeat,
  }
}

const highlightEvents = (
  record: KyokuRecord,
): readonly ScenarioEvent[] => {
  const events = record.outcome.events
  const drawIndices = events.flatMap((e, i) => (e.kind === 'draw' ? [i] : []))
  const tailStartIndex =
    drawIndices.length > TAIL_DRAW_COUNT
      ? (drawIndices[drawIndices.length - TAIL_DRAW_COUNT] ?? 0)
      : (drawIndices[0] ?? events.length)
  const tailStart = events[tailStartIndex]
  if (tailStart === undefined || tailStart.kind !== 'draw') {
    return events.map((e) =>
      e.kind === 'kyokuStart' ? { ...e, digest: 'highlight' as const } : e,
    )
  }
  const boardBefore = events
    .slice(0, tailStartIndex)
    .reduce(applyEvent, INITIAL_BOARD)
  const snapshot = extractSnapshot(boardBefore, tailStart.seat)
  const kyokuStart = events[0]
  const head: ScenarioEvent[] =
    kyokuStart !== undefined && kyokuStart.kind === 'kyokuStart'
      ? [{ ...kyokuStart, digest: 'highlight' }]
      : []
  return [
    ...head,
    { kind: 'boardSnapshot', board: snapshot },
    ...events.slice(tailStartIndex),
  ]
}

const summaryOf = (record: KyokuRecord): KyokuSummary => ({
  round: record.config.round,
  kyoku: record.config.kyoku,
  honba: record.config.honba,
  dealer: record.config.dealer,
  headline: paymentLabelOf(record.outcome),
  scoresAfter: record.outcome.scoresAfter,
  kyotakuAfter: record.outcome.kyotakuAfter,
})

const assignDigests = (
  records: readonly Omit<KyokuRecord, 'digest'>[],
): readonly KyokuRecord[] => {
  const lastIndex = records.length - 1
  const userDealerIndex = records.findIndex(
    (r, i) => i > 0 && r.config.dealer === USER_SEAT,
  )
  const bigWinIndex = records.findIndex(
    (r, i) =>
      i > 0 &&
      r.outcome.result.type === 'win' &&
      r.outcome.result.result.points.limit !== 'none',
  )
  const mutableHighlights = new Set<number>()
  for (const index of [lastIndex, userDealerIndex, bigWinIndex]) {
    if (index > 0 && mutableHighlights.size < 3) {
      mutableHighlights.add(index)
    }
  }
  return records.map((record, index) => ({
    ...record,
    digest:
      index === 0
        ? ('full' as const)
        : mutableHighlights.has(index)
          ? ('highlight' as const)
          : ('skip' as const),
  }))
}

export const generateHalfGame = (seed: number): HalfGameScenario => {
  const mutableRecords: Omit<KyokuRecord, 'digest'>[] = []
  const mutableState = {
    rng: createRng(seed),
    dealer: 0 as SeatId,
    round: 1 as Wind,
    kyoku: 1,
    honba: 0,
    kyotaku: 0,
    scores: [25000, 25000, 25000, 25000] as Scores,
  }

  for (;;) {
    const config: KyokuConfig = {
      round: mutableState.round,
      kyoku: mutableState.kyoku,
      dealer: mutableState.dealer,
      honba: mutableState.honba,
      kyotaku: mutableState.kyotaku,
      scores: mutableState.scores,
    }
    const [outcome, nextRng] = simulateKyoku(mutableState.rng, config)
    mutableRecords.push({ config, outcome })
    mutableState.rng = nextRng
    mutableState.scores = outcome.scoresAfter
    mutableState.kyotaku = outcome.kyotakuAfter
    mutableState.honba = outcome.honbaAfter
    const busted = outcome.scoresAfter.some((s) => s < 0)
    if (busted) {
      break
    }
    if (outcome.dealerKept) {
      continue
    }
    if (mutableState.kyoku === 4) {
      if (mutableState.round === 2) {
        break
      }
      mutableState.round = 2 as Wind
      mutableState.kyoku = 1
    } else {
      mutableState.kyoku += 1
    }
    mutableState.dealer = nextSeat(mutableState.dealer)
  }

  const records = assignDigests(mutableRecords)
  const ranking = rankingOf(mutableState.scores, mutableState.kyotaku)

  const mutableEvents: ScenarioEvent[] = [{ kind: 'machineStart' }]
  for (const record of records) {
    if (record.digest === 'full') {
      mutableEvents.push(...record.outcome.events)
    } else if (record.digest === 'highlight') {
      mutableEvents.push(...highlightEvents(record))
    } else {
      mutableEvents.push({ kind: 'digestSkip', summary: summaryOf(record) })
    }
  }
  mutableEvents.push({ kind: 'gameEnd', ranking })

  return {
    seed,
    userSeat: USER_SEAT,
    records,
    events: mutableEvents,
    ranking,
  }
}

export const isShowcaseWorthy = (scenario: HalfGameScenario): boolean => {
  const first = scenario.records[0]
  if (first === undefined) {
    return false
  }
  const userWinsFirst =
    first.outcome.result.type === 'win' &&
    first.outcome.result.seat === USER_SEAT
  const hasBigWin = scenario.records.some(
    (r) =>
      r.outcome.result.type === 'win' &&
      r.outcome.result.result.points.limit !== 'none',
  )
  const noBust = scenario.records.every((r) =>
    r.outcome.scoresAfter.every((s) => s >= 0),
  )
  return userWinsFirst && hasBigWin && noBust && scenario.records.length >= 5
}
