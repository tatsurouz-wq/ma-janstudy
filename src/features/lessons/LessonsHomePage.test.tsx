import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LESSONS } from '@/content/lessons'
import { useProgressStore } from '@/state/progressStore'
import { LessonsHomePage } from './LessonsHomePage'

const memoryStorage = vi.hoisted(() => {
  const data = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return data.size
    },
    clear: () => {
      data.clear()
    },
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key)
    },
    setItem: (key, value) => {
      data.set(key, value)
    },
  }
  vi.stubGlobal('localStorage', storage)
  return storage
})

afterEach(cleanup)

const renderPage = () =>
  render(
    <MemoryRouter>
      <LessonsHomePage />
    </MemoryRouter>,
  )

beforeEach(() => {
  memoryStorage.clear()
  useProgressStore.setState({
    completedLessons: [],
    lessonSteps: {},
  })
})

describe('LessonsHomePage', () => {
  it('初期状態では第1章のみ解放され残りはロックされる', () => {
    renderPage()

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(LESSONS.length)
    expect(links[0]).toHaveAttribute('aria-disabled', 'false')
    expect(links[0]).toHaveAttribute('href', '/lessons/lesson-01')
    expect(links[1]).toHaveAttribute('aria-disabled', 'true')

    expect(screen.getByText('未着手')).toBeInTheDocument()
    expect(screen.getAllByText('前章で解放')).toHaveLength(LESSONS.length - 1)
  })

  it('修了した章は修了表示になり次章が解放される', () => {
    useProgressStore.setState({ completedLessons: ['lesson-01'] })
    renderPage()

    expect(screen.getByText('修了')).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('aria-disabled', 'false')
    expect(links[1]).toHaveAttribute('aria-disabled', 'false')
    expect(links[1]).toHaveAttribute('href', '/lessons/lesson-02')
    expect(links[2]).toHaveAttribute('aria-disabled', 'true')

    expect(screen.getByText('未着手')).toBeInTheDocument()
    expect(screen.getAllByText('前章で解放')).toHaveLength(LESSONS.length - 2)
  })

  it('途中まで進めた章はステップ進捗を表示する', () => {
    useProgressStore.setState({
      completedLessons: ['lesson-01'],
      lessonSteps: { 'lesson-02': 2 },
    })
    renderPage()

    const lesson02 = LESSONS[1]
    if (lesson02 === undefined) {
      throw new Error('lesson-02が見つかりません')
    }
    expect(
      screen.getByText(`2/${lesson02.steps.length}`),
    ).toBeInTheDocument()
    expect(screen.queryByText('未着手')).not.toBeInTheDocument()
  })

  it('全章のタイトルと目標を表示する', () => {
    renderPage()

    for (const lesson of LESSONS) {
      expect(screen.getByText(lesson.title)).toBeInTheDocument()
      expect(screen.getByText(lesson.goal)).toBeInTheDocument()
    }
  })
})
