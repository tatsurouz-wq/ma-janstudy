import type { ReactNode } from 'react'

export function SceneRoot({ children }: { readonly children: ReactNode }) {
  return (
    <group>
      <fog attach="fog" args={['#0b0f0d', 9, 30]} />
      <ambientLight intensity={0.14} />
      <hemisphereLight args={['#102a20', '#0b0f0d', 0.3]} />
      <spotLight
        position={[0, 7.2, 0]}
        angle={0.72}
        penumbra={0.55}
        intensity={140}
        distance={24}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 5.4, 4]} intensity={14} color="#e8c872" />
      <mesh position={[0, 6.7, 0]}>
        <coneGeometry args={[1.1, 0.9, 24, 1, true]} />
        <meshStandardMaterial
          color="#171210"
          emissive="#e8c872"
          emissiveIntensity={0.18}
          side={2}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 6.45, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial
          color="#e8c872"
          emissive="#e8c872"
          emissiveIntensity={2.2}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-4.05} receiveShadow>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color="#14120f" roughness={0.96} />
      </mesh>
      {children}
    </group>
  )
}
