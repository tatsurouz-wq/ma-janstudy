import type { YakuDefinition } from '../types'

export const riichi: YakuDefinition = {
  id: 'riichi',
  name: '立直',
  hanClosed: 1,
  hanOpen: null,
  isYakuman: false,
  detect: (ctx) =>
    ctx.win.riichi === 'riichi' && ctx.isMenzen
      ? 'テンパイを宣言して和了した'
      : null,
}

export const doubleRiichi: YakuDefinition = {
  id: 'double-riichi',
  name: 'ダブル立直',
  hanClosed: 2,
  hanOpen: null,
  isYakuman: false,
  detect: (ctx) =>
    ctx.win.riichi === 'double' && ctx.isMenzen
      ? '配牌後の第一打でリーチを宣言した'
      : null,
}

export const ippatsu: YakuDefinition = {
  id: 'ippatsu',
  name: '一発',
  hanClosed: 1,
  hanOpen: null,
  isYakuman: false,
  detect: (ctx) =>
    ctx.win.ippatsu && ctx.win.riichi !== 'none' && ctx.isMenzen
      ? 'リーチ後1巡以内に和了した'
      : null,
}

export const menzenTsumo: YakuDefinition = {
  id: 'menzen-tsumo',
  name: '門前清自摸和',
  hanClosed: 1,
  hanOpen: null,
  isYakuman: false,
  detect: (ctx) =>
    ctx.win.winType === 'tsumo' && ctx.isMenzen
      ? '鳴かずに自分でツモって和了した'
      : null,
}
