import { useEffect, useRef } from 'react'
import type * as THREE from 'three'
import type { Tile } from '@/core/tiles/tile'
import type { Pose } from '@/core/sim/boardLayout'
import type { TileMaterialSet } from './tileMaterials'
import { BACK_GEOMETRY, FACE_GEOMETRY, FRONT_GEOMETRY } from './tileMaterials'
import { faceKeyFor } from './tileTextures'

interface Tile3DProps {
  readonly tileId: string
  readonly tile: Tile
  readonly isRed: boolean
  readonly initialPose: Pose
  readonly materials: TileMaterialSet
  readonly registerRef: (tileId: string, group: THREE.Group | null) => void
}

export function Tile3D({
  tileId,
  tile,
  isRed,
  initialPose,
  materials,
  registerRef,
}: Tile3DProps) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    registerRef(tileId, groupRef.current)
    return () => registerRef(tileId, null)
  }, [tileId, registerRef])

  return (
    <group
      ref={groupRef}
      position={[initialPose.p[0], initialPose.p[1], initialPose.p[2]]}
      rotation={[initialPose.e[0], initialPose.e[1], initialPose.e[2]]}
    >
      <mesh
        geometry={FRONT_GEOMETRY}
        material={materials.ivory}
        position-z={0.0275}
      />
      <mesh
        geometry={BACK_GEOMETRY}
        material={materials.back}
        position-z={-0.0525}
      />
      <mesh
        geometry={FACE_GEOMETRY}
        material={materials.faceFor(faceKeyFor(tile, isRed))}
        position-z={0.0815}
      />
    </group>
  )
}
