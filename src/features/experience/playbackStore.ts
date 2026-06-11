import { create } from 'zustand'

export type PlaybackStatus = 'playing' | 'paused' | 'ended'

export type PlaybackSpeed = 1 | 1.5 | 2

interface PlaybackState {
  readonly status: PlaybackStatus
  readonly speed: PlaybackSpeed
  readonly captionsOn: boolean
  readonly seekTarget: number | null
  readonly timeSec: number
  readonly togglePlay: () => void
  readonly setSpeed: (speed: PlaybackSpeed) => void
  readonly toggleCaptions: () => void
  readonly requestSeek: (t: number) => void
  readonly clearSeek: () => void
  readonly markEnded: () => void
  readonly replay: () => void
  readonly reportTime: (t: number) => void
}

export const usePlaybackStore = create<PlaybackState>()((set) => ({
  status: 'playing',
  speed: 1,
  captionsOn: true,
  seekTarget: null,
  timeSec: 0,
  togglePlay: () =>
    set((state) =>
      state.status === 'ended'
        ? state
        : { status: state.status === 'playing' ? 'paused' : 'playing' },
    ),
  setSpeed: (speed) => set({ speed }),
  toggleCaptions: () => set((state) => ({ captionsOn: !state.captionsOn })),
  requestSeek: (t) => set({ seekTarget: t, status: 'playing' }),
  clearSeek: () => set({ seekTarget: null }),
  markEnded: () => set({ status: 'ended' }),
  replay: () => set({ seekTarget: 0, status: 'playing' }),
  reportTime: (t) =>
    set((state) =>
      Math.abs(state.timeSec - t) >= 0.25 ? { timeSec: t } : state,
    ),
}))

export interface HudFrameState {
  readonly fade: number
  readonly captionIndex: number | null
  readonly calloutText: string | null
  readonly buttonGlow: number
  readonly eventIndex: number
  readonly chapterCardVisible: boolean
}

interface HudState extends HudFrameState {
  readonly update: (next: HudFrameState) => void
}

export const useHudStore = create<HudState>()((set) => ({
  fade: 1,
  captionIndex: null,
  calloutText: null,
  buttonGlow: 0,
  eventIndex: 0,
  chapterCardVisible: false,
  update: (next) =>
    set((state) =>
      state.fade === next.fade &&
      state.captionIndex === next.captionIndex &&
      state.calloutText === next.calloutText &&
      state.buttonGlow === next.buttonGlow &&
      state.eventIndex === next.eventIndex &&
      state.chapterCardVisible === next.chapterCardVisible
        ? state
        : next,
    ),
}))
