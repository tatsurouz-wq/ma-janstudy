import { useState } from 'react'
import { motion } from 'framer-motion'
import type { ChoiceQuizStep } from '@/content/lessons/types'
import { HandDisplay } from '@/features/quiz/HandDisplay'

interface ChoiceQuizStepViewProps {
  readonly step: ChoiceQuizStep
  readonly onComplete: () => void
}

export function ChoiceQuizStepView({
  step,
  onComplete,
}: ChoiceQuizStepViewProps) {
  const [picked, setPicked] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)

  const pick = (index: number) => {
    if (solved) {
      return
    }
    setPicked(index)
    if (index === step.correctIndex) {
      setSolved(true)
      onComplete()
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-lg">{step.prompt}</p>
      {step.tiles !== undefined ? <HandDisplay hand={step.tiles} /> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {step.choices.map((choice, index) => {
          const isCorrect = index === step.correctIndex
          const isPicked = picked === index
          const stateClass = solved
            ? isCorrect
              ? 'glow-ok border-ok-400'
              : 'opacity-50 border-gold-line'
            : isPicked
              ? 'glow-ng border-ng-400'
              : 'border-gold-line hover:bg-surface-700'
          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => pick(index)}
              animate={
                isPicked && !solved ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }
              }
              transition={{ duration: 0.32 }}
              className={`rounded-xl border bg-surface-800 px-5 py-3 text-left transition-all ${stateClass}`}
            >
              {choice}
            </motion.button>
          )
        })}
      </div>
      {solved ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="hairline rounded-2xl bg-surface-800 p-4 text-sm"
        >
          <p className="font-mincho text-lg text-ok-400">正解</p>
          <p className="mt-1 text-text-secondary">{step.explanation}</p>
        </motion.div>
      ) : picked !== null ? (
        <p className="text-sm text-ng-400">もう一度考えてみましょう</p>
      ) : null}
    </div>
  )
}
