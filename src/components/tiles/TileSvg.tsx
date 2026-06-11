import { useId } from 'react'
import type { Tile } from '@/core/tiles/tile'
import { TileFace } from './TileFace'
import { tileName } from '@/core/tiles/tileNames'

export type TileSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_WIDTH: Readonly<Record<TileSize, number>> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 60,
  xl: 80,
}

interface TileSvgProps {
  readonly tile: Tile
  readonly isRed?: boolean
  readonly size?: TileSize
  readonly faceDown?: boolean
  readonly className?: string
}

function RedCornerMarks() {
  const stroke = 'var(--color-suit-man)'
  const props = {
    fill: 'none',
    stroke,
    strokeWidth: 2,
    strokeLinecap: 'round',
  } as const
  return (
    <g opacity={0.9}>
      <path d="M 5 11 L 5 6 L 10 6" {...props} />
      <path d="M 50 6 L 55 6 L 55 11" {...props} />
      <path d="M 5 65 L 5 70 L 10 70" {...props} />
      <path d="M 50 70 L 55 70 L 55 65" {...props} />
    </g>
  )
}

export function TileSvg({
  tile,
  isRed = false,
  size = 'md',
  faceDown = false,
  className,
}: TileSvgProps) {
  const uid = useId()
  const faceGradId = `tile-face-${uid}`
  const backGradId = `tile-back-${uid}`
  const width = SIZE_WIDTH[size]
  const height = Math.round((width * 84) / 60)
  const label = faceDown ? '裏向きの牌' : tileName(tile, isRed)

  return (
    <svg
      viewBox="0 0 60 84"
      width={width}
      height={height}
      role="img"
      aria-label={label}
      className={className}
    >
      <title>{label}</title>
      <defs>
        <linearGradient id={faceGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-tile-face-top)" />
          <stop offset="100%" stopColor="var(--color-tile-face-bottom)" />
        </linearGradient>
        <linearGradient id={backGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-tile-back-400)" />
          <stop offset="100%" stopColor="var(--color-tile-back-600)" />
        </linearGradient>
      </defs>
      {faceDown ? (
        <g>
          <rect x={0} y={0} width={60} height={84} rx={7} fill={`url(#${backGradId})`} />
          <rect
            x={1}
            y={1}
            width={58}
            height={82}
            rx={6.5}
            fill="none"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={0.8}
          />
          <path
            d="M 30 22 L 44 42 L 30 62 L 16 42 Z"
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={1.4}
          />
        </g>
      ) : (
        <g>
          <rect x={0} y={4} width={60} height={80} rx={7} fill={`url(#${backGradId})`} />
          <rect x={0} y={2} width={60} height={78} rx={7} fill="var(--color-tile-side)" />
          <rect x={0} y={0} width={60} height={76} rx={7} fill={`url(#${faceGradId})`} />
          <rect
            x={2}
            y={1}
            width={56}
            height={3}
            rx={1.5}
            fill="rgba(255,255,255,0.65)"
          />
          <TileFace tile={tile} isRed={isRed} />
          {isRed ? <RedCornerMarks /> : null}
          <rect
            x={0.25}
            y={0.25}
            width={59.5}
            height={75.5}
            rx={7}
            fill="none"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={0.5}
          />
        </g>
      )}
    </svg>
  )
}
