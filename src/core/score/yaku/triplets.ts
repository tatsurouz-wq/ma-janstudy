import type { YakuDefinition } from '../types'
import { isKotsuLike } from './helpers'

export const toitoi: YakuDefinition = {
  id: 'toitoi',
  name: '対々和',
  hanClosed: 2,
  hanOpen: 2,
  isYakuman: false,
  detect: (ctx) =>
    ctx.handKind === 'standard' &&
    ctx.sets.length === 4 &&
    ctx.sets.every((s) => isKotsuLike(s))
      ? '4つの面子を全て刻子・槓子でそろえた'
      : null,
}

export const sanankou: YakuDefinition = {
  id: 'sanankou',
  name: '三暗刻',
  hanClosed: 2,
  hanOpen: 2,
  isYakuman: false,
  detect: (ctx) => {
    const concealedTriplets = ctx.sets.filter(
      (s) => isKotsuLike(s) && s.concealed && !s.completedByRon,
    ).length
    return concealedTriplets === 3 ? '暗刻を3つそろえた' : null
  },
}

export const sanshokuDoukou: YakuDefinition = {
  id: 'sanshoku-doukou',
  name: '三色同刻',
  hanClosed: 2,
  hanOpen: 2,
  isYakuman: false,
  detect: (ctx) => {
    const indices = new Set(
      ctx.sets.filter((s) => isKotsuLike(s)).map((s) => s.startIndex),
    )
    for (let r = 0; r <= 8; r += 1) {
      if (indices.has(r) && indices.has(r + 9) && indices.has(r + 18)) {
        return `萬子・筒子・索子で同じ${r + 1}の刻子をそろえた`
      }
    }
    return null
  },
}

export const sankantsu: YakuDefinition = {
  id: 'sankantsu',
  name: '三槓子',
  hanClosed: 2,
  hanOpen: 2,
  isYakuman: false,
  detect: (ctx) =>
    ctx.sets.filter((s) => s.kind === 'kantsu').length === 3
      ? 'カンを3回した'
      : null,
}
