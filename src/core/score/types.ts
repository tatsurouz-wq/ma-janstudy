import type { Tile } from '../tiles/tile'
import type { TileCounts } from '../tiles/tileCounts'
import type { Decomposition } from '../hand/decompose'
import type { WaitShape } from '../hand/waits'
import type { RuleConfig } from '../rules/ruleset'

export type MeldType = 'chi' | 'pon' | 'minkan' | 'ankan'

export interface Meld {
  readonly type: MeldType
  readonly tiles: readonly Tile[]
}

export type Wind = 1 | 2 | 3 | 4

export type WinType = 'tsumo' | 'ron'

export interface WinContext {
  readonly winType: WinType
  readonly riichi: 'none' | 'riichi' | 'double'
  readonly ippatsu: boolean
  readonly haitei: boolean
  readonly houtei: boolean
  readonly rinshan: boolean
  readonly chankan: boolean
  readonly tenhou: boolean
  readonly chiihou: boolean
  readonly seatWind: Wind
  readonly roundWind: Wind
}

export type UnifiedSetKind = 'shuntsu' | 'kotsu' | 'kantsu'

export interface UnifiedSet {
  readonly kind: UnifiedSetKind
  readonly startIndex: number
  readonly concealed: boolean
  readonly fromMeld: boolean
  readonly completedByRon: boolean
}

export type HandKind = 'standard' | 'chiitoi' | 'kokushi'

export interface YakuContext {
  readonly handKind: HandKind
  readonly decomposition: Decomposition | null
  readonly sets: readonly UnifiedSet[]
  readonly pairIndex: number | null
  readonly allCounts: TileCounts
  readonly concealedCounts: TileCounts
  readonly winIndex: number
  readonly waitShape: WaitShape | null
  readonly isMenzen: boolean
  readonly win: WinContext
  readonly rule: RuleConfig
}

export interface YakuDefinition {
  readonly id: string
  readonly name: string
  readonly hanClosed: number
  readonly hanOpen: number | null
  readonly isYakuman: boolean
  readonly detect: (ctx: YakuContext) => string | null
  readonly isDoubleYakuman?: (ctx: YakuContext) => boolean
}

export interface YakuHit {
  readonly id: string
  readonly name: string
  readonly han: number
  readonly isYakuman: boolean
  readonly isDouble: boolean
  readonly reason: string
}

export interface FuItem {
  readonly fu: number
  readonly label: string
  readonly description: string
}

export interface FuResult {
  readonly items: readonly FuItem[]
  readonly rawTotal: number
  readonly rounded: number
  readonly isFixed: boolean
}

export type LimitName =
  | 'none'
  | 'mangan'
  | 'haneman'
  | 'baiman'
  | 'sanbaiman'
  | 'yakuman'

export type Payments =
  | {
      readonly type: 'ron'
      readonly fromDiscarder: number
      readonly total: number
    }
  | {
      readonly type: 'tsumo-dealer'
      readonly fromEach: number
      readonly total: number
    }
  | {
      readonly type: 'tsumo-nondealer'
      readonly fromDealer: number
      readonly fromOthers: number
      readonly total: number
    }

export interface PointsResult {
  readonly base: number
  readonly formula: string
  readonly limit: LimitName
  readonly payments: Payments
}

export type CalculationStep =
  | { readonly kind: 'parse'; readonly text: string }
  | { readonly kind: 'yaku'; readonly text: string; readonly yakuId: string }
  | { readonly kind: 'dora'; readonly text: string }
  | { readonly kind: 'fuItem'; readonly text: string; readonly itemIndex: number }
  | { readonly kind: 'fuRound'; readonly text: string }
  | { readonly kind: 'base'; readonly text: string }
  | { readonly kind: 'limit'; readonly text: string }
  | { readonly kind: 'payment'; readonly text: string }

export interface DoraCount {
  readonly omote: number
  readonly ura: number
  readonly aka: number
}

export interface ScoreResult {
  readonly handKind: HandKind
  readonly decomposition: Decomposition | null
  readonly sets: readonly UnifiedSet[]
  readonly pairIndex: number | null
  readonly waitShape: WaitShape | null
  readonly yaku: readonly YakuHit[]
  readonly dora: DoraCount
  readonly totalHan: number
  readonly isYakuman: boolean
  readonly yakumanUnits: number
  readonly fu: FuResult | null
  readonly points: PointsResult
  readonly steps: readonly CalculationStep[]
}

export type ScoreErrorReason = 'invalid-hand' | 'not-winning' | 'no-yaku'

export type ScoreOutcome =
  | {
      readonly ok: true
      readonly result: ScoreResult
      readonly alternatives: readonly ScoreResult[]
    }
  | { readonly ok: false; readonly reason: ScoreErrorReason }

export interface ScoreInput {
  readonly concealed: readonly Tile[]
  readonly melds: readonly Meld[]
  readonly winTile: Tile
  readonly win: WinContext
  readonly doraIndicators: readonly Tile[]
  readonly uraIndicators: readonly Tile[]
  readonly redFives: number
  readonly honba: number
  readonly kyotaku: number
  readonly rule: RuleConfig
}
