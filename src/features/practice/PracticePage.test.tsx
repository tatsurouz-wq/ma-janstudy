import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import type { GameState } from '@/core/game/gameState'
import { INITIAL_GAME_STATE } from '@/core/game/gameState'
import type { Tile, TileInstance } from '@/core/tiles/tile'
import { parseTiles } from '@/core/tiles/notation'
import { useGameStore } from '@/state/gameStore'
import { useProgressStore } from '@/state/progressStore'
import { useSettingsStore } from '@/state/settingsStore'
import { PracticePage } from './PracticePage'

vi.hoisted(() => {
  const store = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return store.size
    },
    clear: () => {
      store.clear()
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  })
})

const instances = (
  notation: string,
  prefix: string,
): readonly TileInstance[] =>
  parseTiles(notation).map((tile, i) => ({
    id: `${prefix}-${i}`,
    tile,
    isRed: false,
  }))

const inst = (id: string, tile: Tile): TileInstance => ({
  id,
  tile,
  isRed: false,
})

const at = <T,>(items: readonly T[], index: number): T => {
  const item = items[index]
  if (item === undefined) {
    throw new Error(`要素が見つかりません: index ${index}`)
  }
  return item
}

const TENPAI_STATE: GameState = {
  ...INITIAL_GAME_STATE,
  phase: 'awaitingDiscard',
  hand: instances('123456789m22p55s', 'h'),
  drawnTile: inst('d-0', 'z1'),
  wall: instances('2p', 'w'),
  doraIndicators: instances('3z', 'dora'),
  uraIndicators: instances('4z', 'ura'),
  turn: 1,
}

const NO_TENPAI_STATE: GameState = {
  ...INITIAL_GAME_STATE,
  phase: 'awaitingDiscard',
  hand: instances('139m139p139s1234z', 'h'),
  drawnTile: inst('d-0', 'z5'),
  wall: instances('5z', 'w'),
  turn: 1,
}

beforeEach(() => {
  localStorage.clear()
  useGameStore.setState({ game: INITIAL_GAME_STATE })
  useSettingsStore.setState({ assistLevel: 'full' })
  useProgressStore.setState({
    practice: { games: 0, wins: 0, bestPoints: 0, bestYakuList: [] },
  })
})

afterEach(cleanup)

