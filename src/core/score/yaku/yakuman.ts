import type { YakuDefinition } from '../types'
import {
  isHonorIndex,
  isKotsuLike,
  isTerminalIndex,
  SANGEN_INDICES,
  WIND_INDICES,
} from './helpers'

export const kokushi: YakuDefinition = {
  id: 'kokushi',
  name: '国士無双',
  hanClosed: 13,
  hanOpen: null,
  isYakuman: true,
  detect: (ctx) =>
    ctx.handKind === 'kokushi' ? '幺九牌13種を全てそろえた' : null,
  isDoubleYakuman: (ctx) => (ctx.concealedCounts[ctx.winIndex] ?? 0) === 2,
}

export const suuankou: YakuDefinition = {
  id: 'suuankou',
  name: '四暗刻',
  hanClosed: 13,
  hanOpen: null,
  isYakuman: true,
  detect: (ctx) =>
    ctx.handKind === 'standard' &&
    ctx.isMenzen &&
    ctx.sets.length === 4 &&
    ctx.sets.every(
      (s) => isKotsuLike(s) && s.concealed && !s.completedByRon,
    )
      ? '暗刻を4つそろえた'
      : null,
  isDoubleYakuman: (ctx) => ctx.waitShape === 'tanki',
}

export const daisangen: YakuDefinition = {
  id: 'daisangen',
  name: '大三元',
  hanClosed: 13,
  hanOpen: 13,
  isYakuman: true,
  detect: (ctx) => {
    const sangenKotsu = ctx.sets.filter(
      (s) => isKotsuLike(s) && SANGEN_INDICES.includes(s.startIndex),
    ).length
    return sangenKotsu === 3 ? '白・發・中を全て刻子でそろえた' : null
  },
}

export const shousuushi: YakuDefinition = {
  id: 'shousuushi',
  name: '小四喜',
  hanClosed: 13,
  hanOpen: 13,
  isYakuman: true,
  detect: (ctx) => {
    const windKotsu = ctx.sets.filter(
      (s) => isKotsuLike(s) && WIND_INDICES.includes(s.startIndex),
    ).length
    const pairIsWind =
      ctx.pairIndex !== null && WIND_INDICES.includes(ctx.pairIndex)
    return windKotsu === 3 && pairIsWind
      ? '風牌3種を刻子、1種を雀頭にした'
      : null
  },
}

export const daisuushi: YakuDefinition = {
  id: 'daisuushi',
  name: '大四喜',
  hanClosed: 13,
  hanOpen: 13,
  isYakuman: true,
  detect: (ctx) => {
    const windKotsu = ctx.sets.filter(
      (s) => isKotsuLike(s) && WIND_INDICES.includes(s.startIndex),
    ).length
    return windKotsu === 4 ? '東南西北を全て刻子でそろえた' : null
  },
  isDoubleYakuman: () => true,
}

export const tsuuiisou: YakuDefinition = {
  id: 'tsuuiisou',
  name: '字一色',
  hanClosed: 13,
  hanOpen: 13,
  isYakuman: true,
  detect: (ctx) =>
    ctx.allCounts.every((count, index) => count === 0 || isHonorIndex(index))
      ? '字牌だけで手を作った'
      : null,
}

export const chinroutou: YakuDefinition = {
  id: 'chinroutou',
  name: '清老頭',
  hanClosed: 13,
  hanOpen: 13,
  isYakuman: true,
  detect: (ctx) =>
    ctx.allCounts.every(
      (count, index) => count === 0 || isTerminalIndex(index),
    )
      ? '1・9牌だけで手を作った'
      : null,
}

const RYUUIISOU_INDICES: ReadonlySet<number> = new Set([
  19, 20, 21, 23, 25, 32,
])

export const ryuuiisou: YakuDefinition = {
  id: 'ryuuiisou',
  name: '緑一色',
  hanClosed: 13,
  hanOpen: 13,
  isYakuman: true,
  detect: (ctx) =>
    ctx.allCounts.every(
      (count, index) => count === 0 || RYUUIISOU_INDICES.has(index),
    )
      ? '緑色の牌（索子の23468と發）だけで手を作った'
      : null,
}

const CHUUREN_PATTERN: readonly number[] = [3, 1, 1, 1, 1, 1, 1, 1, 3]

export const chuuren: YakuDefinition = {
  id: 'chuuren',
  name: '九蓮宝燈',
  hanClosed: 13,
  hanOpen: null,
  isYakuman: true,
  detect: (ctx) => {
    if (ctx.handKind !== 'standard' || !ctx.isMenzen || ctx.sets.some((s) => s.fromMeld)) {
      return null
    }
    for (const offset of [0, 9, 18]) {
      const suitCounts = Array.from(
        { length: 9 },
        (_, r) => ctx.allCounts[offset + r] ?? 0,
      )
      const totalInSuit = suitCounts.reduce((a, b) => a + b, 0)
      if (totalInSuit !== 14) {
        continue
      }
      const matches = suitCounts.every(
        (c, r) => c >= (CHUUREN_PATTERN[r] ?? 0),
      )
      if (matches) {
        return '同色で1112345678999+1枚をそろえた'
      }
    }
    return null
  },
  isDoubleYakuman: (ctx) => {
    for (const offset of [0, 9, 18]) {
      const beforeWin = Array.from({ length: 9 }, (_, r) => {
        const index = offset + r
        const count = ctx.allCounts[index] ?? 0
        return index === ctx.winIndex ? count - 1 : count
      })
      if (
        beforeWin.reduce((a, b) => a + b, 0) === 13 &&
        beforeWin.every((c, r) => c === (CHUUREN_PATTERN[r] ?? 0))
      ) {
        return true
      }
    }
    return false
  },
}

export const suukantsu: YakuDefinition = {
  id: 'suukantsu',
  name: '四槓子',
  hanClosed: 13,
  hanOpen: 13,
  isYakuman: true,
  detect: (ctx) =>
    ctx.sets.filter((s) => s.kind === 'kantsu').length === 4
      ? 'カンを4回した'
      : null,
}

export const tenhou: YakuDefinition = {
  id: 'tenhou',
  name: '天和',
  hanClosed: 13,
  hanOpen: null,
  isYakuman: true,
  detect: (ctx) =>
    ctx.win.tenhou &&
    ctx.win.winType === 'tsumo' &&
    ctx.win.seatWind === 1 &&
    ctx.isMenzen
      ? '親が配牌の14枚で和了していた'
      : null,
}

export const chiihou: YakuDefinition = {
  id: 'chiihou',
  name: '地和',
  hanClosed: 13,
  hanOpen: null,
  isYakuman: true,
  detect: (ctx) =>
    ctx.win.chiihou &&
    ctx.win.winType === 'tsumo' &&
    ctx.win.seatWind !== 1 &&
    ctx.isMenzen
      ? '子が最初のツモで和了した'
      : null,
}
