import { useMemo } from 'react'
import type * as THREE from 'three'
import type { Tile } from '@/core/tiles/tile'
import { ALL_TILES } from '@/core/tiles/tile'
import type { Pose } from '@/core/sim/boardLayout'
import { INSIDE_MACHINE_POSE } from '@/core/sim/boardLayout'
import type { TileMaterialSet } from './tileMaterials'
import { Tile3D } from './Tile3D'

export interface TileIdentity {
  readonly id: string
  readonly tile: Tile
  readonly isRed: boolean
}

export const ALL_TILE_IDENTITIES: readonly TileIdentity[] = ALL_TILES.flatMap(
  (tile) =>
    Array.from({ length: 4 }, (_, copy) => ({
      id: `${tile}-${copy}`,
      tile,
      isRed: (tile === 'm5' || tile === 'p5' || tile === 's5') && copy === 0,
    })),
)

interface TilesLayerProps {
  readonly materials: TileMaterialSet
  readonly initialPoses: ReadonlyMap<string, Pose>
  readonly registerRef: (tileId: string, group: THREE.Group | null) => void
}

export function TilesLayer({
  materials,
  initialPoses,
  registerRef,
}: TilesLayerProps) {
  const identities = useMemo(() => ALL_TILE_IDENTITIES, [])
  return (
    <group>
      {identities.map((identity) => (
        <Tile3D
          key={identity.id}
          tileId={identity.id}
          tile={identity.tile}
          isRed={identity.isRed}
          initialPose={initialPoses.get(identity.id) ?? INSIDE_MACHINE_POSE}
          materials={materials}
          registerRef={registerRef}
        />
      ))}
    </group>
  )
}
