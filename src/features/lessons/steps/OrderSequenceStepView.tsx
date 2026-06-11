import { useState } from 'react'
import { motion } from 'framer-motion'
import type { OrderSequenceStep } from '@/content/lessons/types'

interface OrderSequenceStepViewProps {
  readonly step: OrderSequenceStep
  readonly onComplete: () => void
}

export function OrderSequenceStepView({
  step,
  onComplete,
}: OrderSequenceStepViewProps) {
  const [ordered, setOrdered] = useState<readonly string[]>([])
  const [shakeId, setShakeId] = useState<string | null>(null)

  const pick = (id: string) => {
    const expectedNext = step.correctOrder[ordered.length]
    if (id === expectedNext) {
      const next = [...ordered, id]
      setOrdered(next)
      if (next.length === step.correctOrder.length) {
        onComplete()
      }
    } else {
      setShakeId(id)
      window.setTimeout(() => setShakeId(null), 400)
    }
  }

  const done = ordered.length === step.correctOrder.length

  return (
    <div className="space-y-5">
      <p className="text-lg">{step.prompt}</p>
      <div className="hairline min-h-16 space-y-2 rounded-2xl bg-surface-800 p-4">
        {ordered.length === 0 ? (
          <p className="text-sm text-text-disabled">
            正しい順番にカードをタップしてください
          </p>
        ) : (
          ordered.map((id, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 rounded-lg bg-surface-700 px-4 py-2"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-ink-950">
                {i + 1}
              </span>
              <span>{step.items.find((item) => item.id === id)?.label}</span>
            </motion.div>
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {step.items
          .filter((item) => !ordered.includes(item.id))
          .map((item) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => pick(item.id)}
              animate={shakeId === item.id ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.32 }}
              whileHover={{ y: -2 }}
              className="rounded-xl border border-gold-line bg-surface-800 px-5 py-3 transition-colors hover:bg-surface-700"
            >
              {item.label}
            </motion.button>
          ))}
      </div>
      {done ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-text-secondary"
        >
          {step.explanation}
        </motion.p>
      ) : null}
    </div>
  )
}
