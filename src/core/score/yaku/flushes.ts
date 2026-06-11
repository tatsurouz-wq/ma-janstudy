import type { YakuDefinition } from '../types'
import { hasHonorTiles, usedNumberSuits } from './helpers'

export const honitsu: YakuDefinition = {
  id: 'honitsu',
  name: '混一色',
  hanClosed: 3,
  hanOpen: 2,
  isYakuman: false,
  detect: (ctx) =>
    usedNumberSuits(ctx) === 1 && hasHonorTiles(ctx)
      ? '1種類の数牌と字牌だけで手を作った'
      : null,
}

export const chinitsu: YakuDefinition = {
  id: 'chinitsu',
  name: '清一色',
  hanClosed: 6,
  hanOpen: 5,
  isYakuman: false,
  detect: (ctx) =>
    usedNumberSuits(ctx) === 1 && !hasHonorTiles(ctx)
      ? '1種類の数牌だけで手を作った'
      : null,
}
