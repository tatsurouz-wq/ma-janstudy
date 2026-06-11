import type { CaptionClip, Timeline } from '../timeline/timelineTypes'
import { TileSvg } from '@/components/tiles/TileSvg'
import { useHudStore, usePlaybackStore } from '../playbackStore'
import { useMemo } from 'react'

export function CaptionOverlay({ timeline }: { readonly timeline: Timeline }) {
  const captionIndex = useHudStore((s) => s.captionIndex)
  const captionsOn = usePlaybackStore((s) => s.captionsOn)
  const captions = useMemo(
    () =>
      timeline.clips.filter(
        (c): c is CaptionClip => c.track === 'caption',
      ),
    [timeline],
  )

  if (!captionsOn || captionIndex === null) {
    return null
  }
  const caption = captions[captionIndex]
  if (caption === undefined) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[12%] z-20 flex justify-center px-4">
      <p
        className="hairline max-w-2xl rounded-xl bg-ink-950/75 px-5 py-3 text-center text-[1.0625rem] leading-relaxed backdrop-blur-sm"
        aria-live="polite"
      >
        {caption.segments.map((segment, i) =>
          segment.kind === 'tile' ? (
            <span
              key={i}
              className="mx-0.5 inline-block translate-y-1 align-baseline"
            >
              <TileSvg tile={segment.tile} size="xs" />
            </span>
          ) : (
            <span
              key={i}
              className={
                segment.kind === 'emphasis'
                  ? 'font-bold text-gold-300'
                  : 'text-text-primary'
              }
            >
              {segment.text}
            </span>
          ),
        )}
      </p>
    </div>
  )
}
