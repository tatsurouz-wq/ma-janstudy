import { motion } from 'framer-motion'
import type { CalculationStep } from '@/core/score/types'

const KIND_LABELS: Readonly<Record<CalculationStep['kind'], string>> = {
  parse: '分解',
  yaku: '役',
  dora: 'ドラ',
  fuItem: '符',
  fuRound: '符',
  base: '点数',
  limit: '点数',
  payment: '支払い',
}

const KIND_COLORS: Readonly<Record<CalculationStep['kind'], string>> = {
  parse: 'text-info-400',
  yaku: 'text-gold-300',
  dora: 'text-gold-300',
  fuItem: 'text-text-secondary',
  fuRound: 'text-text-primary',
  base: 'text-text-primary',
  limit: 'text-gold-300',
  payment: 'text-gold-300',
}

interface StepPlayerProps {
  readonly steps: readonly CalculationStep[]
  readonly animated?: boolean
}

export function StepPlayer({ steps, animated = true }: StepPlayerProps) {
  return (
    <ol className="space-y-2" aria-label="計算過程">
      {steps.map((step, index) => (
        <motion.li
          key={`${step.kind}-${index}`}
          initial={animated ? { opacity: 0, x: 16 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: animated ? index * 0.08 : 0, duration: 0.24 }}
          className="flex items-start gap-3 rounded-lg bg-surface-700/60 px-3 py-2"
        >
          <span className="mt-0.5 inline-flex w-12 shrink-0 justify-center rounded border border-gold-line px-1 text-xs leading-5 text-text-secondary">
            {KIND_LABELS[step.kind]}
          </span>
          <span className={`text-sm leading-6 ${KIND_COLORS[step.kind]}`}>
            {step.text}
          </span>
        </motion.li>
      ))}
    </ol>
  )
}
