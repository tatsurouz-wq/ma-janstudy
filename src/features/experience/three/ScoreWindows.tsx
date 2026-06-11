import { useEffect, useMemo } from 'react'
import { seatAngle } from '@/core/sim/boardLayout'
import type { SeatId } from '@/core/sim/seatTypes'
import { PanelDisplay } from './PanelDisplay'

interface ScoreWindowsProps {
  readonly scores: readonly [number, number, number, number]
}

function ScoreWindow({
  seat,
  score,
}: {
  readonly seat: SeatId
  readonly score: number
}) {
  const display = useMemo(() => new PanelDisplay(220, 64), [])

  useEffect(() => {
    display.draw(score.toLocaleString(), '#e8b95a', 0.62)
  }, [display, score])

  const angle = seatAngle(seat)
  const distance = 3.94
  const x = Math.sin(angle) * distance
  const z = Math.cos(angle) * distance

  return (
    <mesh
      position={[x, 0.105, z]}
      rotation-x={-Math.PI / 2}
      rotation-z={-angle}
    >
      <planeGeometry args={[0.9, 0.26]} />
      <meshStandardMaterial
        map={display.texture}
        emissiveMap={display.texture}
        emissive="#ffffff"
        emissiveIntensity={0.6}
        roughness={0.4}
      />
    </mesh>
  )
}

export function ScoreWindows({ scores }: ScoreWindowsProps) {
  return (
    <group>
      {([0, 1, 2, 3] as const).map((seat) => (
        <ScoreWindow key={seat} seat={seat} score={scores[seat] ?? 0} />
      ))}
    </group>
  )
}
