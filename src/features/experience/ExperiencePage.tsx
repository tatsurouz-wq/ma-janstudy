import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { HalfGameScenario } from '@/core/sim/halfGameSim'
import { generateHalfGame, SHOWCASE_SEED } from '@/core/sim/halfGameSim'
import type { Timeline } from './timeline/timelineTypes'
import { compileTimeline } from './timeline/compileTimeline'
import { usePlaybackStore } from './playbackStore'
import { CaptionOverlay } from './ui/CaptionOverlay'
import { PlayerHud } from './ui/PlayerHud'
import { isWebGL2Supported } from './webglSupport'

const ExperienceCanvas = lazy(() => import('./three/ExperienceCanvas'))

interface LoadedExperience {
  readonly scenario: HalfGameScenario
  readonly timeline: Timeline
}

function CanvasLoading({ label }: { readonly label: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p
        className="font-mincho animate-pulse text-lg tracking-widest text-gold-300"
        aria-live="polite"
      >
        {label}
      </p>
    </div>
  )
}

function WebGLFallback() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-mincho text-xl text-gold-300">
        3D体験を表示できません
      </p>
      <p className="max-w-md text-sm leading-relaxed text-text-secondary">
        この環境はWebGL2に対応していないため、3D実戦体験モードを利用できません。
        最新のChrome・Edge・Safari・Firefoxでお試しください。
      </p>
      <Link
        to="/practice"
        className="mt-2 rounded-xl bg-gold-500 px-6 py-2 text-sm font-medium text-ink-950 hover:brightness-110"
      >
        2Dのミニ実戦で練習する
      </Link>
    </div>
  )
}

export function ExperiencePage() {
  const webglSupported = useMemo(() => isWebGL2Supported(), [])
  const [loaded, setLoaded] = useState<LoadedExperience | null>(null)
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useEffect(() => {
    if (!webglSupported) {
      return
    }
    const timer = window.setTimeout(() => {
      const scenario = generateHalfGame(SHOWCASE_SEED)
      const timeline = compileTimeline(scenario, { reducedMotion })
      setLoaded({ scenario, timeline })
    }, 30)
    return () => window.clearTimeout(timer)
  }, [webglSupported, reducedMotion])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const store = usePlaybackStore.getState()
      if (loaded === null) {
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        store.togglePlay()
        return
      }
      const chapters = loaded.timeline.chapters
      const currentIndex = chapters.reduce(
        (acc, chapter, i) => (chapter.t <= store.timeSec + 0.01 ? i : acc),
        0,
      )
      if (event.code === 'ArrowRight') {
        const next = chapters[Math.min(currentIndex + 1, chapters.length - 1)]
        if (next !== undefined) {
          store.requestSeek(next.t)
        }
      } else if (event.code === 'ArrowLeft') {
        const prev = chapters[Math.max(currentIndex - 1, 0)]
        if (prev !== undefined) {
          store.requestSeek(prev.t)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [loaded])

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-ink-950"
      data-testid="experience-page"
    >
      {!webglSupported ? (
        <WebGLFallback />
      ) : loaded === null ? (
        <CanvasLoading label="卓を準備しています…" />
      ) : (
        <>
          <Suspense fallback={<CanvasLoading label="卓を準備しています…" />}>
            <ExperienceCanvas
              scenario={loaded.scenario}
              timeline={loaded.timeline}
            />
          </Suspense>
          <CaptionOverlay timeline={loaded.timeline} />
          <PlayerHud scenario={loaded.scenario} timeline={loaded.timeline} />
        </>
      )}
      <Link
        to="/"
        className="hairline absolute top-4 left-4 z-20 rounded-lg bg-surface-800/80 px-4 py-1.5 text-sm text-text-secondary backdrop-blur-sm transition-colors hover:text-gold-300"
      >
        ◂ 雀学へ戻る
      </Link>
    </div>
  )
}

export default ExperiencePage
