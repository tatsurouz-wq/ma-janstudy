import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type * as THREE from 'three'
import type { HalfGameScenario } from '@/core/sim/halfGameSim'
import { boardAt } from '@/core/sim/scenarioEvents'
import type { Timeline } from '../timeline/timelineTypes'
import { BASE_VIEW } from '../timeline/cameraScript'
import { useHudStore } from '../playbackStore'
import { SceneRoot } from './SceneRoot'
import { AmosTable } from './AmosTable'
import { CenterPanel } from './CenterPanel'
import { ScoreWindows } from './ScoreWindows'
import { TilesLayer } from './TilesLayer'
import { PlaybackDriver } from './PlaybackDriver'
import type { TileMaterialSet } from './tileMaterials'
import { buildTileMaterials } from './tileMaterials'
import { createTileTextures, resolveThemeColors } from './tileTextures'

interface ExperienceCanvasProps {
  readonly scenario: HalfGameScenario
  readonly timeline: Timeline
}

function BoardDisplays({ scenario }: { readonly scenario: HalfGameScenario }) {
  const eventIndex = useHudStore((s) => s.eventIndex)
  const buttonGlow = useHudStore((s) => s.buttonGlow)
  const board = useMemo(
    () => boardAt(scenario.events, eventIndex + 1),
    [scenario, eventIndex],
  )
  const kyokuLabel = `${board.display.round === 1 ? '東' : '南'}${board.display.kyoku}局`
  const diceLabel =
    board.display.dice !== null
      ? `${board.display.dice[0]}・${board.display.dice[1]}`
      : '－・－'
  return (
    <>
      <CenterPanel
        kyokuLabel={kyokuLabel}
        diceLabel={diceLabel}
        buttonGlow={buttonGlow}
      />
      <ScoreWindows scores={board.scores} />
    </>
  )
}

export function ExperienceCanvas({
  scenario,
  timeline,
}: ExperienceCanvasProps) {
  const [materials, setMaterials] = useState<TileMaterialSet | null>(null)
  const mutableTileRefs = useRef(new Map<string, THREE.Group>())
  const tableRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    const mutableFlags = { cancelled: false }
    const load = async () => {
      const colors = resolveThemeColors()
      const textures = await createTileTextures(colors)
      if (!mutableFlags.cancelled) {
        setMaterials(buildTileMaterials(textures, colors))
      }
    }
    void load()
    return () => {
      mutableFlags.cancelled = true
    }
  }, [])

  const registerRef = useCallback(
    (tileId: string, group: THREE.Group | null) => {
      if (group === null) {
        mutableTileRefs.current.delete(tileId)
      } else {
        mutableTileRefs.current.set(tileId, group)
      }
    },
    [],
  )

  const initialPoses = useMemo(() => new Map(), [])

  if (materials === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="font-mincho animate-pulse text-lg tracking-widest text-gold-300">
          牌を磨いています…
        </p>
      </div>
    )
  }

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: [
          BASE_VIEW.position[0],
          BASE_VIEW.position[1],
          BASE_VIEW.position[2],
        ],
        fov: BASE_VIEW.fov,
      }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0b0f0d']} />
      <SceneRoot>
        <group ref={tableRef}>
          <AmosTable />
          <BoardDisplays scenario={scenario} />
        </group>
        <TilesLayer
          materials={materials}
          initialPoses={initialPoses}
          registerRef={registerRef}
        />
        <PlaybackDriver
          timeline={timeline}
          tileRefs={mutableTileRefs}
          tableRef={tableRef}
        />
      </SceneRoot>
    </Canvas>
  )
}

export default ExperienceCanvas
