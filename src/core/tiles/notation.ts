import type { Suit, Tile } from './tile'

const SUIT_CHARS = new Set(['m', 'p', 's', 'z'])

export const parseTiles = (notation: string): readonly Tile[] => {
  const compact = notation.replaceAll(/\s+/g, '')
  const mutableResult: Tile[] = []
  const mutableDigits: number[] = []
  for (const char of compact) {
    if (/[0-9]/.test(char)) {
      mutableDigits.push(Number(char))
      continue
    }
    if (!SUIT_CHARS.has(char)) {
      throw new Error(`不正な文字です: ${char}`)
    }
    const suit = char as Suit
    if (mutableDigits.length === 0) {
      throw new Error(`スート${suit}の前に数字がありません`)
    }
    for (const digit of mutableDigits) {
      if (digit < 1 || (suit === 'z' && digit > 7) || digit > 9) {
        throw new Error(`不正なランクです: ${digit}${suit}`)
      }
      mutableResult.push(`${suit}${digit}` as Tile)
    }
    mutableDigits.length = 0
  }
  if (mutableDigits.length > 0) {
    throw new Error('スート指定のない数字が残っています')
  }
  return mutableResult
}
