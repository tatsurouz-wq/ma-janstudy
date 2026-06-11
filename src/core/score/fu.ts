import { indexToTile } from '../tiles/tile'
import { tileName } from '../tiles/tileNames'
import type { FuItem, FuResult, YakuContext } from './types'
import {
  isKotsuLike,
  isYaochuuIndex,
  SANGEN_INDICES,
  windIndex,
} from './yaku/helpers'

const roundUpToTen = (fu: number): number => Math.ceil(fu / 10) * 10

const WAIT_LABELS: Readonly<Record<string, string>> = {
  kanchan: '嵌張待ち',
  penchan: '辺張待ち',
  tanki: '単騎待ち',
}

const tripletFu = (ctx: YakuContext): readonly FuItem[] =>
  ctx.sets.filter((s) => isKotsuLike(s)).map((set) => {
    const yaochuu = isYaochuuIndex(set.startIndex)
    const concealed = set.concealed && !set.completedByRon
    const isKan = set.kind === 'kantsu'
    const base = 2 * (yaochuu ? 2 : 1) * (concealed ? 2 : 1) * (isKan ? 4 : 1)
    const kindLabel = isKan
      ? concealed
        ? '暗槓'
        : '明槓'
      : concealed
        ? '暗刻'
        : '明刻'
    const name = tileName(indexToTile(set.startIndex))
    return {
      fu: base,
      label: `${name}の${kindLabel}`,
      description: `${yaochuu ? '幺九牌' : '中張牌'}の${kindLabel}は${base}符`,
    }
  })

const pairFu = (ctx: YakuContext): readonly FuItem[] => {
  if (ctx.pairIndex === null) {
    return []
  }
  const name = tileName(indexToTile(ctx.pairIndex))
  if (SANGEN_INDICES.includes(ctx.pairIndex)) {
    return [
      {
        fu: 2,
        label: `雀頭（${name}）`,
        description: '三元牌の雀頭は2符',
      },
    ]
  }
  const seatMatch = ctx.pairIndex === windIndex(ctx.win.seatWind)
  const roundMatch = ctx.pairIndex === windIndex(ctx.win.roundWind)
  if (seatMatch && roundMatch) {
    return [
      {
        fu: ctx.rule.doubleWindPairFu,
        label: `雀頭（${name}・連風牌）`,
        description: `自風かつ場風の雀頭は${ctx.rule.doubleWindPairFu}符`,
      },
    ]
  }
  if (seatMatch || roundMatch) {
    return [
      {
        fu: 2,
        label: `雀頭（${name}）`,
        description: `${seatMatch ? '自風' : '場風'}の雀頭は2符`,
      },
    ]
  }
  return []
}

export const calculateFu = (
  ctx: YakuContext,
  hasPinfu: boolean,
): FuResult => {
  if (ctx.handKind === 'chiitoi') {
    return {
      items: [
        {
          fu: 25,
          label: '七対子',
          description: '七対子は一律25符（切り上げなし）',
        },
      ],
      rawTotal: 25,
      rounded: 25,
      isFixed: true,
    }
  }
  if (hasPinfu && ctx.win.winType === 'tsumo') {
    return {
      items: [
        { fu: 20, label: '平和ツモ', description: '平和のツモ和了は20符固定（ツモ符はつかない）' },
      ],
      rawTotal: 20,
      rounded: 20,
      isFixed: true,
    }
  }
  const mutableItems: FuItem[] = [
    { fu: 20, label: '副底', description: '全ての和了に共通する基本の20符' },
  ]
  if (ctx.isMenzen && ctx.win.winType === 'ron') {
    mutableItems.push({
      fu: 10,
      label: '門前ロン',
      description: '鳴かずにロン和了すると10符追加',
    })
  }
  if (ctx.win.winType === 'tsumo') {
    mutableItems.push({ fu: 2, label: 'ツモ', description: 'ツモ和了は2符追加' })
  }
  mutableItems.push(...tripletFu(ctx))
  mutableItems.push(...pairFu(ctx))
  const waitLabel = ctx.waitShape !== null ? WAIT_LABELS[ctx.waitShape] : undefined
  if (waitLabel !== undefined) {
    mutableItems.push({
      fu: 2,
      label: waitLabel,
      description: `${waitLabel}は2符追加`,
    })
  }
  const rawTotal = mutableItems.reduce((sum, item) => sum + item.fu, 0)
  if (!ctx.isMenzen && ctx.win.winType === 'ron' && rawTotal === 20) {
    const kuipinfuItems = [
      ...mutableItems,
      {
        fu: 10,
        label: '喰い平和形',
        description: '鳴いた平和形のロンは30符に繰り上げる',
      },
    ]
    return { items: kuipinfuItems, rawTotal: 30, rounded: 30, isFixed: true }
  }
  return {
    items: mutableItems,
    rawTotal,
    rounded: roundUpToTen(rawTotal),
    isFixed: false,
  }
}
