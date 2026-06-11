import { indexToTile } from '../tiles/tile'
import { tileName } from '../tiles/tileNames'
import type {
  CalculationStep,
  DoraCount,
  FuResult,
  HandKind,
  PointsResult,
  UnifiedSet,
  YakuHit,
} from './types'

const setLabel = (set: UnifiedSet): string => {
  const name = tileName(indexToTile(set.startIndex))
  if (set.kind === 'shuntsu') {
    return `${name}からの順子`
  }
  const kindLabel =
    set.kind === 'kantsu'
      ? set.concealed
        ? '暗槓'
        : '明槓'
      : set.concealed && !set.completedByRon
        ? '暗刻'
        : '明刻'
  return `${name}の${kindLabel}`
}

interface ExplainInput {
  readonly handKind: HandKind
  readonly sets: readonly UnifiedSet[]
  readonly pairIndex: number | null
  readonly yaku: readonly YakuHit[]
  readonly dora: DoraCount
  readonly totalHan: number
  readonly isYakuman: boolean
  readonly fu: FuResult | null
  readonly points: PointsResult
}

const parseStep = (input: ExplainInput): CalculationStep => {
  if (input.handKind === 'chiitoi') {
    return { kind: 'parse', text: '手牌を7つの対子に分解しました（七対子形）' }
  }
  if (input.handKind === 'kokushi') {
    return { kind: 'parse', text: '幺九牌13種がそろっています（国士無双形）' }
  }
  const setsText = input.sets.map((s) => setLabel(s)).join('、')
  const pairText =
    input.pairIndex !== null
      ? `、雀頭は${tileName(indexToTile(input.pairIndex))}`
      : ''
  return {
    kind: 'parse',
    text: `手牌を分解: ${setsText}${pairText}`,
  }
}

const yakuSteps = (input: ExplainInput): readonly CalculationStep[] =>
  input.yaku.map((hit) => ({
    kind: 'yaku' as const,
    yakuId: hit.id,
    text: hit.isYakuman
      ? `${hit.name}（${hit.isDouble ? 'ダブル役満' : '役満'}）: ${hit.reason}`
      : `${hit.name}（${hit.han}翻）: ${hit.reason}`,
  }))

const doraStep = (input: ExplainInput): readonly CalculationStep[] => {
  const { omote, ura, aka } = input.dora
  const total = omote + ura + aka
  if (total === 0 || input.isYakuman) {
    return []
  }
  const parts = [
    omote > 0 ? `ドラ${omote}` : null,
    ura > 0 ? `裏ドラ${ura}` : null,
    aka > 0 ? `赤ドラ${aka}` : null,
  ].filter((p) => p !== null)
  return [
    {
      kind: 'dora',
      text: `${parts.join('・')}で合計${total}翻を加算（ドラは役ではないため、役がない手では数えられません）`,
    },
  ]
}

const fuSteps = (input: ExplainInput): readonly CalculationStep[] => {
  if (input.fu === null) {
    return []
  }
  const itemSteps = input.fu.items.map((item, itemIndex) => ({
    kind: 'fuItem' as const,
    itemIndex,
    text: `${item.label}: +${item.fu}符（${item.description}）`,
  }))
  const roundText = input.fu.isFixed
    ? `符の合計は${input.fu.rounded}符（固定）`
    : `合計${input.fu.rawTotal}符 → 1の位を切り上げて${input.fu.rounded}符`
  return [...itemSteps, { kind: 'fuRound', text: roundText }]
}

const pointSteps = (input: ExplainInput): readonly CalculationStep[] => {
  const mutableSteps: CalculationStep[] = [
    { kind: 'base', text: `基本点: ${input.points.formula}` },
  ]
  if (input.points.limit !== 'none') {
    const limitLabels: Readonly<Record<string, string>> = {
      mangan: '満貫',
      haneman: '跳満',
      baiman: '倍満',
      sanbaiman: '三倍満',
      yakuman: '役満',
    }
    mutableSteps.push({
      kind: 'limit',
      text: `${limitLabels[input.points.limit] ?? ''}が適用されます`,
    })
  }
  const p = input.points.payments
  const paymentText =
    p.type === 'ron'
      ? `ロン: 放銃した人から${p.fromDiscarder.toLocaleString()}点（合計${p.total.toLocaleString()}点）`
      : p.type === 'tsumo-dealer'
        ? `親のツモ: 全員から${p.fromEach.toLocaleString()}点ずつ（合計${p.total.toLocaleString()}点）`
        : `子のツモ: 親から${p.fromDealer.toLocaleString()}点、他の子から${p.fromOthers.toLocaleString()}点ずつ（合計${p.total.toLocaleString()}点）`
  mutableSteps.push({ kind: 'payment', text: paymentText })
  return mutableSteps
}

export const buildSteps = (input: ExplainInput): readonly CalculationStep[] => [
  parseStep(input),
  ...yakuSteps(input),
  ...doraStep(input),
  ...fuSteps(input),
  ...pointSteps(input),
]
