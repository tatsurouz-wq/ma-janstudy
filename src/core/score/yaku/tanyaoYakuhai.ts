import type { Wind, YakuContext, YakuDefinition } from '../types'
import { isYaochuuIndex, kotsuIndices, windIndex } from './helpers'

export const tanyao: YakuDefinition = {
  id: 'tanyao',
  name: '断幺九',
  hanClosed: 1,
  hanOpen: 1,
  isYakuman: false,
  detect: (ctx) => {
    if (!ctx.isMenzen && !ctx.rule.kuitan) {
      return null
    }
    const onlyTanyao = ctx.allCounts.every(
      (count, index) => count === 0 || !isYaochuuIndex(index),
    )
    return onlyTanyao ? '1・9・字牌を1枚も使っていない' : null
  },
}

const sangenYakuhai = (
  id: string,
  name: string,
  index: number,
  label: string,
): YakuDefinition => ({
  id,
  name,
  hanClosed: 1,
  hanOpen: 1,
  isYakuman: false,
  detect: (ctx) =>
    kotsuIndices(ctx).includes(index)
      ? `三元牌の${label}を3枚そろえた`
      : null,
})

export const yakuhaiHaku = sangenYakuhai('yakuhai-haku', '役牌 白', 31, '白')
export const yakuhaiHatsu = sangenYakuhai('yakuhai-hatsu', '役牌 發', 32, '發')
export const yakuhaiChun = sangenYakuhai('yakuhai-chun', '役牌 中', 33, '中')

const WIND_LABELS: Readonly<Record<Wind, string>> = {
  1: '東',
  2: '南',
  3: '西',
  4: '北',
}

const hasWindKotsu = (ctx: YakuContext, wind: Wind): boolean =>
  kotsuIndices(ctx).includes(windIndex(wind))

export const yakuhaiSeat: YakuDefinition = {
  id: 'yakuhai-seat',
  name: '自風牌',
  hanClosed: 1,
  hanOpen: 1,
  isYakuman: false,
  detect: (ctx) =>
    hasWindKotsu(ctx, ctx.win.seatWind)
      ? `自分の風（${WIND_LABELS[ctx.win.seatWind]}）を3枚そろえた`
      : null,
}

export const yakuhaiRound: YakuDefinition = {
  id: 'yakuhai-round',
  name: '場風牌',
  hanClosed: 1,
  hanOpen: 1,
  isYakuman: false,
  detect: (ctx) =>
    hasWindKotsu(ctx, ctx.win.roundWind)
      ? `場の風（${WIND_LABELS[ctx.win.roundWind]}）を3枚そろえた`
      : null,
}
