import { SUIT_COLOR_VAR } from '../tileFaceData'

export function SouOneBird() {
  return (
    <g>
      <path
        d="M 30 60 C 22 58 18 50 20 42 C 22 34 28 30 33 31 C 40 32 43 39 41 47 C 39 55 35 60 30 60 Z"
        fill={SUIT_COLOR_VAR.sou}
      />
      <path
        d="M 24 38 C 18 30 16 22 22 16 C 24 22 27 26 31 29 Z"
        fill="none"
        stroke={SUIT_COLOR_VAR.man}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d="M 28 36 C 24 28 25 20 31 15 C 31 21 33 26 36 30 Z"
        fill="none"
        stroke={SUIT_COLOR_VAR.sou}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d="M 33 35 C 32 27 35 19 42 16 C 40 22 40 27 41 32 Z"
        fill="none"
        stroke={SUIT_COLOR_VAR.man}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <circle cx={36} cy={34} r={5.2} fill={SUIT_COLOR_VAR.sou} />
      <path d="M 40 32 L 47 34 L 40 37 Z" fill="#D9A53C" />
      <circle cx={37.5} cy={33} r={1.1} fill="var(--color-tile-face)" />
      <path
        d="M 34 42 C 30 40 27 41 25 44 C 28 45 31 45 34 44 Z"
        fill={SUIT_COLOR_VAR.man}
      />
      <path
        d="M 27 60 L 24 68 M 27 60 L 29 68"
        stroke="#D9A53C"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 35 58 L 34 67 M 35 58 L 39 66"
        stroke="#D9A53C"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  )
}
