import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Tile, TileInstance } from '@/core/tiles/tile'
import type { DiscardEvaluation } from '@/core/game/selectors'
import { PracticeHand } from './PracticeHand'

const inst = (id: string, tile: Tile, isRed = false): TileInstance => ({
  id,
  tile,
  isRed,
})

const HAND: readonly TileInstance[] = [
  inst('t-9p', 'p9'),
  inst('t-1m', 'm1'),
  inst('t-5s', 's5', true),
]

const EVALUATIONS: readonly DiscardEvaluation[] = [
  { tileId: 't-1m', shantenAfter: 0, ukeireCount: 8 },
  { tileId: 't-9p', shantenAfter: 1, ukeireCount: 12 },
]

type PracticeHandProps = Parameters<typeof PracticeHand>[0]

const renderHand = (overrides: Partial<PracticeHandProps> = {}) =>
  render(
    <PracticeHand
      hand={HAND}
      drawnTile={null}
      selectedId={null}
      riichiSelect={false}
      evaluations={EVALUATIONS}
      showEvaluations={false}
      onTileTap={vi.fn()}
      disabled={false}
      {...overrides}
    />,
  )

afterEach(cleanup)

describe('PracticeHand', () => {
  it('手牌を理牌順に並べ、ツモ牌を右に離して表示する', () => {
    renderHand({ drawnTile: inst('t-d', 'z7') })
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      '一萬を選ぶ',
      '九筒を選ぶ',
      '赤五索を選ぶ',
      '中を選ぶ',
    ])
    expect(buttons[3]).toHaveClass('ml-4')
  })

  it('牌のタップでonTileTapに牌のidを渡す', () => {
    const onTileTap = vi.fn()
    renderHand({ onTileTap })
    fireEvent.click(screen.getByRole('button', { name: '一萬を選ぶ' }))
    expect(onTileTap).toHaveBeenCalledWith('t-1m')
  })

  it('選択中の牌はハイライトされラベルが確定表記になる', () => {
    renderHand({ selectedId: 't-1m' })
    const selected = screen.getByRole('button', { name: '一萬を捨てる（確定）' })
    expect(selected).toHaveClass('glow-gold')
    expect(screen.getByRole('button', { name: '九筒を選ぶ' })).not.toHaveClass(
      'glow-gold',
    )
  })

  it('フル補助では選択牌の評価ツールチップを表示する', () => {
    renderHand({ selectedId: 't-1m', showEvaluations: true })
    expect(
      screen.getByText('切るとテンパイ・受け入れ8枚'),
    ).toBeInTheDocument()
  })

  it('向聴が戻る牌は向聴数つきの評価を表示する', () => {
    renderHand({ selectedId: 't-9p', showEvaluations: true })
    expect(
      screen.getByText('切ると1向聴・受け入れ12枚'),
    ).toBeInTheDocument()
  })

  it('評価表示がオフのときはツールチップを出さない', () => {
    renderHand({ selectedId: 't-1m', showEvaluations: false })
    expect(screen.queryByText(/受け入れ/)).not.toBeInTheDocument()
  })

  it('リーチ宣言中はテンパイ維持牌だけ押せて他は薄く無効になる', () => {
    const onTileTap = vi.fn()
    renderHand({ riichiSelect: true, onTileTap })
    const keep = screen.getByRole('button', { name: '一萬を選ぶ' })
    const dropA = screen.getByRole('button', { name: '九筒を選ぶ' })
    const dropB = screen.getByRole('button', { name: '赤五索を選ぶ' })
    expect(keep).toBeEnabled()
    expect(dropA).toBeDisabled()
    expect(dropB).toBeDisabled()
    expect(dropA).toHaveClass('opacity-30')
    expect(keep).not.toHaveClass('opacity-30')
    expect(keep.querySelector('.bg-gold-300')).not.toBeNull()
    expect(dropA.querySelector('.bg-gold-300')).toBeNull()
    fireEvent.click(dropA)
    expect(onTileTap).not.toHaveBeenCalled()
    fireEvent.click(keep)
    expect(onTileTap).toHaveBeenCalledWith('t-1m')
  })

  it('打牌できない局面ではすべての牌が無効になる', () => {
    renderHand({ disabled: true })
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })
})
