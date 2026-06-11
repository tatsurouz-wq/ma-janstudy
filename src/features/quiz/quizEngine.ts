import { parseTiles } from '@/core/tiles/notation'
import { countsFromTiles } from '@/core/tiles/tileCounts'
import { waitingTiles } from '@/core/hand/waits'
import { calculateScore } from '@/core/score/calculate'
import { DEFAULT_RULE } from '@/core/rules/ruleset'
import type { ScoreInput, ScoreResult } from '@/core/score/types'
import { NORMAL_REGISTRY, YAKUMAN_REGISTRY } from '@/core/score/yaku/registry'
import type {
  QuizContext,
  ScoreQuestion,
  WaitQuestion,
  YakuQuestion,
} from '@/content/quizzes/types'

export const YAKU_NAME_BY_ID: ReadonlyMap<string, string> = new Map(
  [...YAKUMAN_REGISTRY, ...NORMAL_REGISTRY].map((def) => [def.id, def.name]),
)

const toScoreInput = (
  question: YakuQuestion | ScoreQuestion,
): ScoreInput => {
  const context: QuizContext = question.context
  return {
    concealed: parseTiles(question.hand),
    melds: question.melds ?? [],
    winTile: question.winTile,
    win: {
      winType: context.winType,
      riichi: context.riichi === true ? 'riichi' : 'none',
      ippatsu: context.ippatsu === true,
      haitei: false,
      houtei: false,
      rinshan: false,
      chankan: false,
      tenhou: false,
      chiihou: false,
      seatWind: context.seatWind,
      roundWind: context.roundWind,
    },
    doraIndicators: context.doraIndicators ?? [],
    uraIndicators: context.uraIndicators ?? [],
    redFives: context.redFives ?? 0,
    honba: context.honba ?? 0,
    kyotaku: 0,
    rule: DEFAULT_RULE,
  }
}

export const solveWaits = (question: WaitQuestion): readonly number[] =>
  waitingTiles(countsFromTiles(parseTiles(question.hand)))

export const solveScore = (
  question: YakuQuestion | ScoreQuestion,
): ScoreResult => {
  const outcome = calculateScore(toScoreInput(question))
  if (!outcome.ok) {
    throw new Error(`問題${question.id}が計算できません: ${outcome.reason}`)
  }
  return outcome.result
}

export const paymentLabel = (result: ScoreResult): string => {
  const p = result.points.payments
  if (p.type === 'ron') {
    return String(p.fromDiscarder)
  }
  if (p.type === 'tsumo-dealer') {
    return `${p.fromEach}オール`
  }
  return `${p.fromOthers}/${p.fromDealer}`
}

export const scoreChoices = (
  question: ScoreQuestion,
): readonly string[] => {
  const correct = paymentLabel(solveScore(question))
  const all = [correct, ...question.distractors]
  const shuffled = [...all].sort(
    (a, b) =>
      (a + question.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0) -
      (b + question.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0),
  )
  return shuffled
}
