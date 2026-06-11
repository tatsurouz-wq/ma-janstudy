import { useReducer, useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { CalculatorState } from './calculatorState'
import { calculatorReducer, INITIAL_CALCULATOR_STATE } from './calculatorState'
import { ContextForm } from './ContextForm'

afterEach(cleanup)

interface HarnessProps {
  readonly initial?: CalculatorState
}

function Harness({ initial = INITIAL_CALCULATOR_STATE }: HarnessProps) {
  const [state, dispatch] = useReducer(calculatorReducer, initial)
  const [doraPickerTarget, setDoraPickerTarget] = useState<
    'omote' | 'ura' | null
  >(null)
  return (
    <ContextForm
      state={state}
      dispatch={dispatch}
      doraPickerTarget={doraPickerTarget}
      onToggleDoraPicker={(target) =>
        setDoraPickerTarget((current) => (current === target ? null : target))
      }
    />
  )
}

describe('ContextForm', () => {
  it('和了の切替ができる', () => {
    render(<Harness />)
    const ron = screen.getByRole('button', { name: 'ロン' })
    const tsumo = screen.getByRole('button', { name: 'ツモ' })
    expect(ron).toHaveAttribute('aria-pressed', 'true')
    expect(tsumo).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(tsumo)
    expect(tsumo).toHaveAttribute('aria-pressed', 'true')
    expect(ron).toHaveAttribute('aria-pressed', 'false')
  })

  it('自風の切替ができる', () => {
    render(<Harness />)
    const west = screen.getByRole('button', { name: '西' })
    expect(west).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(west)
    expect(west).toHaveAttribute('aria-pressed', 'true')
  })

  it('場風は東南のみで切替ができる', () => {
    render(<Harness />)
    const southButtons = screen.getAllByRole('button', { name: '南' })
    expect(southButtons).toHaveLength(2)
    const roundSouth = southButtons[1]
    expect(roundSouth).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(roundSouth as HTMLElement)
    expect(roundSouth).toHaveAttribute('aria-pressed', 'true')
  })

  it('リーチ時のみ一発と裏ドラ表示の行が出る', () => {
    render(<Harness />)
    expect(screen.queryByText('一発')).not.toBeInTheDocument()
    expect(screen.queryByText('裏ドラ表示')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'リーチ' }))
    expect(screen.getByText('一発')).toBeInTheDocument()
    expect(screen.getByText('裏ドラ表示')).toBeInTheDocument()

    const ippatsuOn = screen.getByRole('button', { name: 'あり' })
    fireEvent.click(ippatsuOn)
    expect(ippatsuOn).toHaveAttribute('aria-pressed', 'true')

    const noneButtons = screen.getAllByRole('button', { name: 'なし' })
    fireEvent.click(noneButtons[0] as HTMLElement)
    expect(screen.queryByText('一発')).not.toBeInTheDocument()
    expect(screen.queryByText('裏ドラ表示')).not.toBeInTheDocument()
  })

  it('本場の切替ができる', () => {
    render(<Harness />)
    const honba3 = screen.getByRole('button', { name: '3' })
    expect(honba3).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(honba3)
    expect(honba3).toHaveAttribute('aria-pressed', 'true')
  })

  it('副露モードボタンはトグルでヒントを表示する', () => {
    render(<Harness />)
    const pon = screen.getByRole('button', { name: 'ポン' })
    expect(pon).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.queryByText('下の牌をクリックすると副露が追加されます'),
    ).not.toBeInTheDocument()

    fireEvent.click(pon)
    expect(pon).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByText('下の牌をクリックすると副露が追加されます'),
    ).toBeInTheDocument()

    fireEvent.click(pon)
    expect(pon).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.queryByText('下の牌をクリックすると副露が追加されます'),
    ).not.toBeInTheDocument()
  })

  it('副露モードは別のモードへ切替できる', () => {
    render(<Harness />)
    const pon = screen.getByRole('button', { name: 'ポン' })
    const chi = screen.getByRole('button', { name: 'チー' })
    fireEvent.click(pon)
    fireEvent.click(chi)
    expect(chi).toHaveAttribute('aria-pressed', 'true')
    expect(pon).toHaveAttribute('aria-pressed', 'false')
  })

  it('ドラ表示の+ボタンはトグルできる', () => {
    render(<Harness />)
    const plus = screen.getByRole('button', { name: '+' })
    expect(plus).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(plus)
    expect(plus).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(plus)
    expect(plus).toHaveAttribute('aria-pressed', 'false')
  })

  it('ドラ表示牌をクリックすると削除される', () => {
    render(
      <Harness
        initial={{ ...INITIAL_CALCULATOR_STATE, doraIndicators: ['m1'] }}
      />,
    )
    const remove = screen.getByRole('button', { name: 'ドラ表示のm1を削除' })
    fireEvent.click(remove)
    expect(
      screen.queryByRole('button', { name: 'ドラ表示のm1を削除' }),
    ).not.toBeInTheDocument()
  })

  it('リーチ時は裏ドラ表示牌の削除もできる', () => {
    render(
      <Harness
        initial={{
          ...INITIAL_CALCULATOR_STATE,
          riichi: 'riichi',
          uraIndicators: ['p2'],
        }}
      />,
    )
    const plusButtons = screen.getAllByRole('button', { name: '+' })
    expect(plusButtons).toHaveLength(2)
    const uraPlus = plusButtons[1] as HTMLElement
    fireEvent.click(uraPlus)
    expect(uraPlus).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(uraPlus)
    expect(uraPlus).toHaveAttribute('aria-pressed', 'false')

    const remove = screen.getByRole('button', {
      name: '裏ドラ表示のp2を削除',
    })
    fireEvent.click(remove)
    expect(
      screen.queryByRole('button', { name: '裏ドラ表示のp2を削除' }),
    ).not.toBeInTheDocument()
  })
})
