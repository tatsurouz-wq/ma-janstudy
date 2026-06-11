export type NumberRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type HonorRank = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type NumberSuit = 'm' | 'p' | 's'
export type Suit = NumberSuit | 'z'

export type NumberTile = `${NumberSuit}${NumberRank}`
export type HonorTile = `z${HonorRank}`
export type Tile = NumberTile | HonorTile

const SUITS: readonly NumberSuit[] = ['m', 'p', 's']
const NUMBER_RANKS: readonly NumberRank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const HONOR_RANKS: readonly HonorRank[] = [1, 2, 3, 4, 5, 6, 7]

export const ALL_TILES: readonly Tile[] = [
  ...SUITS.flatMap((s) => NUMBER_RANKS.map((r): Tile => `${s}${r}`)),
  ...HONOR_RANKS.map((r): Tile => `z${r}`),
]

const SUIT_OFFSET: Readonly<Record<Suit, number>> = { m: 0, p: 9, s: 18, z: 27 }

export const suitOf = (tile: Tile): Suit => tile[0] as Suit

const rankOf = (tile: Tile): number => Number(tile[1])

export const tileToIndex = (tile: Tile): number =>
  SUIT_OFFSET[suitOf(tile)] + rankOf(tile) - 1

export const indexToTile = (index: number): Tile => {
  const tile = ALL_TILES[index]
  if (tile === undefined) {
    throw new Error(`不正な牌インデックス: ${index}`)
  }
  return tile
}

export const isHonor = (tile: Tile): tile is HonorTile => suitOf(tile) === 'z'

export const isNumberTile = (tile: Tile): tile is NumberTile => !isHonor(tile)

export const numberRank = (tile: Tile): NumberRank | null =>
  isNumberTile(tile) ? (rankOf(tile) as NumberRank) : null

export const honorRank = (tile: Tile): HonorRank | null =>
  isHonor(tile) ? (rankOf(tile) as HonorRank) : null

export const isTerminal = (tile: Tile): boolean => {
  const rank = numberRank(tile)
  return rank === 1 || rank === 9
}

export const isYaochuu = (tile: Tile): boolean =>
  isHonor(tile) || isTerminal(tile)

export interface TileInstance {
  readonly id: string
  readonly tile: Tile
  readonly isRed: boolean
}
