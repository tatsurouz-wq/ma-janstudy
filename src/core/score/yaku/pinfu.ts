import type { YakuDefinition } from '../types'
import { isPairYakuhai } from './helpers'

export const pinfu: YakuDefinition = {
  id: 'pinfu',
  name: '平和',
  hanClosed: 1,
  hanOpen: null,
  isYakuman: false,
  detect: (ctx) => {
    if (ctx.handKind !== 'standard' || !ctx.isMenzen) {
      return null
    }
    if (ctx.win.winType === 'tsumo' && !ctx.rule.pinfuTsumo) {
      return null
    }
    const allShuntsu =
      ctx.sets.length === 4 &&
      ctx.sets.every((s) => s.kind === 'shuntsu' && !s.fromMeld)
    if (!allShuntsu || isPairYakuhai(ctx) || ctx.waitShape !== 'ryanmen') {
      return null
    }
    return '全て順子で雀頭が役牌でなく、両面待ちで和了した'
  },
}
