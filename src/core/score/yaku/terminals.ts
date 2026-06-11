import type { YakuDefinition } from '../types'
import {
  allTilesYaochuu,
  hasHonorTiles,
  isTerminalIndex,
  isYaochuuIndex,
  setHasYaochuu,
} from './helpers'

export const chanta: YakuDefinition = {
  id: 'chanta',
  name: '混全帯幺九',
  hanClosed: 2,
  hanOpen: 1,
  isYakuman: false,
  detect: (ctx) => {
    if (ctx.handKind !== 'standard' || ctx.pairIndex === null) {
      return null
    }
    const everyBlockYaochuu =
      ctx.sets.every((s) => setHasYaochuu(s)) &&
      isYaochuuIndex(ctx.pairIndex)
    const hasShuntsu = ctx.sets.some((s) => s.kind === 'shuntsu')
    if (!everyBlockYaochuu || !hasShuntsu || !hasHonorTiles(ctx)) {
      return null
    }
    return '全ての面子と雀頭に1・9・字牌が含まれている'
  },
}

export const junchan: YakuDefinition = {
  id: 'junchan',
  name: '純全帯幺九',
  hanClosed: 3,
  hanOpen: 2,
  isYakuman: false,
  detect: (ctx) => {
    if (ctx.handKind !== 'standard' || ctx.pairIndex === null) {
      return null
    }
    const everyBlockYaochuu =
      ctx.sets.every((s) => setHasYaochuu(s)) &&
      isTerminalIndex(ctx.pairIndex)
    const hasShuntsu = ctx.sets.some((s) => s.kind === 'shuntsu')
    if (!everyBlockYaochuu || !hasShuntsu || hasHonorTiles(ctx)) {
      return null
    }
    return '全ての面子と雀頭に1・9牌が含まれている（字牌なし）'
  },
}

export const honroutou: YakuDefinition = {
  id: 'honroutou',
  name: '混老頭',
  hanClosed: 2,
  hanOpen: 2,
  isYakuman: false,
  detect: (ctx) => {
    const hasTerminal = ctx.allCounts.some(
      (count, index) => count > 0 && isTerminalIndex(index),
    )
    return allTilesYaochuu(ctx) && hasHonorTiles(ctx) && hasTerminal
      ? '1・9・字牌だけで手を作った'
      : null
  },
}
