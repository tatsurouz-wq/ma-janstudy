import { afterEach, describe, expect, it } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { CalculatorPage } from './CalculatorPage'

afterEach(cleanup)

const picker = () => within(screen.getByRole('group', { name: '牌を選ぶ' }))

const pickTiles = (names: readonly string[]) => {
  for (const name of names) {
    fireEvent.click(picker().getByRole('button', { name }))
  }
}

const PINFU_HAND: readonly string[] = [
  '二萬',
  '三萬',
  '四萬',
  '四筒',
  '五筒',
  '六筒',
  '七索',
  '八索',
  '九索',
  '三索',
  '四索',
  '五索',
  '五索',
  '五索',
]

describe('CalculatorPage', () => {
  it('初期表示では残り14枚の案内を出す', () => {
    render(<CalculatorPage />)
    expect(screen.getByText(/手牌 0\/14枚/)).toBeInTheDocument()
    expect(
      screen.getByText('あと14枚で和了形です。牌を選んでください。'),
    ).toBeInTheDocument()
  })

  it('平和ツモの手を作るとツモ切替で2翻20符になる', () => {
    render(<CalculatorPage />)
    pickTiles(PINFU_HAND)
    expect(screen.getByText(/手牌 14\/14枚/)).toBeInTheDocument()
    expect(screen.getByText(/和了牌: 五索/)).toBeInTheDocument()

    expect(screen.getByText('ロン和了')).toBeInTheDocument()
    expect(screen.getByText('30符1翻 1,000点')).toBeInTheDocument()
    expect(screen.getByText('平和')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'ツモ' }))
    expect(screen.getByText('子のツモ和了')).toBeInTheDocument()
    expect(screen.getByText('20符2翻 1,500点')).toBeInTheDocument()
    expect(screen.getByText('門前清自摸和')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: '計算過程' })).toBeInTheDocument()
  })

  it('手牌クリックで和了牌を変更しダブルクリックで削除できる', () => {
    render(<CalculatorPage />)
    pickTiles(PINFU_HAND)
    const pickerGroup = screen.getByRole('group', { name: '牌を選ぶ' })
    const handTile = screen
      .getAllByRole('button', { name: '二萬' })
      .find((button) => !pickerGroup.contains(button))
    expect(handTile).toBeDefined()

    fireEvent.click(handTile as HTMLElement)
    expect(screen.getByText(/和了牌: 二萬/)).toBeInTheDocument()
    expect(screen.getByText('30符1翻 1,000点')).toBeInTheDocument()

    const winTile = screen.getByRole('button', { name: '二萬（和了牌）' })
    fireEvent.doubleClick(winTile)
    expect(screen.getByText(/手牌 13\/14枚/)).toBeInTheDocument()
    expect(
      screen.getByText('あと1枚で和了形です。牌を選んでください。'),
    ).toBeInTheDocument()
  })

  it('リセットボタンで手牌と結果が初期化される', () => {
    render(<CalculatorPage />)
    pickTiles(['一萬', '二萬'])
    expect(screen.getByText(/手牌 2\/14枚/)).toBeInTheDocument()
    expect(
      screen.getByText('あと12枚で和了形です。牌を選んでください。'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'リセット' }))
    expect(screen.getByText(/手牌 0\/14枚/)).toBeInTheDocument()
    expect(
      screen.getByText('あと14枚で和了形です。牌を選んでください。'),
    ).toBeInTheDocument()
  })

  it('ポンモードで牌をクリックすると副露が追加される', () => {
    render(<CalculatorPage />)
    const pon = screen.getByRole('button', { name: 'ポン' })
    fireEvent.click(pon)
    expect(pon).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByText('下の牌をクリックすると副露が追加されます'),
    ).toBeInTheDocument()

    fireEvent.click(picker().getByRole('button', { name: '白' }))
    expect(screen.getByText(/手牌 0\/11枚/)).toBeInTheDocument()
    const meld = screen.getByRole('button', { name: 'ポンを削除' })
    expect(pon).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.queryByText('下の牌をクリックすると副露が追加されます'),
    ).not.toBeInTheDocument()

    fireEvent.doubleClick(meld)
    expect(screen.getByText(/手牌 0\/14枚/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'ポンを削除' }),
    ).not.toBeInTheDocument()
  })

  it('同じ牌を4枚使うとピッカーで選べなくなる', () => {
    render(<CalculatorPage />)
    pickTiles(['東', '東', '東', '東'])
    expect(screen.getByText(/手牌 4\/14枚/)).toBeInTheDocument()
    expect(picker().getByRole('button', { name: '東' })).toBeDisabled()
  })

  it('ドラ表示牌を追加すると結果に反映される', () => {
    render(<CalculatorPage />)
    pickTiles(PINFU_HAND)
    expect(screen.getByText('30符1翻 1,000点')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '+' }))
    expect(
      screen.getByText('ドラ表示牌を選んでください'),
    ).toBeInTheDocument()

    fireEvent.click(picker().getByRole('button', { name: '二索' }))
    expect(
      screen.queryByText('ドラ表示牌を選んでください'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'ドラ表示のs2を削除' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/手牌 14\/14枚/)).toBeInTheDocument()
    expect(screen.getByText('30符2翻 2,000点')).toBeInTheDocument()
  })
})
