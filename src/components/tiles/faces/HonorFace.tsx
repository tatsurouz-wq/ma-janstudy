const HONOR_CHARS: readonly string[] = ['東', '南', '西', '北', '白', '發', '中']

const HONOR_FILLS: readonly string[] = [
  'var(--color-tile-ink)',
  'var(--color-tile-ink)',
  'var(--color-tile-ink)',
  'var(--color-tile-ink)',
  '',
  'var(--color-suit-sou)',
  'var(--color-suit-man)',
]

interface HonorFaceProps {
  readonly rank: number
}

export function HonorFace({ rank }: HonorFaceProps) {
  if (rank === 5) {
    return (
      <rect
        x={10}
        y={10}
        width={40}
        height={56}
        rx={4}
        fill="none"
        stroke="var(--color-suit-pin)"
        strokeWidth={2}
        opacity={0.55}
      />
    )
  }
  return (
    <text
      x={30}
      y={40}
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="var(--font-tile)"
      fontSize={38}
      fill={HONOR_FILLS[rank - 1]}
    >
      {HONOR_CHARS[rank - 1]}
    </text>
  )
}
