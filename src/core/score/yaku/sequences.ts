import type { YakuDefinition } from '../types'
import { shuntsuStarts } from './helpers'

export const sanshokuDoujun: YakuDefinition = {
  id: 'sanshoku-doujun',
  name: '三色同順',
  hanClosed: 2,
  hanOpen: 1,
  isYakuman: false,
  detect: (ctx) => {
    const starts = new Set(shuntsuStarts(ctx))
    for (let r = 0; r <= 6; r += 1) {
      if (starts.has(r) && starts.has(r + 9) && starts.has(r + 18)) {
        return `萬子・筒子・索子で同じ${r + 1}${r + 2}${r + 3}の順子をそろえた`
      }
    }
    return null
  },
}

export const ittsu: YakuDefinition = {
  id: 'ittsu',
  name: '一気通貫',
  hanClosed: 2,
  hanOpen: 1,
  isYakuman: false,
  detect: (ctx) => {
    const starts = new Set(shuntsuStarts(ctx))
    for (const offset of [0, 9, 18]) {
      if (
        starts.has(offset) &&
        starts.has(offset + 3) &&
        starts.has(offset + 6)
      ) {
        return '同じ色で123・456・789の順子をそろえた'
      }
    }
    return null
  },
}
