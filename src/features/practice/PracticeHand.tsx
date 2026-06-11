import { LayoutGroup, motion } from 'framer-motion'
import type { TileInstance } from '@/core/tiles/tile'
import { tileToIndex } from '@/core/tiles/tile'
import { tileName } from '@/core/tiles/tileNames'
import type { DiscardEvaluation } from '@/core/game/selectors'
import { TileSvg } from '@/components/tiles/TileSvg'

interface PracticeHandProps {
  readonly hand: readonly TileInstance[]
  readonly drawnTile: TileInstance | null
  readonly selectedId: string | null
  readonly riichiSelect: boolean
  readonly evaluations: readonly DiscardEvaluation[]
  readonly showEvaluations: boolean
  readonly onTileTap: (tileId: string) => void
  readonly disabled: boolean
}

export function PracticeHand({
  hand,
  drawnTile,
  selectedId,
  riichiSelect,
  evaluations,
  showEvaluations,
  onTileTap,
  disabled,
}: PracticeHandProps) {
  const sorted = [...hand].sort(
    (a, b) => tileToIndex(a.tile) - tileToIndex(b.tile) || a.id.localeCompare(b.id),
  )
  const evalOf = (id: string) => evaluations.find((e) => e.tileId === id)

  const renderTile = (tile: TileInstance, isDrawn: boolean) => {
    const evaluation = evalOf(tile.id)
    const tenpaiKeep = evaluation?.shantenAfter === 0
    const dimmed = riichiSelect && !tenpaiKeep
    const isSelected = selectedId === tile.id
    return (
      <motion.button
        key={tile.id}
        layout
        type="button"
        disabled={disabled || (riichiSelect && !tenpaiKeep)}
        aria-label={`${tileName(tile.tile, tile.isRed)}を${isSelected ? '捨てる（確定）' : '選ぶ'}`}
        onClick={() => onTileTap(tile.id)}
        className={`relative rounded-[7px] transition-all ${
          isSelected ? 'glow-gold -translate-y-2.5' : ''
        } ${dimmed ? 'opacity-30' : ''} ${isDrawn ? 'ml-4' : ''}`}
        whileHover={disabled ? undefined : { y: -6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <TileSvg
          tile={tile.tile}
          isRed={tile.isRed}
          size="md"
          className="block drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
        />
        {showEvaluations && evaluation !== undefined && isSelected ? (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-surface-700 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-text-secondary">
            切ると{evaluation.shantenAfter === 0 ? 'テンパイ' : `${evaluation.shantenAfter}向聴`}
            ・受け入れ{evaluation.ukeireCount}枚
          </span>
        ) : null}
        {riichiSelect && tenpaiKeep ? (
          <span className="absolute -top-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold-300" />
        ) : null}
      </motion.button>
    )
  }

  return (
    <LayoutGroup>
      <div className="felt-surface hairline flex flex-wrap items-end gap-1.5 rounded-2xl p-5">
        {sorted.map((tile) => renderTile(tile, false))}
        {drawnTile !== null ? renderTile(drawnTile, true) : null}
      </div>
    </LayoutGroup>
  )
}
