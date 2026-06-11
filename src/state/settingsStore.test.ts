import { beforeEach, describe, expect, it, vi } from 'vitest'

const memoryStorage = vi.hoisted(() => {
  const data = new Map<string, string>()
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    clear: () => {
      data.clear()
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
  return storage
})

import { useSettingsStore } from './settingsStore'
import { STORAGE_KEYS } from './storageKeys'

beforeEach(() => {
  memoryStorage.clear()
  useSettingsStore.setState({ assistLevel: 'full' })
})

describe('settingsStore', () => {
  it('初期値は full', () => {
    expect(useSettingsStore.getState().assistLevel).toBe('full')
  })

  it('setAssistLevel でレベルを変更できる', () => {
    useSettingsStore.getState().setAssistLevel('half')
    expect(useSettingsStore.getState().assistLevel).toBe('half')
    useSettingsStore.getState().setAssistLevel('none')
    expect(useSettingsStore.getState().assistLevel).toBe('none')
  })

  it('変更が localStorage に永続化される', () => {
    useSettingsStore.getState().setAssistLevel('none')
    const raw = memoryStorage.getItem(STORAGE_KEYS.settings)
    expect(raw).not.toBeNull()
    expect(raw).toContain('"assistLevel":"none"')
  })
})
