import { useEffect, useMemo } from 'react'
import { PanelDisplay } from './PanelDisplay'

interface CenterPanelProps {
  readonly kyokuLabel: string
  readonly diceLabel: string
  readonly buttonGlow: number
}

export function CenterPanel({
  kyokuLabel,
  diceLabel,
  buttonGlow,
}: CenterPanelProps) {
  const kyokuDisplay = useMemo(() => new PanelDisplay(256, 80), [])
  const diceDisplay = useMemo(() => new PanelDisplay(160, 80), [])

  useEffect(() => {
    kyokuDisplay.draw(kyokuLabel)
  }, [kyokuDisplay, kyokuLabel])

  useEffect(() => {
    diceDisplay.draw(diceLabel, '#e8b95a', 0.6)
  }, [diceDisplay, diceLabel])

  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.96, 0.16, 1.96]} />
        <meshStandardMaterial color="#100d0b" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.135, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.05, 24]} />
        <meshStandardMaterial
          color="#c9a24b"
          emissive="#c9a24b"
          emissiveIntensity={0.25 + buttonGlow * 1.6}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      <mesh
        position={[0, 0.131, 0.62]}
        rotation-x={-Math.PI / 2}
      >
        <planeGeometry args={[1.1, 0.34]} />
        <meshStandardMaterial
          map={kyokuDisplay.texture}
          emissiveMap={kyokuDisplay.texture}
          emissive="#ffffff"
          emissiveIntensity={0.65}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.131, -0.58]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.66, 0.33]} />
        <meshStandardMaterial
          map={diceDisplay.texture}
          emissiveMap={diceDisplay.texture}
          emissive="#ffffff"
          emissiveIntensity={0.65}
          roughness={0.4}
        />
      </mesh>
    </group>
  )
}
