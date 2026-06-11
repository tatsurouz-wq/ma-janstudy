import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { Tile } from '@/core/tiles/tile'
import type { ScoreOutcome, WinContext } from '@/core/score/types'
import { calculateScore } from '@/core/score/calculate'
import { DEFAULT_RULE } from '@/core/rules/ruleset'
import { parseTiles } from '@/core/tiles/notation'
import { ResultPanel } from './ResultPanel'

afterEach(cleanup)

const winContext = (overrides: Partial<WinContext> = {}): WinContext => ({
  winType: 'tsumo',
  riichi: 'none',
  ippatsu: false,
  haitei: false,
  houtei: false,
  rinshan: false,
  chankan: false,
  tenhou: false,
  chiihou: false,
  seatWind: 2,
  roundWind: 1,
  ...overrides,
})

const score = (
  hand: string,
  winTile: Tile,
  win: WinContext,
  doraIndicators: readonly Tile[] = [],
): ScoreOutcome =>
  calculateScore({
    concealed: parseTiles(hand),
    melds: [],
    winTile,
    win,
    doraIndicators,
    uraIndicators: [],
    redFives: 0,
    honba: 0,
    kyotaku: 0,
    rule: DEFAULT_RULE,
  })

describe('ResultPanel outcome=null', () => {
  it('牌が足りないときは残り枚数を案内する', () => {
    render(<ResultPanel outcome={null} tilesNeeded={3} />)
    expect(
      screen.getByText('あと3枚で和了形です。牌を選んでください。'),
    ).toBeInTheDocument()
  })

  it('枚数が揃っていれば自動計算の案内を出す', () => {
    render(<ResultPanel outcome={null} tilesNeeded={0} />)
    expect(
      screen.getByText('手牌を作ると自動で計算します。'),
    ).toBeInTheDocument()
  })
})

describe('ResultPanel エラー表示', () => {
  it('invalid-hand のメッセージ', () => {
    render(
      <ResultPanel
        outcome={{ ok: false, reason: 'invalid-hand' }}
        tilesNeeded={0}
      />,
    )
    expect(screen.getByText('手牌の枚数が足りません')).toBeInTheDocument()
  })

  it('not-winning のメッセージ', () => {
    render(
      <ResultPanel
        outcome={{ ok: false, reason: 'not-winning' }}
        tilesNeeded={0}
      />,
    )
    expect(
      screen.getByText(/この手牌は和了形ではありません/),
    ).toBeInTheDocument()
  })

  it('no-yaku のメッセージ', () => {
    render(
      <ResultPanel
        outcome={{ ok: false, reason: 'no-yaku' }}
        tilesNeeded={0}
      />,
    )
    expect(screen.getByText(/役がありません/)).toBeInTheDocument()
  })
})

describe('ResultPanel 正常系', () => {
  it('子のツモ和了で符・翻・点数と役を表示する', () => {
    const outcome = score('234m456p789s34555s', 's5', winContext())
    expect(outcome.ok).toBe(true)
    render(<ResultPanel outcome={outcome} tilesNeeded={0} />)
    expect(screen.getByText('子のツモ和了')).toBeInTheDocument()
    expect(screen.getByText('20符2翻 1,500点')).toBeInTheDocument()
    expect(screen.getByText('平和')).toBeInTheDocument()
    expect(screen.getByText('門前清自摸和')).toBeInTheDocument()
    expect(
      screen.getByText('親から700点 / 子から400点ずつ'),
    ).toBeInTheDocument()
    expect(screen.getByRole('list', { name: '計算過程' })).toBeInTheDocument()
    expect(screen.getByText('計算過程をステップで見る')).toBeInTheDocument()
  })

  it('親のツモ和了は全員払いの内訳を表示する', () => {
    const outcome = score(
      '234m456p789s34555s',
      's5',
      winContext({ seatWind: 1 }),
    )
    render(<ResultPanel outcome={outcome} tilesNeeded={0} />)
    expect(screen.getByText('親のツモ和了')).toBeInTheDocument()
    expect(screen.getByText('全員から700点ずつ')).toBeInTheDocument()
    expect(screen.getByText('20符2翻 2,100点')).toBeInTheDocument()
  })

  it('ロン和了を表示する', () => {
    const outcome = score(
      '234m456p789s34555s',
      's5',
      winContext({ winType: 'ron' }),
    )
    render(<ResultPanel outcome={outcome} tilesNeeded={0} />)
    expect(screen.getByText('ロン和了')).toBeInTheDocument()
    expect(screen.getByText('30符1翻 1,000点')).toBeInTheDocument()
  })

  it('ドラがあるとドラのチップと加算後の翻数を表示する', () => {
    const outcome = score(
      '234m456p789s34555s',
      's5',
      winContext({ winType: 'ron' }),
      ['s2'],
    )
    render(<ResultPanel outcome={outcome} tilesNeeded={0} />)
    expect(screen.getByText('30符2翻 2,000点')).toBeInTheDocument()
    expect(screen.getAllByText('ドラ').length).toBeGreaterThanOrEqual(1)
  })

  it('役満は限度名で表示する', () => {
    const outcome = score(
      '19m19p19s12345677z',
      'z7',
      winContext({ winType: 'ron' }),
    )
    render(<ResultPanel outcome={outcome} tilesNeeded={0} />)
    expect(screen.getByText('役満 32,000点')).toBeInTheDocument()
    expect(screen.getByText('国士無双')).toBeInTheDocument()
    expect(screen.getByText('役満')).toBeInTheDocument()
  })
})
