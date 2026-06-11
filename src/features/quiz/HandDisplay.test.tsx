import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { Meld } from '@/core/score/types'
import { HandDisplay } from './HandDisplay'

afterEach(cleanup)

describe('HandDisplay', () => {
  it('notationを解析し牌をソートして表示する', () => {
    render(<HandDisplay hand="9s1m5p" />)
    const labels = screen
      .getAllByRole('img')
      .map((el) => el.getAttribute('aria-label'))
    expect(labels).toEqual(['一萬', '五筒', '九索'])
  })

  it('同じ牌が複数あってもすべて表示する', () => {
    render(<HandDisplay hand="123m456p789s11z" />)
    expect(screen.getAllByRole('img')).toHaveLength(11)
    expect(screen.getAllByRole('img', { name: '東' })).toHaveLength(2)
  })

  it('highlightTileの牌だけ強調される', () => {
    render(<HandDisplay hand="123m" highlightTile="m2" />)
    expect(screen.getByRole('img', { name: '二萬' }).parentElement).toHaveClass(
      'glow-gold',
    )
    expect(
      screen.getByRole('img', { name: '一萬' }).parentElement,
    ).not.toHaveClass('glow-gold')
  })

  it('副露を手牌の後ろに表示する', () => {
    const melds: readonly Meld[] = [{ type: 'pon', tiles: ['z5', 'z5', 'z5'] }]
    render(<HandDisplay hand="123m" melds={melds} />)
    expect(screen.getAllByRole('img', { name: '白' })).toHaveLength(3)
    expect(screen.getAllByRole('img')).toHaveLength(6)
  })

  it('暗槓は両端の牌が裏向きで表示される', () => {
    const melds: readonly Meld[] = [
      { type: 'ankan', tiles: ['m5', 'm5', 'm5', 'm5'] },
    ]
    render(<HandDisplay hand="123p" melds={melds} />)
    expect(screen.getAllByRole('img', { name: '裏向きの牌' })).toHaveLength(2)
    expect(screen.getAllByRole('img', { name: '五萬' })).toHaveLength(2)
  })
})
