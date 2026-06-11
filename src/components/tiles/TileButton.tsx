import { motion } from 'framer-motion'
import type { Tile } from '@/core/tiles/tile'
import { tileName } from '@/core/tiles/tileNames'
import type { TileSize } from './TileSvg'
import { TileSvg } from './TileSvg'

interface TileButtonProps {
  readonly tile: Tile
  readonly isRed?: boolean
  readonly size?: TileSize
  readonly onClick?: () => void
  readonly disabled?: boolean
  readonly selected?: boolean
  readonly badge?: string
  readonly ariaLabel?: string
}

export function TileButton({
  tile,
  isRed = false,
  size = 'md',
  onClick,
  disabled = false,
  selected = false,
  badge,
  ariaLabel,
}: TileButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? tileName(tile, isRed)}
      aria-pressed={selected}
      className={`relative rounded-[7px] transition-opacity ${
        disabled ? 'opacity-30' : 'cursor-pointer'
      } ${selected ? 'glow-gold' : ''}`}
      whileHover={disabled ? undefined : { y: -4 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <TileSvg
        tile={tile}
        isRed={isRed}
        size={size}
        className="block drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
      />
      {badge !== undefined ? (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-surface-700 px-1 text-[10px] text-text-secondary">
          {badge}
        </span>
      ) : null}
    </motion.button>
  )
}
