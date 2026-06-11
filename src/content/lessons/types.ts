import type { Tile } from '@/core/tiles/tile'

export interface TextStep {
  readonly kind: 'text'
  readonly title: string
  readonly body: string
  readonly tiles?: string
}

export interface SortToZonesStep {
  readonly kind: 'sort-to-zones'
  readonly prompt: string
  readonly zones: readonly { readonly id: string; readonly label: string }[]
  readonly assignments: readonly {
    readonly tile: Tile
    readonly zone: string
  }[]
}

export interface SelectFromPaletteStep {
  readonly kind: 'select-from-palette'
  readonly prompt: string
  readonly hand?: string
  readonly palette: string | 'all'
  readonly correct: readonly Tile[] | 'waits-of-hand'
  readonly explanation: string
}

export interface GroupBuildStep {
  readonly kind: 'group-build'
  readonly prompt: string
  readonly tiles: string
  readonly explanation: string
}

export interface OrderSequenceStep {
  readonly kind: 'order-sequence'
  readonly prompt: string
  readonly items: readonly { readonly id: string; readonly label: string }[]
  readonly correctOrder: readonly string[]
  readonly explanation: string
}

export interface ChoiceQuizStep {
  readonly kind: 'quiz'
  readonly prompt: string
  readonly tiles?: string
  readonly choices: readonly string[]
  readonly correctIndex: number
  readonly explanation: string
}

export interface CompareVariant {
  readonly label: string
  readonly hand: string
  readonly winTile: Tile
  readonly winType: 'tsumo' | 'ron'
  readonly open?: boolean
}

export interface CompareStep {
  readonly kind: 'compare'
  readonly prompt: string
  readonly variants: readonly CompareVariant[]
  readonly explanation: string
}

export type LessonStep =
  | TextStep
  | SortToZonesStep
  | SelectFromPaletteStep
  | GroupBuildStep
  | OrderSequenceStep
  | ChoiceQuizStep
  | CompareStep

export interface Lesson {
  readonly id: string
  readonly number: number
  readonly title: string
  readonly goal: string
  readonly steps: readonly LessonStep[]
}
