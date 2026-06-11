import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { SortToZonesStep } from '@/content/lessons/types'
import { LESSON_01 } from '@/content/lessons/lesson01'
import { SortToZonesStepView } from './SortToZonesStepView'

afterEach(cleanup)

const found = LESSON_01.steps.find(
  (s): s is SortToZonesStep => s.kind === 'sort-to-zones',
)
if (found === undefined) {
  throw new Error('lesson01にsort-to-zonesステップがありません')
}
const step: SortToZonesStep = found

const PLACEMENTS: readonly (readonly [string, RegExp])[] = [
  ['三萬', /萬子/],
  ['七萬', /萬子/],
  ['二筒', /筒子/],
  ['八筒', /筒子/],
  ['一索', /索子/],
  ['五索', /索子/],
  ['東', /字牌/],
  ['發', /字牌/],
]

const tapTile = (label: string) =>
  fireEvent.click(screen.getByRole('button', { name: label }))

const tapZone = (pattern: RegExp) =>
  fireEvent.click(screen.getByRole('button', { name: pattern }))

describe('SortToZonesStepView', () => {
  it('タップした牌を正しいゾーンに配置できる', () => {
    const onComplete = vi.fn()
    render(<SortToZonesStepView step={step} onComplete={onComplete} />)

    tapTile('三萬')
    tapZone(/萬子/)

    expect(
      screen.queryByRole('button', { name: '三萬' }),
    ).not.toBeInTheDocument()
    const manZone = screen.getByRole('button', { name: /萬子/ })
    expect(within(manZone).getByRole('img', { name: '三萬' })).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('間違ったゾーンには配置されない', () => {
    const onComplete = vi.fn()
    render(<SortToZonesStepView step={step} onComplete={onComplete} />)

    tapTile('三萬')
    tapZone(/筒子/)

    expect(screen.getByRole('button', { name: '三萬' })).toBeInTheDocument()
    const pinZone = screen.getByRole('button', { name: /筒子/ })
    expect(within(pinZone).queryAllByRole('img')).toHaveLength(0)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('同じ牌を再タップすると選択が解除される', () => {
    const onComplete = vi.fn()
    render(<SortToZonesStepView step={step} onComplete={onComplete} />)

    tapTile('三萬')
    tapTile('三萬')
    tapZone(/萬子/)

    expect(screen.getByRole('button', { name: '三萬' })).toBeInTheDocument()
    const manZone = screen.getByRole('button', { name: /萬子/ })
    expect(within(manZone).queryAllByRole('img')).toHaveLength(0)
  })

  it('すべての牌を配置するとonCompleteが呼ばれ完了表示になる', () => {
    const onComplete = vi.fn()
    render(<SortToZonesStepView step={step} onComplete={onComplete} />)

    for (const [label, zone] of PLACEMENTS) {
      tapTile(label)
      tapZone(zone)
    }

    expect(screen.getByText('すべて仕分けできました')).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
