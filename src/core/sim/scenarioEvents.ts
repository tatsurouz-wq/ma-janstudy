import type { TileInstance } from '../tiles/tile'
import { tileToIndex } from '../tiles/tile'
import type { ScoreResult, Wind, WinType } from '../score/types'
import type { SeatId } from './seatTypes'

export type Scores = readonly [number, number, number, number]

export interface KyokuSummary {
  readonly round: Wind
  readonly kyoku: number
  readonly honba: number
  readonly dealer: SeatId
  readonly headline: string
  readonly scoresAfter: Scores
  readonly kyotakuAfter: number
}

export interface RankEntry {
  readonly seat: SeatId
  readonly score: number
  readonly rank: number
}

export interface RiverTile {
  readonly tile: TileInstance
  readonly riichiTilt: boolean
}

export interface SnapshotBoard {
  readonly hands: readonly (readonly TileInstance[])[]
  readonly rivers: readonly (readonly RiverTile[])[]
  readonly liveWall: readonly TileInstance[]
  readonly deadWall: readonly TileInstance[]
  readonly doraIndicator: TileInstance
  readonly riichiDeclared: readonly [boolean, boolean, boolean, boolean]
  readonly scores: Scores
  readonly kyotaku: number
  readonly honba: number
  readonly turnSeat: SeatId
}

export type ScenarioEvent =
  | { readonly kind: 'machineStart' }
  | {
      readonly kind: 'kyokuStart'
      readonly round: Wind
      readonly kyoku: number
      readonly honba: number
      readonly kyotaku: number
      readonly dealer: SeatId
      readonly scores: Scores
      readonly digest: 'full' | 'highlight'
    }
  | { readonly kind: 'shuffle' }
  | { readonly kind: 'wallRise'; readonly tiles: readonly TileInstance[] }
  | { readonly kind: 'dice'; readonly values: readonly [number, number] }
  | {
      readonly kind: 'dealBlock'
      readonly seat: SeatId
      readonly tiles: readonly TileInstance[]
      readonly blockIndex: number
    }
  | { readonly kind: 'dealDora'; readonly doraIndicator: TileInstance }
  | {
      readonly kind: 'dealSort'
      readonly hands: readonly (readonly TileInstance[])[]
    }
  | { readonly kind: 'boardSnapshot'; readonly board: SnapshotBoard }
  | { readonly kind: 'draw'; readonly seat: SeatId; readonly tile: TileInstance }
  | {
      readonly kind: 'discard'
      readonly seat: SeatId
      readonly tile: TileInstance
      readonly riichiDeclaration: boolean
      readonly tsumogiri: boolean
    }
  | { readonly kind: 'riichiStick'; readonly seat: SeatId }
  | {
      readonly kind: 'win'
      readonly seat: SeatId
      readonly winType: WinType
      readonly fromSeat: SeatId | null
      readonly winTile: TileInstance
      readonly result: ScoreResult
      readonly uraIndicators: readonly TileInstance[]
    }
  | {
      readonly kind: 'exhaustiveDraw'
      readonly tenpaiSeats: readonly SeatId[]
    }
  | {
      readonly kind: 'payment'
      readonly deltas: Scores
      readonly scoresAfter: Scores
      readonly kyotakuAfter: number
    }
  | { readonly kind: 'kyokuEnd'; readonly dealerKept: boolean }
  | { readonly kind: 'digestSkip'; readonly summary: KyokuSummary }
  | { readonly kind: 'gameEnd'; readonly ranking: readonly RankEntry[] }

export type TileZone =
  | { readonly kind: 'wall'; readonly drawIndex: number }
  | { readonly kind: 'deadWall'; readonly index: number; readonly faceUp: boolean }
  | {
      readonly kind: 'hand'
      readonly seat: SeatId
      readonly index: number
      readonly drawn: boolean
    }
  | {
      readonly kind: 'handStaging'
      readonly seat: SeatId
      readonly index: number
    }
  | {
      readonly kind: 'river'
      readonly seat: SeatId
      readonly index: number
      readonly riichiTilt: boolean
    }
  | { readonly kind: 'winReveal'; readonly seat: SeatId; readonly index: number }

export interface PlacedTile {
  readonly tile: TileInstance
  readonly zone: TileZone
}

export interface BoardState {
  readonly tiles: ReadonlyMap<string, PlacedTile>
  readonly scores: Scores
  readonly kyotaku: number
  readonly honba: number
  readonly riichiDeclared: readonly [boolean, boolean, boolean, boolean]
  readonly display: {
    readonly round: Wind
    readonly kyoku: number
    readonly dice: readonly [number, number] | null
  }
  readonly turnSeat: SeatId | null
}

export const INITIAL_BOARD: BoardState = {
  tiles: new Map(),
  scores: [25000, 25000, 25000, 25000],
  kyotaku: 0,
  honba: 0,
  riichiDeclared: [false, false, false, false],
  display: { round: 1, kyoku: 1, dice: null },
  turnSeat: null,
}

