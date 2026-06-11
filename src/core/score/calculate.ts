import { tileToIndex } from '../tiles/tile'
import type { TileCounts } from '../tiles/tileCounts'
import { countsFromTiles, withTileAdded } from '../tiles/tileCounts'
import type { Decomposition } from '../hand/decompose'
import { decomposeStandard } from '../hand/decompose'
import { isChiitoi, isKokushi } from '../hand/winning'
import type { WaitShape } from '../hand/waits'
import { waitShapesIn } from '../hand/waits'
import { countDora } from './dora'
import { buildSteps } from './explain'
import { calculateFu } from './fu'
import { calculatePoints } from './points'
import type {
  HandKind,
  Meld,
  ScoreInput,
  ScoreOutcome,
  ScoreResult,
  UnifiedSet,
  YakuContext,
  YakuHit,
} from './types'
import { NORMAL_REGISTRY, YAKUMAN_REGISTRY } from './yaku/registry'

interface Interpretation {
  readonly handKind: HandKind
  readonly decomposition: Decomposition | null
  readonly sets: readonly UnifiedSet[]
  readonly pairIndex: number | null
  readonly waitShape: WaitShape | null
}

const meldToUnifiedSet = (meld: Meld): UnifiedSet => {
  const indices = meld.tiles.map((t) => tileToIndex(t))
  return {
    kind:
      meld.type === 'chi'
        ? 'shuntsu'
        : meld.type === 'pon'
          ? 'kotsu'
          : 'kantsu',
    startIndex: Math.min(...indices),
    concealed: meld.type === 'ankan',
    fromMeld: true,
    completedByRon: false,
  }
}

const buildUnifiedSets = (
  decomposition: Decomposition,
  melds: readonly Meld[],
  winIndex: number,
  waitShape: WaitShape,
  isRon: boolean,
): readonly UnifiedSet[] => {
  const ronKotsuMarked = isRon && waitShape === 'shanpon'
  const concealedSets = decomposition.sets.map(
    (s): UnifiedSet => ({
      kind: s.kind,
      startIndex: s.startIndex,
      concealed: true,
      fromMeld: false,
      completedByRon:
        ronKotsuMarked && s.kind === 'kotsu' && s.startIndex === winIndex,
    }),
  )
  return [...concealedSets, ...melds.map((m) => meldToUnifiedSet(m))]
}

const buildAllCounts = (
  concealedCounts: TileCounts,
  melds: readonly Meld[],
): TileCounts =>
  melds
    .flatMap((m) => m.tiles)
    .reduce(
      (counts, tile) => withTileAdded(counts, tileToIndex(tile)),
      concealedCounts,
    )

const enumerateInterpretations = (
  input: ScoreInput,
  concealedCounts: TileCounts,
  winIndex: number,
): readonly Interpretation[] => {
  const isRon = input.win.winType === 'ron'
  const standard = decomposeStandard(concealedCounts).flatMap(
    (decomposition) =>
      waitShapesIn(decomposition, winIndex).map(
        (waitShape): Interpretation => ({
          handKind: 'standard',
          decomposition,
          sets: buildUnifiedSets(
            decomposition,
            input.melds,
            winIndex,
            waitShape,
            isRon,
          ),
          pairIndex: decomposition.pairIndex,
          waitShape,
        }),
      ),
  )
  const mutableSpecial: Interpretation[] = []
  if (input.melds.length === 0 && isChiitoi(concealedCounts)) {
    mutableSpecial.push({
      handKind: 'chiitoi',
      decomposition: null,
      sets: [],
      pairIndex: null,
      waitShape: 'tanki',
    })
  }
  if (input.melds.length === 0 && isKokushi(concealedCounts)) {
    mutableSpecial.push({
      handKind: 'kokushi',
      decomposition: null,
      sets: [],
      pairIndex: null,
      waitShape: null,
    })
  }
  return [...standard, ...mutableSpecial]
}

