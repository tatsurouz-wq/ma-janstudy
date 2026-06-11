import { LayoutGroup, motion } from 'framer-motion'
import type { MeldType } from '@/core/score/types'
import { tileName } from '@/core/tiles/tileNames'
import { TileSvg } from '@/components/tiles/TileSvg'
import type { CalculatorState } from './calculatorState'
import { concealedCapacity, sortedConcealed } from './calculatorState'

const MELD_LABELS: Readonly<Record<MeldType, string>> = {
  chi: 'チー',
  pon: 'ポン',
  minkan: '明槓',
  ankan: '暗槓',
}

interface HandBuilderProps {
  readonly state: CalculatorState
  readonly onRemoveTile: (index: number) => void
  readonly onSetWinTile: (index: number) => void
  readonly onRemoveMeld: (index: number) => void
}

export function HandBuilder({
  state,
  onRemoveTile,
  onSetWinTile,
  onRemoveMeld,
}: HandBuilderProps) {
  const capacity = concealedCapacity(state)
  const sorted = sortedConcealed(state)
  const emptySlots = Math.max(0, capacity - state.concealed.length)

  return (
    <div className="felt-surface hairline rounded-2xl p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-text-secondary">
          手牌 {state.concealed.length}/{capacity}枚
          {state.winTileIndex !== null
            ? `（和了牌: ${tileName(
                state.concealed[state.winTileIndex]?.tile ?? 'm1',
                state.concealed[state.winTileIndex]?.isRed ?? false,
              )}）`
            : ''}
        </span>
        <span className="text-xs text-text-disabled">
          クリックで和了牌に指定 / ダブルクリックで削除
        </span>
      </div>
      <LayoutGroup>
        <div className="flex flex-wrap items-end gap-1.5">
          {sorted.map(({ picked, originalIndex }) => {
            const isWin = originalIndex === state.winTileIndex
            return (
              <motion.button
                key={`${picked.tile}-${originalIndex}`}
                layout
                type="button"
                aria-label={`${tileName(picked.tile, picked.isRed)}${isWin ? '（和了牌）' : ''}`}
                className={`relative rounded-[7px] ${isWin ? 'glow-gold -translate-y-2' : ''}`}
                onClick={() => onSetWinTile(originalIndex)}
                onDoubleClick={() => onRemoveTile(originalIndex)}
                whileHover={{ y: isWin ? -8 : -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                <TileSvg
                  tile={picked.tile}
                  isRed={picked.isRed}
                  size="md"
                  className="block drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                />
              </motion.button>
            )
          })}
          {Array.from({ length: emptySlots }, (_, i) => (
            <div
              key={`empty-${i}`}
              className="h-[67px] w-[48px] rounded-[7px] border border-dashed border-gold-line"
              aria-hidden
            />
          ))}
          {state.melds.map((meld, meldIndex) => (
            <button
              key={`meld-${meldIndex}`}
              type="button"
              aria-label={`${MELD_LABELS[meld.type]}を削除`}
              className="ml-3 flex flex-col items-center gap-1"
              onDoubleClick={() => onRemoveMeld(meldIndex)}
            >
              <span className="text-[10px] text-text-secondary">
                {MELD_LABELS[meld.type]}
              </span>
              <span className="flex gap-0.5">
                {meld.tiles.map((tile, i) => (
                  <TileSvg
                    key={i}
                    tile={tile}
                    size="sm"
                    faceDown={meld.type === 'ankan' && (i === 0 || i === 3)}
                    className="block drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                  />
                ))}
              </span>
            </button>
          ))}
        </div>
      </LayoutGroup>
    </div>
  )
}
