import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS, STORAGE_VERSION } from './storageKeys'

export type AssistLevel = 'full' | 'half' | 'none'

interface SettingsState {
  readonly assistLevel: AssistLevel
  readonly setAssistLevel: (level: AssistLevel) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      assistLevel: 'full',
      setAssistLevel: (assistLevel) => set({ assistLevel }),
    }),
    { name: STORAGE_KEYS.settings, version: STORAGE_VERSION },
  ),
)
