import type { YakuDefinition } from '../types'
import { isKotsuLike, SANGEN_INDICES } from './helpers'

export const shousangen: YakuDefinition = {
  id: 'shousangen',
  name: '小三元',
  hanClosed: 2,
  hanOpen: 2,
  isYakuman: false,
  detect: (ctx) => {
    const sangenKotsu = ctx.sets.filter(
      (s) => isKotsuLike(s) && SANGEN_INDICES.includes(s.startIndex),
    ).length
    const pairIsSangen =
      ctx.pairIndex !== null && SANGEN_INDICES.includes(ctx.pairIndex)
    return sangenKotsu === 2 && pairIsSangen
      ? '三元牌2種を刻子、1種を雀頭にした'
      : null
  },
}
