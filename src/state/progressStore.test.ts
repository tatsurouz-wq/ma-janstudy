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

import { useProgressStore } from './progressStore'
import { STORAGE_KEYS } from './storageKeys'

const resetStore = () => {
  memoryStorage.clear()
  useProgressStore.setState({
    quiz: {
      wait: { attempts: 0, correct: 0, wrongIds: [] },
      yaku: { attempts: 0, correct: 0, wrongIds: [] },
      score: { attempts: 0, correct: 0, wrongIds: [] },
    },
    completedLessons: [],
    lessonSteps: {},
    practice: { games: 0, wins: 0, bestPoints: 0, bestYakuList: [] },
  })
}

beforeEach(resetStore)

describe('recordQuizAnswer', () => {
  it('不正解で attempts が増え wrongIds に追加される', () => {
    useProgressStore.getState().recordQuizAnswer('wait', 'q1', false)
    const progress = useProgressStore.getState().quiz.wait
    expect(progress.attempts).toBe(1)
    expect(progress.correct).toBe(0)
    expect(progress.wrongIds).toEqual(['q1'])
  })

  it('同じ問題を再度間違えても wrongIds は重複しない', () => {
    useProgressStore.getState().recordQuizAnswer('wait', 'q1', false)
    useProgressStore.getState().recordQuizAnswer('wait', 'q1', false)
    const progress = useProgressStore.getState().quiz.wait
    expect(progress.attempts).toBe(2)
    expect(progress.wrongIds).toEqual(['q1'])
  })

  it('正解すると correct が増え wrongIds から取り除かれる', () => {
    useProgressStore.getState().recordQuizAnswer('yaku', 'q9', false)
    useProgressStore.getState().recordQuizAnswer('yaku', 'q9', true)
    const progress = useProgressStore.getState().quiz.yaku
    expect(progress.attempts).toBe(2)
    expect(progress.correct).toBe(1)
    expect(progress.wrongIds).toEqual([])
  })

  it('カテゴリごとに独立して記録される', () => {
    useProgressStore.getState().recordQuizAnswer('score', 's1', true)
    const state = useProgressStore.getState()
    expect(state.quiz.score.attempts).toBe(1)
    expect(state.quiz.wait.attempts).toBe(0)
    expect(state.quiz.yaku.attempts).toBe(0)
  })

  it('localStorage に永続化される', () => {
    useProgressStore.getState().recordQuizAnswer('wait', 'q1', true)
    const raw = memoryStorage.getItem(STORAGE_KEYS.progress)
    expect(raw).not.toBeNull()
    expect(raw).toContain('"attempts":1')
  })
})

describe('recordLessonStep', () => {
  it('より大きいステップで更新される', () => {
    useProgressStore.getState().recordLessonStep('lesson01', 2)
    useProgressStore.getState().recordLessonStep('lesson01', 5)
    expect(useProgressStore.getState().lessonSteps['lesson01']).toBe(5)
  })

  it('小さいステップでは巻き戻らない', () => {
    useProgressStore.getState().recordLessonStep('lesson01', 5)
    useProgressStore.getState().recordLessonStep('lesson01', 1)
    expect(useProgressStore.getState().lessonSteps['lesson01']).toBe(5)
  })
})

describe('completeLesson', () => {
  it('レッスン完了を記録する', () => {
    useProgressStore.getState().completeLesson('lesson01')
    expect(useProgressStore.getState().completedLessons).toEqual(['lesson01'])
  })

  it('同じレッスンを二度完了しても重複しない', () => {
    useProgressStore.getState().completeLesson('lesson01')
    useProgressStore.getState().completeLesson('lesson02')
    useProgressStore.getState().completeLesson('lesson01')
    expect(useProgressStore.getState().completedLessons).toEqual([
      'lesson01',
      'lesson02',
    ])
  })
})

describe('recordPracticeResult', () => {
  it('勝利で games と wins が増え bestPoints が更新される', () => {
    useProgressStore.getState().recordPracticeResult(true, 8000, ['立直'])
    const practice = useProgressStore.getState().practice
    expect(practice.games).toBe(1)
    expect(practice.wins).toBe(1)
    expect(practice.bestPoints).toBe(8000)
    expect(practice.bestYakuList).toEqual(['立直'])
  })

  it('より低い点数では bestPoints と bestYakuList を更新しない', () => {
    useProgressStore.getState().recordPracticeResult(true, 8000, ['立直'])
    useProgressStore.getState().recordPracticeResult(true, 2000, ['断么九'])
    const practice = useProgressStore.getState().practice
    expect(practice.games).toBe(2)
    expect(practice.bestPoints).toBe(8000)
    expect(practice.bestYakuList).toEqual(['立直'])
  })

  it('同点では bestYakuList を置き換えない', () => {
    useProgressStore.getState().recordPracticeResult(true, 8000, ['立直'])
    useProgressStore.getState().recordPracticeResult(true, 8000, ['断么九'])
    expect(useProgressStore.getState().practice.bestYakuList).toEqual(['立直'])
  })

  it('より高い点数で bestYakuList が置き換わる', () => {
    useProgressStore.getState().recordPracticeResult(true, 2000, ['断么九'])
    useProgressStore.getState().recordPracticeResult(true, 12000, ['立直', '一発'])
    const practice = useProgressStore.getState().practice
    expect(practice.bestPoints).toBe(12000)
    expect(practice.bestYakuList).toEqual(['立直', '一発'])
  })

  it('敗北では wins が増えない', () => {
    useProgressStore.getState().recordPracticeResult(false, 0, [])
    const practice = useProgressStore.getState().practice
    expect(practice.games).toBe(1)
    expect(practice.wins).toBe(0)
    expect(practice.bestPoints).toBe(0)
  })
})
