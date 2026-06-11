import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { QuizContext } from '@/content/quizzes/types'
import { ContextChips } from './ContextChips'

afterEach(cleanup)

const BASE: QuizContext = { winType: 'ron', seatWind: 2, roundWind: 1 }

describe('ContextChips', () => {
  it('ロン・場風・自風の基本チップのみ表示する', () => {
    render(<ContextChips context={BASE} />)
    expect(screen.getByText('ロン')).toBeInTheDocument()
    expect(screen.getByText('東場')).toBeInTheDocument()
    expect(screen.getByText('自風南')).toBeInTheDocument()
    expect(screen.queryByText('リーチ')).not.toBeInTheDocument()
    expect(screen.queryByText('一発')).not.toBeInTheDocument()
    expect(screen.queryByText(/ドラ表示/)).not.toBeInTheDocument()
    expect(screen.queryByText(/裏ドラ表示/)).not.toBeInTheDocument()
    expect(screen.queryByText(/赤ドラ/)).not.toBeInTheDocument()
  })

  it('ツモ和了はツモチップを表示する', () => {
    render(
      <ContextChips
        context={{ winType: 'tsumo', seatWind: 1, roundWind: 2 }}
      />,
    )
    expect(screen.getByText('ツモ')).toBeInTheDocument()
    expect(screen.getByText('南場')).toBeInTheDocument()
    expect(screen.getByText('自風東')).toBeInTheDocument()
  })

  it('リーチと一発のチップを表示する', () => {
    render(
      <ContextChips context={{ ...BASE, riichi: true, ippatsu: true }} />,
    )
    expect(screen.getByText('リーチ')).toBeInTheDocument()
    expect(screen.getByText('一発')).toBeInTheDocument()
  })

  it('ドラ表示牌と裏ドラ表示牌を牌名で表示する', () => {
    render(
      <ContextChips
        context={{
          ...BASE,
          doraIndicators: ['p2', 'z5'],
          uraIndicators: ['s3'],
        }}
      />,
    )
    expect(screen.getByText('ドラ表示: 二筒・白')).toBeInTheDocument()
    expect(screen.getByText('裏ドラ表示: 三索')).toBeInTheDocument()
  })

  it('赤ドラの枚数チップを表示する', () => {
    render(<ContextChips context={{ ...BASE, redFives: 2 }} />)
    expect(screen.getByText('赤ドラ2枚')).toBeInTheDocument()
  })

  it('空のドラ表示と赤ドラ0枚はチップを表示しない', () => {
    render(
      <ContextChips
        context={{ ...BASE, doraIndicators: [], uraIndicators: [], redFives: 0 }}
      />,
    )
    expect(screen.queryByText(/ドラ表示/)).not.toBeInTheDocument()
    expect(screen.queryByText(/赤ドラ/)).not.toBeInTheDocument()
  })
})
