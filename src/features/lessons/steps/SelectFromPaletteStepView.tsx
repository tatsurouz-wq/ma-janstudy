import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { SelectFromPaletteStep } from '@/content/lessons/types'
import { parseTiles } from '@/core/tiles/notation'
import { countsFromTiles } from '@/core/tiles/tileCounts'
import { waitingTiles } from '@/core/hand/waits'
import type { Tile } from '@/core/tiles/tile'
import { ALL_TILES, indexToTile } from '@/core/tiles/tile'
import { TileButton } from '@/components/tiles/TileButton'
import { HandDisplay } from '@/features/quiz/HandDisplay'

interface SelectFromPaletteStepViewProps {
  readonly step: SelectFromPaletteStep
  readonly onComplete: () => void
}

export function SelectFromPaletteStepView({
  step,
  onComplete,
}: SelectFromPaletteStepViewProps) {
  const palette: readonly Tile[] =
    step.palette === 'all' ? ALL_TILES : parseTiles(step.palette)

  const correctTiles: readonly Tile[] = useMemo(() => {
    if (step.correct === 'waits-of-hand') {
      if (step.hand === undefined) {
        return []
      }
      return waitingTiles(countsFromTiles(parseTiles(step.hand))).map((i) =>
        indexToTile(i),
      )
    }
    return step.correct
  }, [step])

  const [selected, setSelected] = useState<ReadonlySet<Tile>>(new Set())
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)

  const toggle = (tile: Tile) => {
    if (result === 'correct') {
      return
    }
    setResult(null)
    setSelected((current) => {
      const mutableNext = new Set(current)
      if (mutableNext.has(tile)) {
        mutableNext.delete(tile)
      } else {
        mutableNext.add(tile)
      }
      return mutableNext
    })
  }

  const submit = () => {
    const correctSet = new Set(correctTiles)
    const isCorrect =
      selected.size === correctSet.size &&
      [...selected].every((t) => correctSet.has(t))
    setResult(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) {
      onComplete()
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-lg">{step.prompt}</p>
      {step.hand !== undefined ? <HandDisplay hand={step.hand} /> : null}
      <div className="hairline flex flex-wrap gap-1.5 rounded-2xl bg-surface-800 p-4">
        {[...new Set(palette)].map((tile) => {
          const isSelected = selected.has(tile)
          const showCorrect =
            result === 'correct' && correctTiles.includes(tile)
          return (
            <div
              key={tile}
              className={showCorrect ? 'glow-ok rounded-[7px]' : ''}
            >
              <TileButton
                tile={tile}
                size="sm"
                selected={isSelected && result !== 'correct'}
                onClick={() => toggle(tile)}
              />
            </div>
          )
        })}
      </div>
      {result === 'correct' ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="hairline rounded-2xl bg-surface-800 p-4 text-sm"
        >
          <p className="font-mincho text-lg text-ok-400">正解</p>
          <p className="mt-1 text-text-secondary">{step.explanation}</p>
        </motion.div>
      ) : (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={submit}
            disabled={selected.size === 0}
            className="rounded-xl bg-gold-500 px-8 py-2.5 font-medium text-ink-950 transition-all hover:brightness-110 disabled:opacity-40"
          >
            確認する
          </button>
          {result === 'wrong' ? (
            <motion.p
              key={selected.size}
              animate={{ x: [-6, 6, -4, 4, 0] }}
              transition={{ duration: 0.32 }}
              className="text-sm text-ng-400"
            >
              惜しい。もう一度考えてみましょう
            </motion.p>
          ) : null}
        </div>
      )}
    </div>
  )
}
