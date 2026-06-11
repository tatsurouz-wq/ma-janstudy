import type { Tile } from '@/core/tiles/tile'
import { isNumberTile, numberRank, suitOf } from '@/core/tiles/tile'

const KANJI_NUMBERS: readonly string[] = [
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
]

const SUIT_NAMES: Readonly<Record<'m' | 'p' | 's', string>> = {
  m: '萬',
  p: '筒',
  s: '索',
}

const HONOR_NAMES: readonly string[] = ['東', '南', '西', '北', '白', '發', '中']

const HONOR_READINGS: readonly string[] = [
  'トン',
  'ナン',
  'シャー',
  'ペー',
  'ハク',
  'ハツ',
  'チュン',
]

const NUMBER_READINGS: readonly string[] = [
  'イー',
  'リャン',
  'サン',
  'スー',
  'ウー',
  'ロー',
  'チー',
  'パー',
  'キュー',
]

const SUIT_READINGS: Readonly<Record<'m' | 'p' | 's', string>> = {
  m: 'マン',
  p: 'ピン',
  s: 'ソー',
}

export const tileName = (tile: Tile, isRed = false): string => {
  const rank = numberRank(tile)
  if (rank !== null && isNumberTile(tile)) {
    const base = `${KANJI_NUMBERS[rank - 1]}${SUIT_NAMES[suitOf(tile) as 'm' | 'p' | 's']}`
    return isRed ? `赤${base}` : base
  }
  return HONOR_NAMES[Number(tile[1]) - 1] ?? tile
}

export const tileReading = (tile: Tile): string => {
  const rank = numberRank(tile)
  if (rank !== null && isNumberTile(tile)) {
    return `${NUMBER_READINGS[rank - 1]}${SUIT_READINGS[suitOf(tile) as 'm' | 'p' | 's']}`
  }
  return HONOR_READINGS[Number(tile[1]) - 1] ?? ''
}