export const LIVE_WALL_SIZE = 122
export const DEAD_WALL_SIZE = 14
export const DORA_INDICATOR_DEAD_INDEX = 4
export const URA_INDICATOR_DEAD_INDEX = 5

const handTilesOf = (
  tiles: ReadonlyMap<string, PlacedTile>,
  seat: SeatId,
): readonly PlacedTile[] =>
  [...tiles.values()].filter(
    (p) => p.zone.kind === 'hand' && p.zone.seat === seat,
  )

const withResortedHand = (
  tiles: ReadonlyMap<string, PlacedTile>,
  seat: SeatId,
): ReadonlyMap<string, PlacedTile> => {
  const handTiles = handTilesOf(tiles, seat)
  const sorted = [...handTiles].sort(
    (a, b) =>
      tileToIndex(a.tile.tile) - tileToIndex(b.tile.tile) ||
      a.tile.id.localeCompare(b.tile.id),
  )
  const mutableNext = new Map(tiles)
  sorted.forEach((placed, index) => {
    const drawn = placed.zone.kind === 'hand' && placed.zone.drawn
    mutableNext.set(placed.tile.id, {
      tile: placed.tile,
      zone: { kind: 'hand', seat, index, drawn },
    })
  })
  return mutableNext
}

const riverCountOf = (
  tiles: ReadonlyMap<string, PlacedTile>,
  seat: SeatId,
): number =>
  [...tiles.values()].filter(
    (p) => p.zone.kind === 'river' && p.zone.seat === seat,
  ).length

const buildSnapshotTiles = (
  board: SnapshotBoard,
): ReadonlyMap<string, PlacedTile> => {
  const mutableTiles = new Map<string, PlacedTile>()
  board.hands.forEach((hand, seatIndex) => {
    const seat = seatIndex as SeatId
    const sorted = [...hand].sort(
      (a, b) => tileToIndex(a.tile) - tileToIndex(b.tile) || a.id.localeCompare(b.id),
    )
    sorted.forEach((tile, index) => {
      mutableTiles.set(tile.id, {
        tile,
        zone: { kind: 'hand', seat, index, drawn: false },
      })
    })
  })
  board.rivers.forEach((river, seatIndex) => {
    const seat = seatIndex as SeatId
    river.forEach((entry, index) => {
      mutableTiles.set(entry.tile.id, {
        tile: entry.tile,
        zone: { kind: 'river', seat, index, riichiTilt: entry.riichiTilt },
      })
    })
  })
  const consumed = LIVE_WALL_SIZE - board.liveWall.length
  board.liveWall.forEach((tile, j) => {
    mutableTiles.set(tile.id, {
      tile,
      zone: { kind: 'wall', drawIndex: consumed + j },
    })
  })
  board.deadWall.forEach((tile, index) => {
    const faceUp = tile.id === board.doraIndicator.id
    mutableTiles.set(tile.id, {
      tile,
      zone: { kind: 'deadWall', index, faceUp },
    })
  })
  return mutableTiles
}

