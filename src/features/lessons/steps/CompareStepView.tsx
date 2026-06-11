import { useEffect } from 'react'
import type { CompareStep, CompareVariant } from '@/content/lessons/types'
import { parseTiles } from '@/core/tiles/notation'
import { calculateScore } from '@/core/score/calculate'
import { DEFAULT_RULE } from '@/core/rules/ruleset'
import { HandDisplay } from '@/features/quiz/HandDisplay'

interface CompareStepViewProps {
  readonly step: CompareStep
  readonly onComplete: () => void
}

const solveVariant = (variant: CompareVariant) =>
  calculateScore({
    concealed: parseTiles(variant.hand),
    melds: [],
    winTile: variant.winTile,
    win: {
      winType: variant.winType,
      riichi: 'none',
      ippatsu: false,
      haitei: false,
      houtei: false,
      rinshan: false,
      chankan: false,
      tenhou: false,
      chiihou: false,
      seatWind: 2,
      roundWind: 1,
    },
    doraIndicators: [],
    uraIndicators: [],
    redFives: 0,
    honba: 0,
    kyotaku: 0,
    rule: DEFAULT_RULE,
  })

export function CompareStepView({ step, onComplete }: CompareStepViewProps) {
  useEffect(() => {
    onComplete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-5">
      <p className="text-lg">{step.prompt}</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {step.variants.map((variant) => {
          const outcome = solveVariant(variant)
          return (
            <div
              key={variant.label}
              className="hairline space-y-3 rounded-2xl bg-surface-800 p-4"
            >
              <p className="font-mincho text-gold-300">{variant.label}</p>
              <HandDisplay
                hand={variant.hand}
                highlightTile={variant.winTile}
                size="sm"
              />
              {outcome.ok ? (
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-text-secondary">役: </span>
                    {outcome.result.yaku.map((y) => y.name).join('・')}
                  </p>
                  <p>
                    <span className="text-text-secondary">符の内訳: </span>
                    {outcome.result.fu?.items
                      .map((item) => `${item.label}${item.fu}`)
                      .join(' + ')}
                  </p>
                  <p className="font-bold text-gold-300">
                    {outcome.result.totalHan}翻{outcome.result.fu?.rounded}符 ={' '}
                    {outcome.result.points.payments.total.toLocaleString()}点
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ng-400">
                  この形は役がなく和了できません
                </p>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-sm text-text-secondary">{step.explanation}</p>
    </div>
  )
}
