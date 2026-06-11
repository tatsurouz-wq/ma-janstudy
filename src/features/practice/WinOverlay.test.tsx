import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { calculateScore } from '@/core/score/calculate'
import type { ScoreResult, WinContext } from '@/core/score/types'
import type { Tile } from '@/core/tiles/tile'
import { parseTiles } from '@/core/tiles/notation'
import { DEFAULT_RULE } from '@/core/rules/ruleset'
import { WinOverlay } from './WinOverlay'

const makeResult = (
  notation: string,
  winTile: Tile,
  win: Partial<WinContext> = {},
): ScoreResult => {
  const outcome = calculateScore({
    concealed: parseTiles(notation),
    melds: [],
    winTile,
    win: {
      winType: 'tsumo',
      riichi: 'riichi',
      ippatsu: false,
      haitei: false,
      houtei: false,
      rinshan: false,
      chankan: false,
      tenhou: false,
      chiihou: false,
      seatWind: 1,
      roundWind: 1,
      ...win,
    },
    doraIndicators: [],
    uraIndicators: [],
    redFives: 0,
    honba: 0,
    kyotaku: 0,
    rule: DEFAULT_RULE,
  })
  if (!outcome.ok) {
    throw new Error(`和了形になっていません: ${outcome.reason}`)
  }
  return outcome.result
}

afterEach(cleanup)

describe('WinOverlay', () => {
  it('役名と親ツモの点数（点オール）を表示する', () => {
    const result = makeResult('123m456m789m222p55p', 'p5')
    render(<WinOverlay result={result} onNextGame={vi.fn()} />)
    expect(screen.getByText('ツモ和了')).toBeInTheDocument()
    expect(result.yaku.length).toBeGreaterThan(0)
    for (const hit of result.yaku) {
      expect(screen.getByText(hit.name)).toBeInTheDocument()
    }
    const payments = result.points.payments
    expect(payments.type).toBe('tsumo-dealer')
    const fromEach = payments.type === 'tsumo-dealer' ? payments.fromEach : 0
    const pointsLine = screen.getByText(new RegExp(`${result.totalHan}翻`))
    expect(pointsLine).toHaveTextContent(`${fromEach.toLocaleString()}点オール`)
    expect(result.fu).not.toBeNull()
    expect(pointsLine).toHaveTextContent(`${result.fu?.rounded ?? 0}符`)
  })

  it('子のツモでは合計点を表示する', () => {
    const result = makeResult('123m456m789m222p55p', 'p5', { seatWind: 2 })
    render(<WinOverlay result={result} onNextGame={vi.fn()} />)
    expect(result.points.payments.type).toBe('tsumo-nondealer')
    const pointsLine = screen.getByText(new RegExp(`${result.totalHan}翻`))
    expect(pointsLine).toHaveTextContent(
      `${result.points.payments.total.toLocaleString()}点`,
    )
    expect(pointsLine).not.toHaveTextContent('点オール')
  })

  it('役満では翻数の代わりに役満と表示する', () => {
    const result = makeResult('119m19p19s1234567z', 'm1', { riichi: 'none' })
    render(<WinOverlay result={result} onNextGame={vi.fn()} />)
    expect(result.isYakuman).toBe(true)
    expect(screen.getByText(/役満/)).toBeInTheDocument()
  })

  it('点数の内訳をトグルで開閉できる', () => {
    const result = makeResult('123m456m789m222p55p', 'p5')
    render(<WinOverlay result={result} onNextGame={vi.fn()} />)
    expect(
      screen.queryByRole('list', { name: '計算過程' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '点数の内訳を見る' }))
    expect(screen.getByRole('list', { name: '計算過程' })).toBeInTheDocument()
    expect(result.steps.length).toBeGreaterThan(0)
    expect(screen.getAllByRole('listitem')).toHaveLength(result.steps.length)
    fireEvent.click(screen.getByRole('button', { name: '内訳を閉じる' }))
    expect(
      screen.queryByRole('list', { name: '計算過程' }),
    ).not.toBeInTheDocument()
  })

  it('もう一局ボタンでコールバックを呼ぶ', () => {
    const onNextGame = vi.fn()
    const result = makeResult('123m456m789m222p55p', 'p5')
    render(<WinOverlay result={result} onNextGame={onNextGame} />)
    fireEvent.click(screen.getByRole('button', { name: 'もう一局' }))
    expect(onNextGame).toHaveBeenCalledTimes(1)
  })
})
