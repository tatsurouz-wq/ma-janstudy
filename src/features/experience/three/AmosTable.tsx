import { useMemo } from 'react'
import * as THREE from 'three'

const roundedRectPath = (
  target: THREE.Shape | THREE.Path,
  size: number,
  radius: number,
): void => {
  const half = size / 2
  const mutablePath = target
  mutablePath.moveTo(-half + radius, -half)
  mutablePath.lineTo(half - radius, -half)
  mutablePath.quadraticCurveTo(half, -half, half, -half + radius)
  mutablePath.lineTo(half, half - radius)
  mutablePath.quadraticCurveTo(half, half, half - radius, half)
  mutablePath.lineTo(-half + radius, half)
  mutablePath.quadraticCurveTo(-half, half, -half, half - radius)
  mutablePath.lineTo(-half, -half + radius)
  mutablePath.quadraticCurveTo(-half, -half, -half + radius, -half)
}

const buildFrameGeometry = (): THREE.ExtrudeGeometry => {
  const mutableShape = new THREE.Shape()
  roundedRectPath(mutableShape, 8.8, 0.6)
  const mutableHole = new THREE.Path()
  roundedRectPath(mutableHole, 7.6, 0.3)
  mutableShape.holes.push(mutableHole)
  const mutableGeometry = new THREE.ExtrudeGeometry(mutableShape, {
    depth: 0.62,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  })
  mutableGeometry.rotateX(-Math.PI / 2)
  mutableGeometry.translate(0, -0.55, 0)
    return mutableGeometry
}

const buildFeltGeometry = (): THREE.ShapeGeometry => {
  const mutableShape = new THREE.Shape()
  roundedRectPath(mutableShape, 7.64, 0.3)
  const mutableHole = new THREE.Path()
  roundedRectPath(mutableHole, 2.0, 0.1)
  mutableShape.holes.push(mutableHole)
  const mutableGeometry = new THREE.ShapeGeometry(mutableShape, 12)
  mutableGeometry.rotateX(-Math.PI / 2)
    return mutableGeometry
}

const buildFeltTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  const mutableCanvas = canvas
  mutableCanvas.width = 512
  mutableCanvas.height = 512
  const mutableCtx = canvas.getContext('2d')
  if (mutableCtx !== null) {
    const gradient = mutableCtx.createRadialGradient(256, 200, 60, 256, 256, 360)
    gradient.addColorStop(0, '#1e4434')
    gradient.addColorStop(0.55, '#163828')
    gradient.addColorStop(1, '#102a20')
    mutableCtx.fillStyle = gradient
    mutableCtx.fillRect(0, 0, 512, 512)
  }
  const texture = new THREE.CanvasTexture(canvas)
  const mutableTexture = texture
  mutableTexture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function AmosTable() {
  const frameGeometry = useMemo(() => buildFrameGeometry(), [])
  const feltGeometry = useMemo(() => buildFeltGeometry(), [])
  const feltTexture = useMemo(() => buildFeltTexture(), [])

  return (
    <group>
      <mesh geometry={frameGeometry}>
        <meshStandardMaterial color="#171210" roughness={0.32} metalness={0.15} />
      </mesh>
      <mesh geometry={feltGeometry} position-y={-0.002} receiveShadow>
        <meshStandardMaterial map={feltTexture} roughness={0.95} />
      </mesh>
      <mesh position={[0, -2.2, 0]}>
        <cylinderGeometry args={[0.9, 1.1, 3.4, 24]} />
        <meshStandardMaterial color="#15110e" roughness={0.5} />
      </mesh>
      <mesh position={[0, -3.9, 0]}>
        <cylinderGeometry args={[2.4, 2.6, 0.25, 32]} />
        <meshStandardMaterial color="#171210" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.075, 4.32]} rotation-x={-0.12}>
        <boxGeometry args={[8.6, 0.04, 0.5]} />
        <meshStandardMaterial color="#c9a24b" roughness={0.35} metalness={0.6} opacity={0.35} transparent />
      </mesh>
    </group>
  )
}
