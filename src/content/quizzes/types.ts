import type { Tile } from '@/core/tiles/tile'
import type { Meld, Wind } from '@/core/score/types'

export type QuizCategory = 'wait' | 'yaku' | 'score'

export type QuizLevel = 1 | 2 | 3 | 4

export interface QuizContext {
  readonly winType: 'tsumo' | 'ron'
  readonly riichi?: boolean
  readonly ippatsu?: boolean
  readonly seatWind: Wind
  readonly roundWind: Wind
  readonly doraIndicators?: readonly Tile[]
  readonly uraIndicators?: readonly Tile[]
  readonly redFives?: number
  readonly honba?: number
}

export interface WaitQuestion {
  readonly id: string
  readonly level: QuizLevel
  readonly hand: string
  readonly hint: string
}

export interface YakuQuestion {
  readonly id: string
  readonly level: QuizLevel
  readonly hand: string
  readonly winTile: Tile
  readonly melds?: readonly Meld[]
  readonly context: QuizContext
  readonly choices: readonly string[]
  readonly hint: string
}

export interface ScoreQuestion {
  readonly id: string
  readonly level: QuizLevel
  readonly hand: string
  readonly winTile: Tile
  readonly melds?: readonly Meld[]
  readonly context: QuizContext
  readonly distractors: readonly string[]
  readonly hint: string
}
