import { SOU_LAYOUTS, SUIT_COLOR_VAR } from '../tileFaceData'
import { SouOneBird } from './SouOneBird'

interface SouFaceProps {
  readonly rank: number
}

function BambooStick({
  x,
  y,
  fill,
  scale = 1,
  rotate = 0,
}: {
  readonly x: number
  readonly y: number
  readonly fill: string
  readonly scale?: number
  readonly rotate?: number
}) {
  const w = 8.5 * scale
  const h = 24 * scale
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(1)`}>
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={w / 2}
        fill={fill}
      />
      <rect
        x={-w / 2}
        y={-1.4 * scale}
        width={w}
        height={2.8 * scale}
        fill="var(--color-tile-face)"
        opacity={0.85}
      />
      <circle cx={0} cy={-h / 2 + 2.6 * scale} r={1.1 * scale} fill="var(--color-tile-face)" opacity={0.7} />
      <circle cx={0} cy={h / 2 - 2.6 * scale} r={1.1 * scale} fill="var(--color-tile-face)" opacity={0.7} />
    </g>
  )
}

export function SouFace({ rank }: SouFaceProps) {
  if (rank === 1) {
    return <SouOneBird />
  }
  const sticks = SOU_LAYOUTS[rank] ?? []
  return (
    <g>
      {sticks.map((stick, i) => (
        <BambooStick
          key={i}
          x={stick.x}
          y={stick.y}
          fill={SUIT_COLOR_VAR[stick.color]}
          scale={stick.scale}
          rotate={stick.rotate}
        />
      ))}
    </g>
  )
}
