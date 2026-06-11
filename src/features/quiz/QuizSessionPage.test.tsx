import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { Tile } from '@/core/tiles/tile'
import { ALL_TILES, indexToTile } from '@/core/tiles/tile'
import { tileName } from '@/core/tiles/tileNames'
import { parseTiles } from '@/core/tiles/notation'
import type { WaitQuestion } from '@/content/quizzes/types'
import { WAIT_QUESTIONS } from '@/content/quizzes/waitQuestions'
import type { QuizCategoryProgress } from '@/state/progressStore'
import { useProgressStore } from '@/state/progressStore'
import { solveWaits } from './quizEngine'
import { QuizSessionPage } from './QuizSessionPage'

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

const renderSession = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/quiz" element={<p>クイズ一覧スタブ</p>} />
        <Route path="/quiz/:category" element={<QuizSessionPage />} />
        <Route path="/no-category" element={<QuizSessionPage />} />
      </Routes>
    </MemoryRouter>,
  )

const TILE_BY_NAME: ReadonlyMap<string, Tile> = new Map(
  ALL_TILES.map((tile) => [tileName(tile), tile]),
)

const handKey = (tiles: readonly Tile[]): string => [...tiles].sort().join(',')

const readCurrentWaitQuestion = (container: HTMLElement): WaitQuestion => {
  const felt = container.querySelector('.felt-surface')
  if (!(felt instanceof HTMLElement)) {
    throw new Error('手牌表示が見つかりません')
  }
  const tiles = within(felt)
    .getAllByRole('img')
    .map((el) => {
      const tile = TILE_BY_NAME.get(el.getAttribute('aria-label') ?? '')
      if (tile === undefined) {
        throw new Error('未知の牌表示です')
      }
      return tile
    })
  const found = WAIT_QUESTIONS.find(
    (q) => handKey(parseTiles(q.hand)) === handKey(tiles),
  )
  if (found === undefined) {
    throw new Error('出題中の問題を特定できません')
  }
  return found
}

const answerCurrentWaitQuestion = (container: HTMLElement): void => {
  const current = readCurrentWaitQuestion(container)
  for (const waitIndex of solveWaits(current)) {
    fireEvent.click(
      screen.getByRole('button', { name: tileName(indexToTile(waitIndex)) }),
    )
  }
  fireEvent.click(screen.getByRole('button', { name: '決定' }))
}

const completeWaitSession = (container: HTMLElement): void => {
  for (let i = 0; i < 8; i += 1) {
    answerCurrentWaitQuestion(container)
    fireEvent.click(
      screen.getByRole('button', {
        name: i < 7 ? '次の問題へ' : '結果を見る',
      }),
    )
  }
}

describe('QuizSessionPage', () => {
  it('カテゴリなしではクイズが見つからない旨を表示する', () => {
    renderSession('/no-category')
    expect(screen.getByText('クイズが見つかりません。')).toBeInTheDocument()
  })

  it('待ち当てセッションを8問全問正解で完走できる', { timeout: 60000 }, () => {
    const { container } = renderSession('/quiz/wait')
    expect(
      screen.getByRole('heading', { name: '待ち当てクイズ' }),
    ).toBeInTheDocument()
    expect(screen.getByText('問 1 / 8')).toBeInTheDocument()

    answerCurrentWaitQuestion(container)
    expect(screen.getByText('正解')).toBeInTheDocument()
    expect(screen.queryByText('2連続正解中')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '次の問題へ' }))
    expect(screen.getByText('問 2 / 8')).toBeInTheDocument()

    answerCurrentWaitQuestion(container)
    expect(screen.getByText('2連続正解中')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '次の問題へ' }))

    for (let i = 2; i < 8; i += 1) {
      answerCurrentWaitQuestion(container)
      fireEvent.click(
        screen.getByRole('button', {
          name: i < 7 ? '次の問題へ' : '結果を見る',
        }),
      )
    }

    expect(screen.getByText('結果発表')).toBeInTheDocument()
    expect(screen.getByText('8 / 8')).toBeInTheDocument()
    expect(screen.getByText('全問正解です。お見事！')).toBeInTheDocument()
    expect(useProgressStore.getState().quiz.wait.attempts).toBe(8)
    expect(useProgressStore.getState().quiz.wait.correct).toBe(8)
    expect(useProgressStore.getState().quiz.wait.wrongIds).toHaveLength(0)
  })

  it('不正解時はフィードバックと復習登録が行われる', () => {
    const { container } = renderSession('/quiz/wait')
    const current = readCurrentWaitQuestion(container)
    const waits = solveWaits(current)
    const wrongIndex = ALL_TILES.findIndex(
      (_, index) => !waits.includes(index),
    )
    fireEvent.click(
      screen.getByRole('button', { name: tileName(indexToTile(wrongIndex)) }),
    )
    fireEvent.click(screen.getByRole('button', { name: '決定' }))
    expect(screen.getByText('不正解')).toBeInTheDocument()
    expect(screen.getByText(current.hint)).toBeInTheDocument()
    expect(useProgressStore.getState().quiz.wait.wrongIds).toContain(
      current.id,
    )
    expect(useProgressStore.getState().quiz.wait.correct).toBe(0)
  })

  it('結果画面からもう一度挑戦すると1問目に戻る', () => {
    const { container } = renderSession('/quiz/wait')
    completeWaitSession(container)
    expect(screen.getByText('結果発表')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'もう一度挑戦' }))
    expect(screen.getByText('問 1 / 8')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '待ち当てクイズ' }),
    ).toBeInTheDocument()
  })

  it('結果画面のクイズ一覧リンクで一覧へ戻れる', () => {
    const { container } = renderSession('/quiz/wait')
    completeWaitSession(container)
    fireEvent.click(screen.getByRole('link', { name: 'クイズ一覧へ' }))
    expect(screen.getByText('クイズ一覧スタブ')).toBeInTheDocument()
  })

  it('中断リンクでセッションを離脱できる', () => {
    renderSession('/quiz/wait')
    fireEvent.click(screen.getByRole('link', { name: '中断' }))
    expect(screen.getByText('クイズ一覧スタブ')).toBeInTheDocument()
  })

  it('役当てカテゴリではYakuPanelが表示され回答できる', () => {
    renderSession('/quiz/yaku')
    expect(
      screen.getByRole('heading', { name: '役当てクイズ' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/この和了に成立している役を/),
    ).toBeInTheDocument()
    const choice = screen
      .getAllByRole('button')
      .find((button) => button.hasAttribute('aria-pressed'))
    if (choice === undefined) {
      throw new Error('役の選択肢が見つかりません')
    }
    fireEvent.click(choice)
    fireEvent.click(screen.getByRole('button', { name: '決定' }))
    expect(screen.getByRole('button', { name: '次の問題へ' })).toBeInTheDocument()
    expect(useProgressStore.getState().quiz.yaku.attempts).toBe(1)
  })

  it('点数当てカテゴリではScorePanelが表示され回答できる', () => {
    renderSession('/quiz/score')
    expect(
      screen.getByRole('heading', { name: '点数当てクイズ' }),
    ).toBeInTheDocument()
    expect(screen.getByText('点数（支払い）')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
    fireEvent.click(buttons[0]!)
    expect(screen.getByRole('button', { name: '次の問題へ' })).toBeInTheDocument()
    expect(useProgressStore.getState().quiz.score.attempts).toBe(1)
  })
})