const scoreInterpretation = (
  input: ScoreInput,
  interpretation: Interpretation,
  concealedCounts: TileCounts,
  allCounts: TileCounts,
  winIndex: number,
  isMenzen: boolean,
): ScoreResult | null => {
  const ctx: YakuContext = {
    handKind: interpretation.handKind,
    decomposition: interpretation.decomposition,
    sets: interpretation.sets,
    pairIndex: interpretation.pairIndex,
    allCounts,
    concealedCounts,
    winIndex,
    waitShape: interpretation.waitShape,
    isMenzen,
    win: input.win,
    rule: input.rule,
  }
  const isDealer = input.win.seatWind === 1

  const yakumanHits: readonly YakuHit[] = YAKUMAN_REGISTRY.flatMap((def) => {
    const reason = def.detect(ctx)
    if (reason === null) {
      return []
    }
    const isDouble =
      input.rule.doubleYakuman && def.isDoubleYakuman?.(ctx) === true
    return [
      {
        id: def.id,
        name: def.name,
        han: 13,
        isYakuman: true,
        isDouble,
        reason,
      },
    ]
  })

  if (yakumanHits.length > 0) {
    const unitValues = yakumanHits.map((h) => (h.isDouble ? 2 : 1))
    const yakumanUnits = input.rule.stackedYakuman
      ? unitValues.reduce((a, b) => a + b, 0)
      : Math.max(...unitValues)
    const points = calculatePoints(
      13,
      0,
      true,
      yakumanUnits,
      isDealer,
      input.win.winType,
      input.honba,
      input.kyotaku,
      input.rule,
    )
    const base = {
      handKind: interpretation.handKind,
      sets: interpretation.sets,
      pairIndex: interpretation.pairIndex,
      yaku: yakumanHits,
      dora: { omote: 0, ura: 0, aka: 0 },
      totalHan: 13 * yakumanUnits,
      isYakuman: true,
      fu: null,
      points,
    }
    return {
      ...base,
      decomposition: interpretation.decomposition,
      waitShape: interpretation.waitShape,
      yakumanUnits,
      steps: buildSteps(base),
    }
  }

  const hits: readonly YakuHit[] = NORMAL_REGISTRY.flatMap((def) => {
    const reason = def.detect(ctx)
    if (reason === null) {
      return []
    }
    const han = isMenzen ? def.hanClosed : def.hanOpen
    if (han === null) {
      return []
    }
    return [
      { id: def.id, name: def.name, han, isYakuman: false, isDouble: false, reason },
    ]
  })

  if (hits.length === 0) {
    return null
  }

  const hasPinfu = hits.some((h) => h.id === 'pinfu')
  const fu = calculateFu(ctx, hasPinfu)
  const dora = {
    omote: countDora(allCounts, input.doraIndicators),
    ura:
      input.win.riichi !== 'none'
        ? countDora(allCounts, input.uraIndicators)
        : 0,
    aka: input.rule.redFives ? input.redFives : 0,
  }
  const yakuHan = hits.reduce((sum, h) => sum + h.han, 0)
  const totalHan = yakuHan + dora.omote + dora.ura + dora.aka
  const points = calculatePoints(
    totalHan,
    fu.rounded,
    false,
    1,
    isDealer,
    input.win.winType,
    input.honba,
    input.kyotaku,
    input.rule,
  )
  const base = {
    handKind: interpretation.handKind,
    sets: interpretation.sets,
    pairIndex: interpretation.pairIndex,
    yaku: hits,
    dora,
    totalHan,
    isYakuman: false,
    fu,
    points,
  }
  return {
    ...base,
    decomposition: interpretation.decomposition,
    waitShape: interpretation.waitShape,
    yakumanUnits: 0,
    steps: buildSteps(base),
  }
}

const compareResults = (a: ScoreResult, b: ScoreResult): number => {
  if (a.points.payments.total !== b.points.payments.total) {
    return b.points.payments.total - a.points.payments.total
  }
  if (a.totalHan !== b.totalHan) {
    return b.totalHan - a.totalHan
  }
  return (b.fu?.rounded ?? 0) - (a.fu?.rounded ?? 0)
}

export const calculateScore = (input: ScoreInput): ScoreOutcome => {
  const handSize = input.concealed.length + input.melds.length * 3
  if (handSize !== 14 || !input.concealed.includes(input.winTile)) {
    return { ok: false, reason: 'invalid-hand' }
  }
  const concealedCounts = countsFromTiles(input.concealed)
  const winIndex = tileToIndex(input.winTile)
  const isMenzen = input.melds.every((m) => m.type === 'ankan')
  const allCounts = buildAllCounts(concealedCounts, input.melds)

  const interpretations = enumerateInterpretations(
    input,
    concealedCounts,
    winIndex,
  )
  if (interpretations.length === 0) {
    return { ok: false, reason: 'not-winning' }
  }

  const scored = interpretations
    .map((interpretation) =>
      scoreInterpretation(
        input,
        interpretation,
        concealedCounts,
        allCounts,
        winIndex,
        isMenzen,
      ),
    )
    .filter((r): r is ScoreResult => r !== null)
    .sort(compareResults)

  const best = scored[0]
  if (best === undefined) {
    return { ok: false, reason: 'no-yaku' }
  }
  return { ok: true, result: best, alternatives: scored.slice(1) }
}
