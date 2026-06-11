import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import type { HalfGameScenario } from '@/core/sim/halfGameSim'
import { SEAT_LABELS } from '@/core/sim/seatTypes'
import { boardAt } from '@/core/sim/scenarioEvents'
import { TileSvg } from '@/components/tiles/TileSvg'
import type { Timeline } from '../timeline/timelineTypes'
import type { PlaybackSpeed } from '../playbackStore'
import { useHudStore, usePlaybackStore } from '../playbackStore'

const SPEEDS: readonly PlaybackSpeed[] = [1, 1.5, 2]

interface PlayerHudProps {
  readonly scenario: HalfGameScenario
  readonly timeline: Timeline
}

export function PlayerHud({ scenario, timeline }: PlayerHudProps) {
  const status = usePlaybackStore((s) => s.status)
  const speed = usePlaybackStore((s) => s.speed)
  const captionsOn = usePlaybackStore((s) => s.captionsOn)
  const timeSec = usePlaybackStore((s) => s.timeSec)
  const togglePlay = usePlaybackStore((s) => s.togglePlay)
  const setSpeed = usePlaybackStore((s) => s.setSpeed)
  const toggleCaptions = usePlaybackStore((s) => s.toggleCaptions)
  const requestSeek = usePlaybackStore((s) => s.requestSeek)
  const replay = usePlaybackStore((s) => s.replay)
  const eventIndex = useHudStore((s) => s.eventIndex)
  const fade = useHudStore((s) => s.fade)
  const calloutText = useHudStore((s) => s.calloutText)
  const chapterCardVisible = useHudStore((s) => s.chapterCardVisible)
  const [chapterMenuOpen, setChapterMenuOpen] = useState(false)

  const board = useMemo(
    () => boardAt(scenario.events, eventIndex + 1),
    [scenario, eventIndex],
  )

  const doraTile = useMemo(() => {
    for (const placed of board.tiles.values()) {
      if (placed.zone.kind === 'deadWall' && placed.zone.faceUp) {
        return placed.tile
      }
    }
    return null
  }, [board])

  const roundLabel = `${board.display.round === 1 ? '東' : '南'}${board.display.kyoku}局${
    board.honba > 0 ? ` ${board.honba}本場` : ''
  }`
  const progress = Math.min(1, timeSec / Math.max(timeline.duration, 1))

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-30 bg-black transition-opacity duration-200"
        style={{ opacity: fade }}
      />

      {calloutText !== null ? (
        <motion.p
          key={calloutText}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-mincho pointer-events-none absolute inset-x-0 top-[30%] z-20 text-center text-6xl font-bold tracking-widest text-gold-300 drop-shadow-[0_4px_16px_rgba(201,162,75,0.5)]"
        >
          {calloutText}
        </motion.p>
      ) : null}

      {chapterCardVisible ? (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mincho pointer-events-none absolute inset-x-0 top-[42%] z-20 text-center text-4xl font-bold tracking-[0.3em] text-gold-300"
        >
          {roundLabel}
        </motion.p>
      ) : null}

      <div className="hairline absolute top-4 right-4 z-20 flex items-center gap-4 rounded-xl bg-surface-800/80 px-4 py-2 text-sm backdrop-blur-sm">
        <span className="font-mincho text-gold-300">{roundLabel}</span>
        {doraTile !== null ? (
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            ドラ表示
            <TileSvg tile={doraTile.tile} isRed={doraTile.isRed} size="xs" />
          </span>
        ) : null}
        <span className="flex gap-3 text-xs tabular-nums">
          {([0, 1, 2, 3] as const).map((seat) => (
            <span
              key={seat}
              className={
                seat === scenario.userSeat
                  ? 'font-bold text-gold-300'
                  : 'text-text-secondary'
              }
            >
              {SEAT_LABELS[seat]} {(board.scores[seat] ?? 0).toLocaleString()}
              {board.riichiDeclared[seat] === true ? (
                <span className="ml-1 text-lacquer-600">リ</span>
              ) : null}
            </span>
          ))}
        </span>
      </div>

      {status === 'ended' ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75">
          <div className="hairline w-full max-w-md space-y-5 rounded-2xl bg-surface-800 p-8">
            <h2 className="font-mincho text-center text-2xl font-bold tracking-widest text-gold-300">
              対局結果
            </h2>
            <ol className="space-y-2">
              {scenario.ranking.map((entry) => (
                <li
                  key={entry.seat}
                  className={`flex items-center justify-between rounded-lg px-4 py-2 ${
                    entry.seat === scenario.userSeat
                      ? 'glow-gold bg-surface-700'
                      : 'bg-surface-700/50'
                  }`}
                >
                  <span className="font-mincho text-gold-300">
                    {entry.rank}位 {SEAT_LABELS[entry.seat]}
                  </span>
                  <span className="font-bold tabular-nums">
                    {entry.score.toLocaleString()}点
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={replay}
                className="rounded-xl bg-gold-500 px-6 py-2 text-sm font-medium text-ink-950 hover:brightness-110"
              >
                もう一度見る
              </button>
              <Link
                to="/"
                className="rounded-xl border border-gold-line px-6 py-2 text-sm text-text-secondary hover:bg-surface-700"
              >
                雀学へ戻る
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-4">
        <div className="relative mx-auto mb-2 h-1.5 max-w-3xl rounded-full bg-surface-700/80">
          <div
            className="h-full rounded-full bg-gold-500"
            style={{ width: `${progress * 100}%` }}
          />
          {timeline.chapters.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              title={chapter.label}
              aria-label={`チャプター: ${chapter.label}`}
              onClick={() => requestSeek(chapter.t)}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-500 bg-ink-950 transition-transform hover:scale-150"
              style={{
                left: `${(chapter.t / Math.max(timeline.duration, 1)) * 100}%`,
              }}
            />
          ))}
        </div>
        <div className="hairline mx-auto flex max-w-3xl items-center justify-between rounded-xl bg-surface-800/85 px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={status === 'playing' ? '一時停止' : '再生'}
              className="rounded-lg bg-gold-500 px-4 py-1.5 text-sm font-bold text-ink-950 hover:brightness-110"
            >
              {status === 'playing' ? '⏸ 一時停止' : '▶ 再生'}
            </button>
            <button
              type="button"
              onClick={() => {
                const index = SPEEDS.indexOf(speed)
                setSpeed(SPEEDS[(index + 1) % SPEEDS.length] ?? 1)
              }}
              className="rounded-lg border border-gold-line px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-700"
            >
              {speed}x
            </button>
            <button
              type="button"
              onClick={toggleCaptions}
              aria-pressed={captionsOn}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                captionsOn
                  ? 'border-gold-500 text-gold-300'
                  : 'border-gold-line text-text-disabled'
              }`}
            >
              字幕
            </button>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setChapterMenuOpen((open) => !open)}
              aria-expanded={chapterMenuOpen}
              className="rounded-lg border border-gold-line px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-700"
            >
              チャプター ▾
            </button>
            {chapterMenuOpen ? (
              <ul className="hairline absolute right-0 bottom-full mb-2 w-44 overflow-hidden rounded-xl bg-surface-800/95 backdrop-blur-sm">
                {timeline.chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <button
                      type="button"
                      onClick={() => {
                        requestSeek(chapter.t)
                        setChapterMenuOpen(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-700 hover:text-gold-300"
                    >
                      {chapter.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
