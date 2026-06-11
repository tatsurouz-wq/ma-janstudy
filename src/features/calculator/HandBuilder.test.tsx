import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { CalculatorAction, CalculatorState } from './calculatorState'
import { calculatorReducer, INITIAL_CALCULATOR_STATE } from './calculatorState'
import { HandBuilder } from './HandBuilder'

afterEach(cleanup)

const buildState = (actions: readonly CalculatorAction[]): CalculatorState =>
  actions.reduce(calculatorReducer, INITIAL_CALCULATOR_STATE)

const noopHandlers = {
  onRemoveTile: () => undefined,
  onSetWinTile: () => undefined,
  onRemoveMeld: () => undefined,
}

describe('HandBuilder', () => {
  it('枚数と和了牌の名前を表示する', () => {
    const state = buildState([
      { type: 'ADD_TILE', tile: 'm3', isRed: false },
      { type: 'ADD_TILE', tile: 'm1', isRed: false },
    ])
    render(<HandBuilder state={state} {...noopHandlers} />)
    expect(screen.getByText(/手牌 2\/14枚/)).toBeInTheDocument()
    expect(screen.getByText(/和了牌: 一萬/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '一萬（和了牌）' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '三萬' })).toBeInTheDocument()
  })

  it('牌クリックで元のインデックスを和了牌に指定する', () => {
    const onSetWinTile = vi.fn()
    const state = buildState([
      { type: 'ADD_TILE', tile: 'm3', isRed: false },
      { type: 'ADD_TILE', tile: 'm1', isRed: false },
    ])
    render(
      <HandBuilder
        state={state}
        {...noopHandlers}
        onSetWinTile={onSetWinTile}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '三萬' }))
    expect(onSetWinTile).toHaveBeenCalledWith(0)
  })

  it('ダブルクリックで牌を削除する', () => {
    const onRemoveTile = vi.fn()
    const state = buildState([
      { type: 'ADD_TILE', tile: 'm3', isRed: false },
      { type: 'ADD_TILE', tile: 'm1', isRed: false },
    ])
    render(
      <HandBuilder
        state={state}
        {...noopHandlers}
        onRemoveTile={onRemoveTile}
      />,
    )
    fireEvent.doubleClick(screen.getByRole('button', { name: '三萬' }))
    expect(onRemoveTile).toHaveBeenCalledWith(0)
  })

  it('赤5は赤付きの名前で表示される', () => {
    const state = buildState([{ type: 'ADD_TILE', tile: 'p5', isRed: true }])
    render(<HandBuilder state={state} {...noopHandlers} />)
    expect(
      screen.getByRole('button', { name: '赤五筒（和了牌）' }),
    ).toBeInTheDocument()
  })

  it('副露を表示しダブルクリックで削除できる', () => {
    const onRemoveMeld = vi.fn()
    const state = buildState([
      { type: 'SET_MELD_MODE', mode: 'pon' },
      { type: 'ADD_TILE', tile: 'z5', isRed: false },
    ])
    render(
      <HandBuilder
        state={state}
        {...noopHandlers}
        onRemoveMeld={onRemoveMeld}
      />,
    )
    expect(screen.getByText(/手牌 0\/11枚/)).toBeInTheDocument()
    expect(screen.getByText('ポン')).toBeInTheDocument()
    const meldButton = screen.getByRole('button', { name: 'ポンを削除' })
    fireEvent.doubleClick(meldButton)
    expect(onRemoveMeld).toHaveBeenCalledWith(0)
  })

  it('暗槓は両端の牌を裏向きで表示する', () => {
    const state = buildState([
      { type: 'SET_MELD_MODE', mode: 'ankan' },
      { type: 'ADD_TILE', tile: 'z7', isRed: false },
    ])
    render(<HandBuilder state={state} {...noopHandlers} />)
    expect(screen.getByText('暗槓')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: '裏向きの牌' })).toHaveLength(2)
    expect(screen.getAllByRole('img', { name: '中' })).toHaveLength(2)
  })

  it('和了牌未指定なら和了牌表示を出さない', () => {
    render(<HandBuilder state={INITIAL_CALCULATOR_STATE} {...noopHandlers} />)
    expect(screen.getByText(/手牌 0\/14枚/)).toBeInTheDocument()
    expect(screen.queryByText(/和了牌:/)).not.toBeInTheDocument()
  })
})
