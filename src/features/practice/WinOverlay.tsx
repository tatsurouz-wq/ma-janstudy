import { useState } from 'react'
import { motion } from 'framer-motion'
import type { ScoreResult } from '@/core/score/types'
import { StepPlayer } from '@/components/score/StepPlayer'

interface WinOverlayProps {
  readonly result: ScoreResult
  readonly onNextGame: () => void
}

export function WinOverlay({ result, onNextGame }: WinOverlayProps) {
  const [showSteps, setShowSteps] = useState(false)
  const p = result.points.payments
  const totalLabel =
    p.type === 'tsumo-dealer'
      ? `${p.fromEach.toLocaleString()}点オール`
      : `${p.total.toLocaleString()}点`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-2xl space-y-5">
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="border-y border-gold-500/60 bg-gradient-to-r from-transparent via-gold-500/15 to-transparent py-6 text-center"
        >
          <p className="text-sm tracking-widest text-gold-300">ツモ和了</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {result.yaku.map((hit, i) => (
              <motion.span
                key={hit.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="font-mincho text-3xl font-bold text-text-primary"
              >
                {hit.name}
              </motion.span>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + result.yaku.length * 0.15 + 0.2 }}
            className="mt-4 font-mincho text-5xl font-bold tabular-nums text-gold-300"
          >
            {result.isYakuman
              ? '役満 '
              : `${result.totalHan}翻${result.fu !== null ? `${result.fu.rounded}符` : ''} `}
            {totalLabel}
          </motion.p>
        </motion.div>

        {showSteps ? (
          <div className="hairline max-h-72 overflow-y-auto rounded-2xl bg-surface-800 p-4">
            <StepPlayer steps={result.steps} animated={false} />
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => setShowSteps((s) => !s)}
            className="rounded-xl border border-gold-line bg-surface-800 px-6 py-2.5 text-sm text-text-secondary hover:bg-surface-700"
          >
            {showSteps ? '内訳を閉じる' : '点数の内訳を見る'}
          </button>
          <button
            type="button"
            onClick={onNextGame}
            className="rounded-xl bg-gold-500 px-6 py-2.5 text-sm font-medium text-ink-950 hover:brightness-110"
          >
            もう一局
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
