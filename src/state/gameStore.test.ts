import { beforeEach, describe, expect, it } from 'vitest'
import { INITIAL_GAME_STATE } from '@/core/game/gameState'
import { useGameStore } from './gameStore'

beforeEach(() => {
  useGameStore.setState({ game: INITIAL_GAME_STATE })
})

describe('gameStore', () => {
  it('初期状態は ready フェーズ', () => {
    const { game } = useGameStore.getState()
    expect(game.phase).toBe('ready')
    expect(game.hand).toHaveLength(0)
  })

  it('START で配牌されて awaitingDraw になる', () => {
    useGameStore
      .getState()
      .dispatch({ type: 'START', seed: 42, difficulty: 'easy' })
    const { game } = useGameStore.getState()
    expect(game.phase).toBe('awaitingDraw')
    expect(game.difficulty).toBe('easy')
    expect(game.hand).toHaveLength(13)
    expect(game.doraIndicators).toHaveLength(1)
  })

  it('DRAW でツモ牌が手に入り awaitingDiscard になる', () => {
    useGameStore
      .getState()
      .dispatch({ type: 'START', seed: 42, difficulty: 'normal' })
    useGameStore.getState().dispatch({ type: 'DRAW' })
    const { game } = useGameStore.getState()
    expect(game.phase).toBe('awaitingDiscard')
    expect(game.drawnTile).not.toBeNull()
    expect(game.turn).toBe(1)
  })

  it('DISCARD で打牌されて awaitingDraw に戻る', () => {
    useGameStore
      .getState()
      .dispatch({ type: 'START', seed: 42, difficulty: 'normal' })
    useGameStore.getState().dispatch({ type: 'DRAW' })
    const drawn = useGameStore.getState().game.drawnTile
    expect(drawn).not.toBeNull()
    useGameStore
      .getState()
      .dispatch({ type: 'DISCARD', tileId: drawn?.id ?? '' })
    const { game } = useGameStore.getState()
    expect(game.phase).toBe('awaitingDraw')
    expect(game.drawnTile).toBeNull()
    expect(game.discards).toHaveLength(1)
    expect(game.hand).toHaveLength(13)
  })

  it('ready フェーズでは DRAW を無視する', () => {
    useGameStore.getState().dispatch({ type: 'DRAW' })
    expect(useGameStore.getState().game).toEqual(INITIAL_GAME_STATE)
  })
})
