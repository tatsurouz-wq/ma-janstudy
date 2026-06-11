import type { YakuDefinition } from '../types'

export const haitei: YakuDefinition = {
  id: 'haitei',
  name: '海底摸月',
  hanClosed: 1,
  hanOpen: 1,
  isYakuman: false,
  detect: (ctx) =>
    ctx.win.winType === 'tsumo' && ctx.win.haitei
      ? '牌山の最後の牌でツモ和了した'
      : null,
}

export const houtei: YakuDefinition = {
  id: 'houtei',
  name: '河底撈魚',
  hanClosed: 1,
  hanOpen: 1,
  isYakuman: false,
  detect: (ctx) =>
    ctx.win.winType === 'ron' && ctx.win.houtei
      ? 'その局の最後の捨て牌でロン和了した'
      : null,
}

export const rinshan: YakuDefinition = {
  id: 'rinshan',
  name: '嶺上開花',
  hanClosed: 1,
  hanOpen: 1,
  isYakuman: false,
  detect: (ctx) =>
    ctx.win.winType === 'tsumo' && ctx.win.rinshan
      ? 'カンの後の嶺上牌でツモ和了した'
      : null,
}

export const chankan: YakuDefinition = {
  id: 'chankan',
  name: '搶槓',
  hanClosed: 1,
  hanOpen: 1,
  isYakuman: false,
  detect: (ctx) =>
    ctx.win.winType === 'ron' && ctx.win.chankan
      ? '他家の加カンの牌でロン和了した'
      : null,
}
