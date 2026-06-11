import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { useProgressStore } from '@/state/progressStore'
import { LessonPage } from './LessonPage'

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

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lessons" element={<p>章一覧ページ</p>} />
        <Route path="/lessons/:lessonId" element={<LessonPage />} />
      </Routes>
    </MemoryRouter>,
  )

const nextButton = () => screen.getByRole('button', { name: /次へ/ })
const prevButton = () => screen.getByRole('button', { name: /前へ/ })

const tap = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: label }))

const tapZone = (pattern: RegExp) =>
  fireEvent.click(screen.getByRole('button', { name: pattern }))

const SORT_PLACEMENTS: readonly (readonly [string, RegExp])[] = [
  ['三萬', /萬子/],
  ['七萬', /萬子/],
  ['二筒', /筒子/],
  ['八筒', /筒子/],
  ['一索', /索子/],
  ['五索', /索子/],
  ['東', /字牌/],
  ['發', /字牌/],
]

beforeEach(() => {
  memoryStorage.clear()
  useProgressStore.setState({
    completedLessons: [],
    lessonSteps: {},
  })
})

describe('LessonPage', () => {
  it('存在しないレッスンIDでは見つからない旨を表示する', () => {
    renderAt('/lessons/unknown')
    expect(screen.getByText('レッスンが見つかりません。')).toBeInTheDocument()
  })

  it('textステップでは次へが最初から活性で前へは無効', () => {
    renderAt('/lessons/lesson-01')

    expect(
      screen.getByRole('heading', { name: '第1章 牌を知る' }),
    ).toBeInTheDocument()
    expect(screen.getByText('ステップ 1 / 5')).toBeInTheDocument()
    expect(nextButton()).toBeEnabled()
    expect(prevButton()).toBeDisabled()
  })

  it('インタラクティブステップでは完了するまで次へが無効で前へで戻れる', () => {
    renderAt('/lessons/lesson-01')

    fireEvent.click(nextButton())
    expect(screen.getByText('ステップ 2 / 5')).toBeInTheDocument()
    expect(nextButton()).toBeDisabled()

    fireEvent.click(prevButton())
    expect(screen.getByText('ステップ 1 / 5')).toBeInTheDocument()
    expect(nextButton()).toBeEnabled()
  })

  it('全ステップを完了すると修了画面になり進捗が記録される', async () => {
    renderAt('/lessons/lesson-01')

    fireEvent.click(nextButton())

    for (const [label, zone] of SORT_PLACEMENTS) {
      tap(label)
      tapZone(zone)
    }
    expect(nextButton()).toBeEnabled()
    fireEvent.click(nextButton())
    expect(useProgressStore.getState().lessonSteps['lesson-01']).toBe(2)

    expect(screen.getByText('ステップ 3 / 5')).toBeInTheDocument()
    fireEvent.click(nextButton())

    expect(screen.getByText('ステップ 4 / 5')).toBeInTheDocument()
    expect(nextButton()).toBeDisabled()
    tap('九萬')
    tap('一索')
    tap('東')
    tap('發')
    tap('確認する')
    expect(nextButton()).toBeEnabled()
    fireEvent.click(nextButton())

    expect(screen.getByText('ステップ 5 / 5')).toBeInTheDocument()
    const finish = screen.getByRole('button', { name: '章を修了する' })
    expect(finish).toBeDisabled()
    tap('索子の1（イーソー）')
    expect(finish).toBeEnabled()
    fireEvent.click(finish)

    expect(screen.getByText('修了認定')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '章一覧へ' })).toBeInTheDocument()
    const state = useProgressStore.getState()
    expect(state.completedLessons).toContain('lesson-01')
    expect(state.lessonSteps['lesson-01']).toBe(5)

    fireEvent.click(screen.getByRole('button', { name: '第2章へ進む' }))
    expect(
      await screen.findByRole('heading', { name: /第2章/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('ステップ 1 / 6')).toBeInTheDocument()
  })
})
