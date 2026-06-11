import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LESSONS } from '@/content/lessons'
import type { QuizCategoryProgress } from '@/state/progressStore'
import { useProgressStore } from '@/state/progressStore'
import { HomePage } from './HomePage'

vi.hoisted(() => {
  const store = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return store.size
    },
    clear: () => {
      store.clear()
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  })
})

const EMPTY_CATEGORY: QuizCategoryProgress = {
  attempts: 0,
  correct: 0,
  wrongIds: [],
}

beforeEach(() => {
  localStorage.clear()
  useProgressStore.setState({
    quiz: { wait: EMPTY_CATEGORY, yaku: EMPTY_CATEGORY, score: EMPTY_CATEGORY },
    completedLessons: [],
    lessonSteps: {},
    practice: { games: 0, wins: 0, bestPoints: 0, bestYakuList: [] },
  })
})

afterEach(cleanup)

const renderHome = () => render(<HomePage />, { wrapper: MemoryRouter })

describe('HomePage', () => {
  it('見出しと5つのモードカードを表示しリンク先が正しい', () => {
    renderHome()
    expect(screen.getByText('ようこそ、雀学へ。')).toBeInTheDocument()
    const modes: readonly (readonly [string, string])[] = [
      ['レッスン', '/lessons'],
      ['クイズ', '/quiz'],
      ['点数計算機', '/calculator'],
      ['ミニ実戦', '/practice'],
      ['3D実戦体験', '/experience'],
    ]
    for (const [title, to] of modes) {
      const link = screen.getByRole('link', { name: new RegExp(title) })
      expect(link).toHaveAttribute('href', to)
    }
  })

  it('進捗がないときは初期状態の実績と最初の章への導線を表示する', () => {
    renderHome()
    expect(screen.getByText(`0/${LESSONS.length}章 修了`)).toBeInTheDocument()
    expect(screen.getByText('まだ挑戦していません')).toBeInTheDocument()
    expect(screen.getByText('いつでも使えます')).toBeInTheDocument()
    expect(screen.getByText('まだ対局していません')).toBeInTheDocument()
    expect(screen.getByText('ここから始める')).toBeInTheDocument()
    expect(screen.getByText(/第1章/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /第1章/ }),
    ).toHaveAttribute('href', '/lessons/lesson-01')
  })

  it('進捗があるときは実績と続きの章への導線を表示する', () => {
    useProgressStore.setState({
      completedLessons: ['lesson-01'],
      quiz: {
        wait: { attempts: 3, correct: 2, wrongIds: [] },
        yaku: { attempts: 1, correct: 1, wrongIds: [] },
        score: EMPTY_CATEGORY,
      },
      practice: { games: 5, wins: 2, bestPoints: 8000, bestYakuList: ['立直'] },
    })
    renderHome()
    expect(screen.getByText(`1/${LESSONS.length}章 修了`)).toBeInTheDocument()
    expect(screen.getByText('正答率 75%')).toBeInTheDocument()
    expect(screen.getByText('5局 2勝')).toBeInTheDocument()
    expect(screen.getByText('続きから学ぶ')).toBeInTheDocument()
    expect(screen.getByText(/第2章/)).toBeInTheDocument()
  })

  it('全章修了すると祝福メッセージを表示する', () => {
    useProgressStore.setState({ completedLessons: LESSONS.map((l) => l.id) })
    renderHome()
    expect(
      screen.getByText('全8章修了おめでとうございます！'),
    ).toBeInTheDocument()
    expect(screen.queryByText('ここから始める')).not.toBeInTheDocument()
    expect(screen.queryByText('続きから学ぶ')).not.toBeInTheDocument()
  })

  it('ギャラリーへのリンクを表示する', () => {
    renderHome()
    expect(
      screen.getByRole('link', { name: '牌ギャラリー（全34種の牌を眺める）' }),
    ).toHaveAttribute('href', '/gallery')
  })
})
