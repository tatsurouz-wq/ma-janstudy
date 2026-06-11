import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { QuizCategoryProgress } from '@/state/progressStore'
import { useProgressStore } from '@/state/progressStore'
import { QuizHomePage } from './QuizHomePage'

vi.hoisted(() => {
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
})

afterEach(cleanup)

const EMPTY_CATEGORY: QuizCategoryProgress = {
  attempts: 0,
  correct: 0,
  wrongIds: [],
}

beforeEach(() => {
  window.localStorage.clear()
  useProgressStore.setState({
    quiz: { wait: EMPTY_CATEGORY, yaku: EMPTY_CATEGORY, score: EMPTY_CATEGORY },
    completedLessons: [],
    lessonSteps: {},
    practice: { games: 0, wins: 0, bestPoints: 0, bestYakuList: [] },
  })
})

const renderPage = () =>
  render(
    <MemoryRouter>
      <QuizHomePage />
    </MemoryRouter>,
  )

describe('QuizHomePage', () => {
  it('3つのカテゴリカードをリンク付きで表示する', () => {
    renderPage()
    expect(screen.getByText('待ち当て').closest('a')).toHaveAttribute(
      'href',
      '/quiz/wait',
    )
    expect(screen.getByText('役当て').closest('a')).toHaveAttribute(
      'href',
      '/quiz/yaku',
    )
    expect(screen.getByText('点数当て').closest('a')).toHaveAttribute(
      'href',
      '/quiz/score',
    )
  })

  it('未挑戦のカテゴリには未挑戦の文言を表示する', () => {
    renderPage()
    expect(screen.getAllByText(/まだ挑戦していません/)).toHaveLength(3)
    expect(screen.queryByText(/正答率/)).not.toBeInTheDocument()
    expect(screen.queryByText(/復習待ち/)).not.toBeInTheDocument()
  })

  it('挑戦済みカテゴリには正答率と復習待ち数を表示する', () => {
    useProgressStore.setState((state) => ({
      quiz: {
        ...state.quiz,
        wait: { attempts: 4, correct: 3, wrongIds: ['w01', 'w02'] },
      },
    }))
    renderPage()
    expect(
      screen.getByText(/正答率 75%（3\/4問） \/ 復習待ち2問/),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/まだ挑戦していません/)).toHaveLength(2)
  })

  it('復習待ちがない挑戦済みカテゴリは正答率のみ表示する', () => {
    useProgressStore.setState((state) => ({
      quiz: {
        ...state.quiz,
        score: { attempts: 8, correct: 8, wrongIds: [] },
      },
    }))
    renderPage()
    expect(screen.getByText(/正答率 100%（8\/8問）/)).toBeInTheDocument()
    expect(screen.queryByText(/復習待ち/)).not.toBeInTheDocument()
  })
})
