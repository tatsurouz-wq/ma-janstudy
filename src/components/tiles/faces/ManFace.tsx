const KANJI: readonly string[] = [
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
]

interface ManFaceProps {
  readonly rank: number
  readonly isRed: boolean
}

export function ManFace({ rank, isRed }: ManFaceProps) {
  const numberFill = isRed ? 'var(--color-suit-man)' : 'var(--color-tile-ink)'
  return (
    <g>
      <text
        x={30}
        y={26}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-tile)"
        fontSize={27}
        fill={numberFill}
      >
        {KANJI[rank - 1]}
      </text>
      <text
        x={30}
        y={56}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-tile)"
        fontSize={25}
        fill="var(--color-suit-man)"
      >
        萬
      </text>
    </g>
  )
}
