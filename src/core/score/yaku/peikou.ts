import type { YakuContext, YakuDefinition } from '../types'

const identicalShuntsuPairs = (ctx: YakuContext): number => {
  const starts = ctx.sets
    .filter((s) => s.kind === 'shuntsu' && !s.fromMeld)
    .map((s) => s.startIndex)
  const mutableByStart = new Map<number, number>()
  for (const start of starts) {
    mutableByStart.set(start, (mutableByStart.get(start) ?? 0) + 1)
  }
  return [...mutableByStart.values()].reduce(
    (sum, n) => sum + Math.floor(n / 2),
    0,
  )
}

export const iipeiko: YakuDefinition = {
  id: 'iipeiko',
  name: '一盃口',
  hanClosed: 1,
  hanOpen: null,
  isYakuman: false,
  detect: (ctx) =>
    ctx.isMenzen && identicalShuntsuPairs(ctx) === 1
      ? '同じ順子を2組そろえた'
      : null,
}

export const ryanpeiko: YakuDefinition = {
  id: 'ryanpeiko',
  name: '二盃口',
  hanClosed: 3,
  hanOpen: null,
  isYakuman: false,
  detect: (ctx) =>
    ctx.isMenzen && identicalShuntsuPairs(ctx) === 2
      ? '同じ順子2組を2セットそろえた'
      : null,
}
