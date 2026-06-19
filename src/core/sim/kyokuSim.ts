import type { Rng } from '../tiles/random'
import { createWall } from '../tiles/wall'
import type { TileInstance } from '../tiles/tile'
import { tileToIndex } from '../tiles/tile'
import { countsFromTiles } from '../tiles/tileCounts'
import { shanten } from '../hand/shanten'
import { waitingTiles } from '../hand/waits'
import { calculateScore } from '../score/calculate'
import type { ScoreResult, Wind, WinType } from '../score/types'
import { DEFAULT_RULE } from '../rules/ruleset'
import type { SeatId } from './seatTypes'
import { nextSeat, seatWindFor, turnOrderFrom } from './seatTypes'
import type { ScenarioEvent, Scores } from './scenarioEvents'
import {
  DORA_INDICATOR_DEAD_INDEX,
  LIVE_WALL_SIZE,
  URA_INDICATOR_DEAD_INDEX,
} from './scenarioEvents'
import { chooseDiscard } from './botAi'

export interface KyokuConfig {
  readonly round: Wind
  readonly kyoku: number
  readonly dealer: SeatId
  readonly honba: number
  readonly kyotaku: number
  readonly scores: Scores
}

export type KyokuResult =
  | {
      readonly type: 'win'
      readonly seat: SeatId
      readonly winType: WinType
      readonly fromSeat: SeatId | null
      readonly result: ScoreResult
    }
  | { readonly type: 'draw'; readonly tenpaiSeats: readonly SeatId[] }

export interface KyokuOutcome {
  readonly events: readonly ScenarioEvent[]
  readonly result: KyokuResult
  readonly scoresAfter: Scores
  readonly kyotakuAfter: number
  readonly honbaAfter: number
  readonly dealerKept: boolean
}

interface SimContext {
  readonly config: KyokuConfig
  readonly doraIndicator: TileInstance
  readonly uraIndicator: TileInstance
}

interface SeatState {
  readonly hand: readonly TileInstance[]
  readonly river: readonly TileInstance[]
  readonly riichi: 'none' | 'riichi' | 'double'
  readonly ippatsuActive: boolean
  readonly discardCount: number
  // 役なしで自分の待ち牌を見逃した直後の同巡内フリテン（次のツモまでロン不可）。
  readonly temporaryFuriten: boolean
}

const buildWinInput = (
  ctx: SimContext,
  seat: SeatId,
  concealed: readonly TileInstance[],
  winTile: TileInstance,
  winType: WinType,
  seatState: SeatState,
  isLastTile: boolean,
  kyotakuNow: number,
  isFirstDraw: boolean,
) => ({
  concealed: concealed.map((t) => t.tile),
  melds: [],
  winTile: winTile.tile,
  win: {
    winType,
    riichi: seatState.riichi,
    ippatsu: seatState.ippatsuActive,
    haitei: winType === 'tsumo' && isLastTile,
    houtei: winType === 'ron' && isLastTile,
    rinshan: false,
    chankan: false,
    // 鳴きなしのため、第一ツモ和了は親=天和・子=地和。
    tenhou: winType === 'tsumo' && isFirstDraw && seat === ctx.config.dealer,
    chiihou: winType === 'tsumo' && isFirstDraw && seat !== ctx.config.dealer,
    seatWind: seatWindFor(seat, ctx.config.dealer),
    roundWind: ctx.config.round,
  },
  doraIndicators: [ctx.doraIndicator.tile],
  uraIndicators:
    seatState.riichi !== 'none' ? [ctx.uraIndicator.tile] : [],
  redFives: concealed.filter((t) => t.isRed).length,
  honba: ctx.config.honba,
  kyotaku: kyotakuNow,
  rule: DEFAULT_RULE,
})

const winDeltas = (
  result: ScoreResult,
  winner: SeatId,
  fromSeat: SeatId | null,
  dealer: SeatId,
): Scores => {
  const mutableDeltas: [number, number, number, number] = [0, 0, 0, 0]
  const p = result.points.payments
  mutableDeltas[winner] = p.total
  if (p.type === 'ron' && fromSeat !== null) {
    mutableDeltas[fromSeat] -= p.fromDiscarder
  } else if (p.type === 'tsumo-dealer') {
    for (const seat of [0, 1, 2, 3] as const) {
      if (seat !== winner) {
        mutableDeltas[seat] -= p.fromEach
      }
    }
  } else if (p.type === 'tsumo-nondealer') {
    for (const seat of [0, 1, 2, 3] as const) {
      if (seat === winner) {
        continue
      }
      mutableDeltas[seat] -= seat === dealer ? p.fromDealer : p.fromOthers
    }
  }
  return mutableDeltas as unknown as Scores
}

const notenDeltas = (tenpaiSeats: readonly SeatId[]): Scores => {
  const t = tenpaiSeats.length
  if (t === 0 || t === 4) {
    return [0, 0, 0, 0]
  }
  const receive = 3000 / t
  const pay = 3000 / (4 - t)
  return [0, 1, 2, 3].map((seat) =>
    tenpaiSeats.includes(seat as SeatId) ? receive : -pay,
  ) as unknown as Scores
}

