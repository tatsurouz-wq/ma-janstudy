import { useState } from 'react'
import { motion } from 'framer-motion'
import type { WaitQuestion } from '@/content/quizzes/types'
import { ALL_TILES, indexToTile, tileToIndex } from '@/core/tiles/tile'
import { tileName } from '@/core/tiles/tileNames'
import { TileButton } from '@/components/tiles/TileButton'
import { TileSvg } from '@/components/tiles/TileSvg'
import { HandDisplay } from './HandDisplay'
import { solveWaits } from './quizEngine'

interface WaitPanelProps {
  readonly question: WaitQuestion
  readonly onAnswered: (isCorrect: boolean) => void
  readonly answered: boolean
}

export function WaitPanel({ question, onAnswered, answered }: WaitPanelProps) {
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set())
  const correctWaits = solveWaits(question)

  const toggle = (index: number) => {
    if (answered) {
      return
    }
    setSelected((current) => {
      const mutableNext = new Set(current)
      if (mutableNext.has(index)) {
        mutableNext.delete(index)
      } else {
        mutableNext.add(index)
      }
            return mutableNext
    })
  }

  const submit = () => {
    const correctSet = new Set(correctWaits)
    const isCorrect =
      selected.size === correctSet.size &&
      [...selected].every((i) => correctSet.has(i))
    onAnswered(isCorrect)
  }

  return (
    <div className="space-y-5">
      <p className="text-lg">この手牌の待ち（和了牌）を<strong className="text-gold-300">すべて</strong>選んでください</p>
      <HandDisplay hand={question.hand} />
      <div className="hairline rounded-2xl bg-surface-800 p-4">
        <div className="flex flex-wrap gap-1.5">
          {ALL_TILES.map((tile) => {
            const index = tileToIndex(tile)
            const isCorrectTile = correctWaits.includes(index)
            const isSelected = selected.has(index)
            return (
              <div
                key={tile}
                className={
                  answered
                    ? isCorrectTile
                      ? 'glow-ok rounded-[7px]'
                      : isSelected
                        ? 'glow-ng rounded-[7px]'
                        : 'opacity-40'
                    : ''
                }
              >
                <TileButton
                  tile={tile}
                  size="sm"
                  selected={!answered && isSelected}
                  onClick={() => toggle(index)}
                  disabled={answered && !isCorrectTile && !isSelected}
                />
              </div>
            )
          })}
        </div>
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
          <p>
            正解:
            <span className="ml-2 inline-flex items-center gap-1 align-middle">
              {correctWaits.map((i) => (
                <TileSvg key={i} tile={indexToTile(i)} size="xs" />
              ))}
            </span>
            <span className="ml-2 text-text-secondary">
              （{correctWaits.map((i) => tileName(indexToTile(i))).join('・')}）
            </span>
          </p>
          <p className="text-text-secondary">{question.hint}</p>
        </div>
      )}
    </div>
  )
}
