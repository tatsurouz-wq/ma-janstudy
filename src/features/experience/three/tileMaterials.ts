import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three-stdlib'
import type { FaceKey, TileTextureSet, ThemeColors } from './tileTextures'

export const FRONT_GEOMETRY = new RoundedBoxGeometry(
  0.2,
  0.26,
  0.105,
  3,
  0.018,
)
export const BACK_GEOMETRY = new RoundedBoxGeometry(0.2, 0.26, 0.055, 3, 0.018)
export const FACE_GEOMETRY = new THREE.PlaneGeometry(0.185, 0.245)

export interface TileMaterialSet {
  readonly ivory: THREE.MeshStandardMaterial
  readonly back: THREE.MeshStandardMaterial
  readonly faceFor: (key: FaceKey) => THREE.MeshStandardMaterial
}

export const buildTileMaterials = (
  textures: TileTextureSet,
  colors: ThemeColors,
): TileMaterialSet => {
  const ivory = new THREE.MeshStandardMaterial({
    color: colors.tileFace,
    roughness: 0.34,
  })
  const back = new THREE.MeshStandardMaterial({
    map: textures.back,
    roughness: 0.5,
  })
  const mutableFaceCache = new Map<FaceKey, THREE.MeshStandardMaterial>()
  const faceFor = (key: FaceKey): THREE.MeshStandardMaterial => {
    const cached = mutableFaceCache.get(key)
    if (cached !== undefined) {
      return cached
    }
    const texture = textures.faces.get(key)
    const material = new THREE.MeshStandardMaterial({
      map: texture ?? null,
      roughness: 0.42,
    })
    mutableFaceCache.set(key, material)
    return material
  }
  return { ivory, back, faceFor }
}
