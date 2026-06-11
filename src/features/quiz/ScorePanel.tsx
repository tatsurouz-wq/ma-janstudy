import { useState } from 'react'
import type { ScoreQuestion } from '@/content/quizzes/types'
import { StepPlayer } from '@/components/score/StepPlayer'
import { ContextChips } from './ContextChips'
import { HandDisplay } from './HandDisplay'
import { paymentLabel, scoreChoices, solveScore } from './quizEngine'

interface ScorePanelProps {
  readonly question: ScoreQuestion
  readonly onAnswered: (isCorrect: boolean) => void
  readonly answered: boolean
}

export function ScorePanel({
  question,
  onAnswered,
  answered,
}: ScorePanelProps) {
  const [picked, setPicked] = useState<string | null>(null)
  const result = solveScore(question)
  const correct = paymentLabel(result)
  const choices = scoreChoices(question)

  const yakuSummary = result.yaku
    .map((y) => `${y.name}${y.isYakuman ? '' : y.han}`)
    .join('・')

  const pick = (choice: string) => {
    if (answered) {
      return
    }
    setPicked(choice)
    onAnswered(choice === correct)
  }

  return (
    <div className="space-y-5">
      <p className="text-lg">
        この和了の<strong className="text-gold-300">点数（支払い）</strong>
        はいくつでしょう？
      </p>
      <ContextChips context={question.context} />
      <HandDisplay
        hand={question.hand}
        melds={question.melds}
        highlightTile={question.winTile}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {choices.map((choice) => {
          const isCorrectChoice = choice === correct
          const isPicked = picked === choice
          const feedbackClass = answered
            ? isCorrectChoice
              ? 'glow-ok border-ok-400'
              : isPicked
                ? 'glow-ng border-ng-400'
                : 'opacity-50 border-gold-line'
            : 'border-gold-line hover:bg-surface-700'
          return (
            <button
              key={choice}
              type="button"
              onClick={() => pick(choice)}
              className={`rounded-xl border bg-surface-800 px-4 py-3 text-lg font-bold tabular-nums transition-all ${feedbackClass}`}
            >
              {choice}
            </button>
          )
        })}
      </div>
      {answered ? (
        <div className="hairline space-y-3 rounded-2xl bg-surface-800 p-4">
          <p className="text-sm">
            <span className="font-mincho text-gold-300">{yakuSummary}</span>
            <span className="ml-2 text-text-secondary">
              {result.isYakuman
                ? '役満'
                : `${result.totalHan}翻${result.fu?.rounded ?? 0}符`}
              で <span className="text-gold-300">{correct}</span>
            </span>
          </p>
          <details>
            <summary className="cursor-pointer text-sm text-text-secondary hover:text-gold-300">
              計算過程をステップで見る
            </summary>
            <div className="mt-3">
              <StepPlayer steps={result.steps} animated={false} />
            </div>
          </details>
          <p className="text-sm text-text-secondary">{question.hint}</p>
        </div>
      ) : null}
    </div>
  )
}