const addScores = (scores: Scores, deltas: Scores): Scores =>
  scores.map((s, i) => s + (deltas[i] ?? 0)) as unknown as Scores

export const simulateKyoku = (
  rng: Rng,
  config: KyokuConfig,
): readonly [KyokuOutcome, Rng] => {
  const [wallTiles, rngAfterWall] = createWall(rng)
  const [d1Raw, rngAfterD1] = rngAfterWall.next()
  const [d2Raw, rngOut] = rngAfterD1.next()
  const dice: readonly [number, number] = [
    1 + Math.floor(d1Raw * 6),
    1 + Math.floor(d2Raw * 6),
  ]

  const liveWallAll = wallTiles.slice(0, LIVE_WALL_SIZE)
  const deadWall = wallTiles.slice(LIVE_WALL_SIZE)
  const doraIndicator = deadWall[DORA_INDICATOR_DEAD_INDEX] as TileInstance
  const uraIndicator = deadWall[URA_INDICATOR_DEAD_INDEX] as TileInstance
  const order = turnOrderFrom(config.dealer)

  const mutableHands: TileInstance[][] = [[], [], [], []]
  const mutableDealIndex = { value: 0 }
  const mutableEvents: ScenarioEvent[] = [
    {
      kind: 'kyokuStart',
      round: config.round,
      kyoku: config.kyoku,
      honba: config.honba,
      kyotaku: config.kyotaku,
      dealer: config.dealer,
      scores: config.scores,
      digest: 'full',
    },
    { kind: 'shuffle' },
    { kind: 'wallRise', tiles: wallTiles },
    { kind: 'dice', values: dice },
  ]
  const mutableBlockIndex = { value: 0 }
  const takeBlock = (seat: SeatId, count: number) => {
    const tiles = liveWallAll.slice(
      mutableDealIndex.value,
      mutableDealIndex.value + count,
    )
    mutableDealIndex.value += count
    mutableHands[seat]?.push(...tiles)
    mutableEvents.push({
      kind: 'dealBlock',
      seat,
      tiles,
      blockIndex: mutableBlockIndex.value,
    })
    mutableBlockIndex.value += 1
  }
  for (let block = 0; block < 3; block += 1) {
    for (const seat of order) {
      takeBlock(seat, 4)
    }
  }
  for (const seat of order) {
    takeBlock(seat, 1)
  }
  takeBlock(config.dealer, 1)
  const dealerExtra = mutableHands[config.dealer]?.at(-1) as TileInstance
  const mutableLive = [...liveWallAll.slice(mutableDealIndex.value)]

  const ctx: SimContext = { config, doraIndicator, uraIndicator }
  mutableEvents.push(
    { kind: 'dealDora', doraIndicator },
    { kind: 'dealSort', hands: mutableHands.map((h) => [...h]) },
  )

  const mutableSeats: SeatState[] = [0, 1, 2, 3].map((seat) => ({
    hand: mutableHands[seat] ?? [],
    river: [],
    riichi: 'none' as const,
    ippatsuActive: false,
    discardCount: 0,
    temporaryFuriten: false,
  }))
  const mutableScores = { value: config.scores }
  const mutableKyotaku = { value: config.kyotaku }

  const visibleCounts = () =>
    countsFromTiles([
      ...mutableSeats.flatMap((s) => s.river.map((t) => t.tile)),
      doraIndicator.tile,
    ])

  const finishWin = (
    seat: SeatId,
    winType: WinType,
    fromSeat: SeatId | null,
    winTile: TileInstance,
    result: ScoreResult,
  ): KyokuOutcome => {
    const seatState = mutableSeats[seat] as SeatState
    mutableEvents.push({
      kind: 'win',
      seat,
      winType,
      fromSeat,
      winTile,
      result,
      uraIndicators: seatState.riichi !== 'none' ? [uraIndicator] : [],
    })
    const deltas = winDeltas(result, seat, fromSeat, config.dealer)
    const scoresAfter = addScores(mutableScores.value, deltas)
    mutableEvents.push({
      kind: 'payment',
      deltas,
      scoresAfter,
      kyotakuAfter: 0,
    })
    const dealerKept = seat === config.dealer
    mutableEvents.push({ kind: 'kyokuEnd', dealerKept })
    return {
      events: mutableEvents,
      result: { type: 'win', seat, winType, fromSeat, result },
      scoresAfter,
      kyotakuAfter: 0,
      honbaAfter: dealerKept ? config.honba + 1 : 0,
      dealerKept,
    }
  }

  const mutableTurnPtr = { value: 0 }
  while (mutableLive.length > 0) {
    const isFirstTurn = mutableTurnPtr.value === 0
    const seat = order[mutableTurnPtr.value % 4] as SeatId
    mutableTurnPtr.value += 1
    const seatState = mutableSeats[seat] as SeatState
    const drawn = isFirstTurn
      ? dealerExtra
      : (mutableLive.shift() as TileInstance)
    if (!isFirstTurn) {
      mutableEvents.push({ kind: 'draw', seat, tile: drawn })
    }
    const hand14 = isFirstTurn ? [...seatState.hand] : [...seatState.hand, drawn]
    const isLastTile = mutableLive.length === 0

    const tsumoOutcome = calculateScore(
      buildWinInput(
        ctx,
        seat,
        hand14,
        drawn,
        'tsumo',
        seatState,
        isLastTile,
        mutableKyotaku.value,
        seatState.discardCount === 0,
      ),
    )
    if (tsumoOutcome.ok) {
      return [
        finishWin(seat, 'tsumo', null, drawn, tsumoOutcome.result),
        rngOut,
      ]
    }

    const decision = chooseDiscard(hand14, drawn, visibleCounts(), {
      alreadyRiichi: seatState.riichi !== 'none',
      canRiichi:
        seatState.riichi === 'none' &&
        (mutableScores.value[seat] ?? 0) >= 1000 &&
        mutableLive.length >= 4,
    })
    const discardTile = hand14.find((t) => t.id === decision.tileId) as TileInstance
    const remainingHand = hand14.filter((t) => t.id !== decision.tileId)
    mutableEvents.push({
      kind: 'discard',
      seat,
      tile: discardTile,
      riichiDeclaration: decision.declareRiichi,
      tsumogiri: discardTile.id === drawn.id,
    })
    mutableSeats[seat] = {
      ...seatState,
      hand: remainingHand,
      river: [...seatState.river, discardTile],
      discardCount: seatState.discardCount + 1,
      // この巡で自摸ったため、前巡の見逃しによる同巡内フリテンは解除される。
      temporaryFuriten: false,
    }

    const mutableMissedRon: SeatId[] = []
    for (const other of turnOrderFrom(nextSeat(seat))) {
      if (other === seat) {
        continue
      }
      const otherState = mutableSeats[other] as SeatState
      const counts13 = countsFromTiles(otherState.hand.map((t) => t.tile))
      if (shanten(counts13) !== 0) {
        continue
      }
      const waits = waitingTiles(counts13)
      if (!waits.includes(tileToIndex(discardTile.tile))) {
        continue
      }
      const furiten = otherState.river.some((t) =>
        waits.includes(tileToIndex(t.tile)),
      )
      if (furiten || otherState.temporaryFuriten) {
        continue
      }
      const ronOutcome = calculateScore(
        buildWinInput(
          ctx,
          other,
          [...otherState.hand, discardTile],
          discardTile,
          'ron',
          otherState,
          isLastTile,
          mutableKyotaku.value,
          false,
        ),
      )
      if (ronOutcome.ok) {
        return [
          finishWin(other, 'ron', seat, discardTile, ronOutcome.result),
          rngOut,
        ]
      }
      // 待ち牌だが役なしで和了不可。次の自摸まで同巡内フリテン。
      mutableMissedRon.push(other)
    }
    for (const missed of mutableMissedRon) {
      mutableSeats[missed] = {
        ...(mutableSeats[missed] as SeatState),
        temporaryFuriten: true,
      }
    }

    const afterDiscard = mutableSeats[seat] as SeatState
    if (decision.declareRiichi) {
      mutableEvents.push({ kind: 'riichiStick', seat })
      mutableScores.value = mutableScores.value.map((s, i) =>
        i === seat ? s - 1000 : s,
      ) as unknown as Scores
      mutableKyotaku.value += 1
      mutableSeats[seat] = {
        ...afterDiscard,
        riichi: afterDiscard.discardCount === 1 ? 'double' : 'riichi',
        ippatsuActive: true,
      }
    } else if (afterDiscard.ippatsuActive) {
      mutableSeats[seat] = { ...afterDiscard, ippatsuActive: false }
    }
  }

  const tenpaiSeats = ([0, 1, 2, 3] as const).filter(
    (seat) =>
      shanten(
        countsFromTiles(
          (mutableSeats[seat] as SeatState).hand.map((t) => t.tile),
        ),
      ) === 0,
  )
  mutableEvents.push({ kind: 'exhaustiveDraw', tenpaiSeats })
  const deltas = notenDeltas(tenpaiSeats)
  const scoresAfter = addScores(mutableScores.value, deltas)
  mutableEvents.push({
    kind: 'payment',
    deltas,
    scoresAfter,
    kyotakuAfter: mutableKyotaku.value,
  })
  const dealerKept = tenpaiSeats.includes(config.dealer)
  mutableEvents.push({ kind: 'kyokuEnd', dealerKept })
  return [
    {
      events: mutableEvents,
      result: { type: 'draw', tenpaiSeats },
      scoresAfter,
      kyotakuAfter: mutableKyotaku.value,
      honbaAfter: config.honba + 1,
      dealerKept,
    },
    rngOut,
  ]
}