describe('PracticePage 開始画面', () => {
  it('難易度と学習補助の選択肢、開始ボタンを表示する', () => {
    render(<PracticePage />)
    expect(screen.getByText('ミニ実戦（一人打ち）')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /かんたん/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /ふつう/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: /むずかしい/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'フル補助' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '対局開始' })).toBeEnabled()
    expect(screen.queryByText(/これまでの戦績/)).not.toBeInTheDocument()
  })

  it('難易度を切り替えてから開始すると選んだ難易度で対局が始まる', async () => {
    render(<PracticePage />)
    fireEvent.click(screen.getByRole('button', { name: /むずかしい/ }))
    expect(screen.getByRole('button', { name: /むずかしい/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: '対局開始' }))
    expect(useGameStore.getState().game.difficulty).toBe('hard')
    expect(useGameStore.getState().game.maxTurns).toBe(15)
    expect(screen.getByText('ミニ実戦')).toBeInTheDocument()
    await waitFor(
      () => {
        expect(
          screen.getAllByRole('button', { name: /を選ぶ$/ }),
        ).toHaveLength(14)
      },
      { timeout: 5000 },
    )
  }, 20000)

  it('学習補助の切り替えが設定ストアへ反映される', () => {
    render(<PracticePage />)
    fireEvent.click(screen.getByRole('button', { name: '補助なし' }))
    expect(useSettingsStore.getState().assistLevel).toBe('none')
    expect(screen.getByRole('button', { name: '補助なし' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('戦績があるときは開始画面に表示する', () => {
    useProgressStore.setState({
      practice: { games: 3, wins: 1, bestPoints: 12000, bestYakuList: ['立直'] },
    })
    render(<PracticePage />)
    expect(screen.getByText(/これまでの戦績/)).toHaveTextContent(
      'これまでの戦績: 3局 1勝 / 最高12,000点',
    )
  })
})

describe('PracticePage 対局の流れ', () => {
  it('開始後に自動ツモで14枚になり、2回タップで河に1枚捨てられる', async () => {
    render(<PracticePage />)
    fireEvent.click(screen.getByRole('button', { name: '対局開始' }))
    await waitFor(
      () => {
        expect(
          screen.getAllByRole('button', { name: /を選ぶ$/ }),
        ).toHaveLength(14)
      },
      { timeout: 5000 },
    )
    expect(screen.getByText(/残りツモ/)).toHaveTextContent('残りツモ 17 回')
    const river = screen.getByLabelText('河（捨て牌）')
    expect(
      within(river).getByText('捨てた牌がここに並びます'),
    ).toBeInTheDocument()

    const tiles = screen.getAllByRole('button', { name: /を選ぶ$/ })
    const first = at(tiles, 0)
    const second = at(tiles, 1)
    fireEvent.click(first)
    expect(first).toHaveAccessibleName(/を捨てる（確定）$/)
    fireEvent.click(second)
    expect(first).toHaveAccessibleName(/を選ぶ$/)
    expect(second).toHaveAccessibleName(/を捨てる（確定）$/)
    fireEvent.click(second)
    expect(within(river).getAllByRole('img')).toHaveLength(1)
    await waitFor(
      () => {
        expect(
          screen.getAllByRole('button', { name: /を選ぶ$/ }),
        ).toHaveLength(14)
      },
      { timeout: 5000 },
    )
    expect(screen.getByText(/残りツモ/)).toHaveTextContent('残りツモ 16 回')
  }, 20000)

  it('テンパイ時にリーチ宣言からツモ和了までできる', async () => {
    useGameStore.setState({ game: TENPAI_STATE })
    render(<PracticePage />)
    expect(screen.getByText('テンパイ')).toBeInTheDocument()
    expect(screen.getByText(/待ち:/)).toHaveTextContent('二筒')
    expect(screen.getByText(/待ち:/)).toHaveTextContent('五索')

    fireEvent.click(screen.getByRole('button', { name: 'リーチ' }))
    expect(
      screen.getByText('金色の点がついた牌を切るとリーチ宣言になります'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'リーチをやめる' }))
    expect(screen.getByRole('button', { name: 'リーチ' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'リーチ' }))
    const tileButtons = screen.getAllByRole('button', { name: /を選ぶ$/ })
    expect(tileButtons).toHaveLength(14)
    expect(tileButtons.filter((b) => b.hasAttribute('disabled'))).toHaveLength(
      13,
    )
    const keepButton = screen.getByRole('button', { name: '東を選ぶ' })
    expect(keepButton).toBeEnabled()
    fireEvent.click(keepButton)
    expect(screen.getByText('リーチ中')).toBeInTheDocument()

    const tsumoButton = screen.getByRole('button', { name: 'ツモ和了' })
    await waitFor(
      () => {
        expect(tsumoButton).toBeEnabled()
      },
      { timeout: 5000 },
    )
    expect(
      screen.getByText(/リーチ中はツモった牌しか捨てられません/),
    ).toBeInTheDocument()
    fireEvent.click(tsumoButton)
    expect(await screen.findByText(/点オール/)).toBeInTheDocument()

    const progress = useProgressStore.getState().practice
    expect(progress.games).toBe(1)
    expect(progress.wins).toBe(1)
    expect(progress.bestPoints).toBeGreaterThan(0)
    expect(progress.bestYakuList.length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'もう一局' }))
    expect(screen.queryByText(/点オール/)).not.toBeInTheDocument()
    expect(screen.getByText('ミニ実戦')).toBeInTheDocument()
  }, 20000)

  it('テンパイに取れない手ではリーチもツモ和了も押せない', () => {
    useGameStore.setState({ game: NO_TENPAI_STATE })
    render(<PracticePage />)
    expect(screen.getByRole('button', { name: 'リーチ' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'ツモ和了' })).toBeDisabled()
    expect(screen.queryByText('テンパイ')).not.toBeInTheDocument()
  })

  it('補助なしでは向聴数も待ちも表示しない', () => {
    useSettingsStore.setState({ assistLevel: 'none' })
    useGameStore.setState({ game: TENPAI_STATE })
    render(<PracticePage />)
    expect(screen.queryByText('テンパイ')).not.toBeInTheDocument()
    expect(screen.queryByText(/待ち:/)).not.toBeInTheDocument()
  })

  it('半補助では向聴数のみ表示する', () => {
    useSettingsStore.setState({ assistLevel: 'half' })
    useGameStore.setState({ game: TENPAI_STATE })
    render(<PracticePage />)
    expect(screen.getByText('テンパイ')).toBeInTheDocument()
    expect(screen.queryByText(/待ち:/)).not.toBeInTheDocument()
  })
})

describe('PracticePage 流局', () => {
  it('ツモ回数を使い切るとテンパイ流局になり戦績へ記録される', async () => {
    useGameStore.setState({
      game: {
        ...INITIAL_GAME_STATE,
        phase: 'awaitingDraw',
        hand: instances('123456789m22p55s', 'h'),
        wall: instances('111z', 'w'),
        turn: 18,
        maxTurns: 18,
      },
    })
    render(<PracticePage />)
    expect(
      await screen.findByText('流局', undefined, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('テンパイで流局。あと一歩でした'),
    ).toBeInTheDocument()
    expect(screen.getByText('待っていた牌:')).toBeInTheDocument()
    const progress = useProgressStore.getState().practice
    expect(progress.games).toBe(1)
    expect(progress.wins).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: 'もう一局' }))
    expect(screen.getByText('ミニ実戦')).toBeInTheDocument()
  }, 20000)

  it('ノーテンで山が尽きると向聴数つきのメッセージを表示する', async () => {
    useGameStore.setState({
      game: {
        ...INITIAL_GAME_STATE,
        phase: 'awaitingDraw',
        hand: instances('139m139p139s1234z', 'h'),
        wall: [],
        turn: 5,
        maxTurns: 18,
      },
    })
    render(<PracticePage />)
    expect(
      await screen.findByText(/向聴で流局/, undefined, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(screen.queryByText('待っていた牌:')).not.toBeInTheDocument()
  }, 20000)
})
