import { PIN_LAYOUTS, SUIT_COLOR_VAR } from '../tileFaceData'

interface PinFaceProps {
  readonly rank: number
}

function PinDotShape({
  x,
  y,
  r,
  fill,
}: {
  readonly x: number
  readonly y: number
  readonly r: number
  readonly fill: string
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={fill}
        strokeWidth={r * 0.28}
      />
      <circle cx={x} cy={y} r={r * 0.45} fill={fill} />
    </g>
  )
}

function PinOne() {
  const petals = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4
    return {
      x: 30 + 6.5 * Math.cos(angle),
      y: 40 + 6.5 * Math.sin(angle),
    }
  })
  return (
    <g>
      <circle
        cx={30}
        cy={40}
        r={16}
        fill="none"
        stroke={SUIT_COLOR_VAR.pin}
        strokeWidth={3.5}
      />
      <circle
        cx={30}
        cy={40}
        r={10.5}
        fill="none"
        stroke={SUIT_COLOR_VAR.man}
        strokeWidth={1.6}
      />
      {petals.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.4} fill={SUIT_COLOR_VAR.sou} />
      ))}
      <circle cx={30} cy={40} r={2.6} fill={SUIT_COLOR_VAR.man} />
    </g>
  )
}

export function PinFace({ rank }: PinFaceProps) {
  if (rank === 1) {
    return <PinOne />
  }
  const dots = PIN_LAYOUTS[rank] ?? []
  return (
    <g>
      {dots.map((dot, i) => (
        <PinDotShape
          key={i}
          x={dot.x}
          y={dot.y}
          r={dot.r}
          fill={SUIT_COLOR_VAR[dot.color]}
        />
      ))}
    </g>
  )
}