export const applyEvent = (
  board: BoardState,
  event: ScenarioEvent,
): BoardState => {
  switch (event.kind) {
    case 'machineStart':
    case 'shuffle':
    case 'exhaustiveDraw':
    case 'kyokuEnd':
    case 'gameEnd':
      return board
    case 'kyokuStart':
      return {
        ...board,
        tiles: new Map(),
        scores: event.scores,
        kyotaku: event.kyotaku,
        honba: event.honba,
        riichiDeclared: [false, false, false, false],
        display: { round: event.round, kyoku: event.kyoku, dice: null },
        turnSeat: null,
      }
    case 'wallRise': {
      const mutableTiles = new Map<string, PlacedTile>()
      event.tiles.forEach((tile, i) => {
        const zone: TileZone =
          i < LIVE_WALL_SIZE
            ? { kind: 'wall', drawIndex: i }
            : { kind: 'deadWall', index: i - LIVE_WALL_SIZE, faceUp: false }
        mutableTiles.set(tile.id, { tile, zone })
      })
      return { ...board, tiles: mutableTiles }
    }
    case 'dice':
      return {
        ...board,
        display: { ...board.display, dice: event.values },
      }
    case 'dealBlock': {
      const stagingCount = [...board.tiles.values()].filter(
        (p) => p.zone.kind === 'handStaging' && p.zone.seat === event.seat,
      ).length
      const mutableTiles = new Map(board.tiles)
      event.tiles.forEach((tile, i) => {
        mutableTiles.set(tile.id, {
          tile,
          zone: {
            kind: 'handStaging',
            seat: event.seat,
            index: stagingCount + i,
          },
        })
      })
      return { ...board, tiles: mutableTiles }
    }
    case 'dealDora': {
      const mutableTiles = new Map(board.tiles)
      const indicator = mutableTiles.get(event.doraIndicator.id)
      if (indicator !== undefined && indicator.zone.kind === 'deadWall') {
        mutableTiles.set(event.doraIndicator.id, {
          tile: indicator.tile,
          zone: { ...indicator.zone, faceUp: true },
        })
      }
      return { ...board, tiles: mutableTiles }
    }
    case 'dealSort': {
      const mutableTiles = new Map(board.tiles)
      event.hands.forEach((hand, seatIndex) => {
        hand.forEach((tile) => {
          mutableTiles.set(tile.id, {
            tile,
            zone: {
              kind: 'hand',
              seat: seatIndex as SeatId,
              index: 0,
              drawn: false,
            },
          })
        })
      })
      const resorted = [0, 1, 2, 3].reduce<ReadonlyMap<string, PlacedTile>>(
        (tiles, seat) => withResortedHand(tiles, seat as SeatId),
        mutableTiles,
      )
      return { ...board, tiles: resorted }
    }
    case 'boardSnapshot':
      return {
        ...board,
        tiles: buildSnapshotTiles(event.board),
        scores: event.board.scores,
        kyotaku: event.board.kyotaku,
        honba: event.board.honba,
        riichiDeclared: event.board.riichiDeclared,
        turnSeat: event.board.turnSeat,
      }
    case 'draw': {
      const handCount = handTilesOf(board.tiles, event.seat).length
      const mutableTiles = new Map(board.tiles)
      mutableTiles.set(event.tile.id, {
        tile: event.tile,
        zone: { kind: 'hand', seat: event.seat, index: handCount, drawn: true },
      })
      return { ...board, tiles: mutableTiles, turnSeat: event.seat }
    }
    case 'discard': {
      const riverIndex = riverCountOf(board.tiles, event.seat)
      const mutableTiles = new Map(board.tiles)
      mutableTiles.set(event.tile.id, {
        tile: event.tile,
        zone: {
          kind: 'river',
          seat: event.seat,
          index: riverIndex,
          riichiTilt: event.riichiDeclaration,
        },
      })
      for (const placed of handTilesOf(mutableTiles, event.seat)) {
        if (placed.zone.kind === 'hand' && placed.zone.drawn) {
          mutableTiles.set(placed.tile.id, {
            tile: placed.tile,
            zone: { ...placed.zone, drawn: false },
          })
        }
      }
      const resorted = withResortedHand(mutableTiles, event.seat)
      const riichiDeclared = event.riichiDeclaration
        ? (board.riichiDeclared.map((r, i) =>
            i === event.seat ? true : r,
          ) as unknown as readonly [boolean, boolean, boolean, boolean])
        : board.riichiDeclared
      return { ...board, tiles: resorted, riichiDeclared }
    }
    case 'riichiStick': {
      const scores = board.scores.map((s, i) =>
        i === event.seat ? s - 1000 : s,
      ) as unknown as Scores
      return { ...board, scores, kyotaku: board.kyotaku + 1 }
    }
    case 'win': {
      const mutableTiles = new Map(board.tiles)
      const winnerTiles = [
        ...handTilesOf(board.tiles, event.seat).map((p) => p.tile),
      ]
      const revealTiles = [...winnerTiles, event.winTile]
        .filter(
          (tile, i, arr) => arr.findIndex((t) => t.id === tile.id) === i,
        )
        .sort(
          (a, b) =>
            tileToIndex(a.tile) - tileToIndex(b.tile) ||
            a.id.localeCompare(b.id),
        )
      revealTiles.forEach((tile, index) => {
        mutableTiles.set(tile.id, {
          tile,
          zone: { kind: 'winReveal', seat: event.seat, index },
        })
      })
      for (const ura of event.uraIndicators) {
        const placed = mutableTiles.get(ura.id)
        if (placed !== undefined && placed.zone.kind === 'deadWall') {
          mutableTiles.set(ura.id, {
            tile: placed.tile,
            zone: { ...placed.zone, faceUp: true },
          })
        }
      }
      return { ...board, tiles: mutableTiles }
    }
    case 'payment':
      return {
        ...board,
        scores: event.scoresAfter,
        kyotaku: event.kyotakuAfter,
      }
    case 'digestSkip':
      return {
        ...board,
        tiles: new Map(),
        scores: event.summary.scoresAfter,
        kyotaku: event.summary.kyotakuAfter,
        honba: event.summary.honba,
        riichiDeclared: [false, false, false, false],
        display: {
          round: event.summary.round,
          kyoku: event.summary.kyoku,
          dice: null,
        },
        turnSeat: null,
      }
  }
}

export const boardAt = (
  events: readonly ScenarioEvent[],
  uptoIndex: number,
): BoardState =>
  events.slice(0, uptoIndex).reduce(applyEvent, INITIAL_BOARD)

// 各席のリーチ宣言牌（横向き）の河インデックス。未宣言は null。
export const riichiRiverIndexOf = (
  board: BoardState,
): readonly (number | null)[] => {
  const mutableIndex: (number | null)[] = [null, null, null, null]
  for (const placed of board.tiles.values()) {
    if (placed.zone.kind === 'river' && placed.zone.riichiTilt) {
      const seat = placed.zone.seat
      const current = mutableIndex[seat]
      if (current === null || current === undefined || placed.zone.index < current) {
        mutableIndex[seat] = placed.zone.index
      }
    }
  }
  return mutableIndex
}
