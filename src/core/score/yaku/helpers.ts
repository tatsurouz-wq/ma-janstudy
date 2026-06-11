import type { UnifiedSet, Wind, YakuContext } from '../types'

export const SANGEN_INDICES: readonly number[] = [31, 32, 33]
export const WIND_INDICES: readonly number[] = [27, 28, 29, 30]

export const windIndex = (wind: Wind): number => 26 + wind

export const isHonorIndex = (index: number): boolean => index >= 27

export const isTerminalIndex = (index: number): boolean =>
  index < 27 && (index % 9 === 0 || index % 9 === 8)

export const isYaochuuIndex = (index: number): boolean =>
  isHonorIndex(index) || isTerminalIndex(index)

export const isKotsuLike = (set: UnifiedSet): boolean =>
  set.kind !== 'shuntsu'

export const setHasYaochuu = (set: UnifiedSet): boolean =>
  set.kind === 'shuntsu'
    ? set.startIndex % 9 === 0 || set.startIndex % 9 === 6
    : isYaochuuIndex(set.startIndex)

export const kotsuIndices = (ctx: YakuContext): readonly number[] =>
  ctx.sets.filter((s) => isKotsuLike(s)).map((s) => s.startIndex)

export const shuntsuStarts = (ctx: YakuContext): readonly number[] =>
  ctx.sets.filter((s) => s.kind === 'shuntsu').map((s) => s.startIndex)

export const isPairYakuhai = (ctx: YakuContext): boolean => {
  if (ctx.pairIndex === null) {
    return false
  }
  return (
    SANGEN_INDICES.includes(ctx.pairIndex) ||
    ctx.pairIndex === windIndex(ctx.win.seatWind) ||
    ctx.pairIndex === windIndex(ctx.win.roundWind)
  )
}

export const usedNumberSuits = (ctx: YakuContext): number => {
  const mutableSuits = new Set<number>()
  ctx.allCounts.forEach((count, index) => {
    if (count > 0 && index < 27) {
      mutableSuits.add(Math.floor(index / 9))
    }
  })
  return mutableSuits.size
}

export const hasHonorTiles = (ctx: YakuContext): boolean =>
  ctx.allCounts.some((count, index) => count > 0 && isHonorIndex(index))

export const allTilesYaochuu = (ctx: YakuContext): boolean =>
  ctx.allCounts.every((count, index) => count === 0 || isYaochuuIndex(index))
