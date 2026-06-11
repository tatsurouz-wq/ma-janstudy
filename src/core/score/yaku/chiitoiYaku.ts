import type { YakuDefinition } from '../types'

export const chiitoi: YakuDefinition = {
  id: 'chiitoi',
  name: '七対子',
  hanClosed: 2,
  hanOpen: null,
  isYakuman: false,
  detect: (ctx) =>
    ctx.handKind === 'chiitoi' ? '7種類の対子で手を作った' : null,
}
