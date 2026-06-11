import { useState } from 'react'
import { motion } from 'framer-motion'
import type { YakuQuestion } from '@/content/quizzes/types'
import { ContextChips } from './ContextChips'
import { HandDisplay } from './HandDisplay'
import { solveScore, YAKU_NAME_BY_ID } from './quizEngine'

interface YakuPanelProps {
  readonly question: YakuQuestion
  readonly onAnswered: (isCorrect: boolean) => void
  readonly answered: boolean
}

export function YakuPanel({ question, onAnswered, answered }: YakuPanelProps) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const result = solveScore(question)
  const answerIds = new Set(result.yaku.map((y) => y.id))

  const toggle = (id: string) => {
    if (answered) {
      return
    }
    setSelected((current) => {
      const mutableNext = new Set(current)
      if (mutableNext.has(id)) {
        mutableNext.delete(id)
      } else {
        mutableNext.add(id)
      }
            return mutableNext
    })
  }

  const submit = () => {
    const isCorrect =
      selected.size === answerIds.size &&
      [...selected].every((id) => answerIds.has(id))
    onAnswered(isCorrect)
  }

  return (
    <div className="space-y-5">
      <p className="text-lg">
        この和了に成立している役を
        <strong className="text-gold-300">すべて</strong>選んでください
      </p>
      <ContextChips context={question.context} />
      <HandDisplay
        hand={question.hand}
        melds={question.melds}
        highlightTile={question.winTile}
      />
      <div className="flex flex-wrap gap-2">
        {question.choices.map((id) => {
          const isAnswer = answerIds.has(id)
          const isSelected = selected.has(id)
          const feedbackClass = answered
            ? isAnswer
              ? 'glow-ok border-ok-400'
              : isSelected
                ? 'glow-ng border-ng-400'
                : 'opacity-50 border-gold-line'
            : isSelected
              ? 'border-gold-500 bg-gold-500/15'
              : 'border-gold-line hover:bg-surface-700'
          return (
            <button
              key={id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(id)}
              className={`rounded-xl border bg-surface-800 px-4 py-2 font-mincho transition-all ${feedbackClass}`}
            >
              {YAKU_NAME_BY_ID.get(id) ?? id}
            </button>
          )
        })}
      </div>
      {!answered ? (
        <motion.button
          type="button"
          onClick={submit}
          disabled={selected.size === 0}
          whileTap={{ scale: 0.97 }}
          className="rounded-xl bg-gold-500 px-8 py-2.5 font-medium text-ink-950 transition-all hover:brightness-110 disabled:opacity-40"
        >
          決定
        </motion.button>
      ) : (
        <div className="hairline space-y-2 rounded-2xl bg-surface-800 p-4 text-sm">
          {result.yaku.map((hit) => (
            <p key={hit.id}>
              <span className="font-mincho text-gold-300">{hit.name}</span>
              <span className="ml-2 text-text-secondary">
                {hit.isYakuman ? '役満' : `${hit.han}翻`}: {hit.reason}
              </span>
            </p>
          ))}
          <p className="text-text-secondary">{question.hint}</p>
        </div>
      )}
    </div>
  )
}
