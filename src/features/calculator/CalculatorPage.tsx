import { useMemo, useReducer, useState } from 'react'
import type { Tile } from '@/core/tiles/tile'
import type { ScoreOutcome } from '@/core/score/types'
import { calculateScore } from '@/core/score/calculate'
import { DEFAULT_RULE } from '@/core/rules/ruleset'
import { ContextForm } from './ContextForm'
import { HandBuilder } from './HandBuilder'
import { ResultPanel } from './ResultPanel'
import { TilePicker } from './TilePicker'
import {
  calculatorReducer,
  concealedCapacity,
  INITIAL_CALCULATOR_STATE,
  usedTileCount,
} from './calculatorState'

export function CalculatorPage() {
  const [state, dispatch] = useReducer(
    calculatorReducer,
    INITIAL_CALCULATOR_STATE,
  )
  const [doraPickerTarget, setDoraPickerTarget] = useState<
    'omote' | 'ura' | null
  >(null)

  const tilesNeeded = concealedCapacity(state) - state.concealed.length

  const outcome: ScoreOutcome | null = useMemo(() => {
    if (tilesNeeded !== 0 || state.winTileIndex === null) {
      return null
    }
    const winPicked = state.concealed[state.winTileIndex]
    if (winPicked === undefined) {
      return null
    }
    return calculateScore({
      concealed: state.concealed.map((t) => t.tile),
      melds: state.melds,
      winTile: winPicked.tile,
      win: {
        winType: state.winType,
        riichi: state.riichi,
        ippatsu: state.ippatsu,
        haitei: false,
        houtei: false,
        rinshan: false,
        chankan: false,
        tenhou: false,
        chiihou: false,
        seatWind: state.seatWind,
        roundWind: state.roundWind,
      },
      doraIndicators: state.doraIndicators,
      uraIndicators: state.uraIndicators,
      redFives: state.concealed.filter((t) => t.isRed).length,
      honba: state.honba,
      kyotaku: 0,
      rule: DEFAULT_RULE,
    })
  }, [state, tilesNeeded])

  const usedRedFives = useMemo(
    () =>
      new Set(
        state.concealed.filter((t) => t.isRed).map((t) => t.tile as string),
      ),
    [state.concealed],
  )

  const handlePick = (tile: Tile, isRed: boolean) => {
    if (doraPickerTarget !== null) {
      dispatch({ type: 'ADD_DORA', tile, ura: doraPickerTarget === 'ura' })
      setDoraPickerTarget(null)
      return
    }
    dispatch({ type: 'ADD_TILE', tile, isRed })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mincho text-3xl font-bold tracking-wider">
          点数計算機
        </h1>
        <button
          type="button"
          onClick={() => dispatch({ type: 'RESET' })}
          className="rounded-lg border border-gold-line px-4 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-700 hover:text-gold-300"
        >
          リセット
        </button>
      </div>
      <p className="text-sm text-text-secondary">
        牌をクリックして手牌を作ると、役・符・点数を自動で判定し計算過程を解説します。最後に選んだ牌が和了牌になります。
      </p>

      <HandBuilder
        state={state}
        onRemoveTile={(index) => dispatch({ type: 'REMOVE_TILE', index })}
        onSetWinTile={(index) => dispatch({ type: 'SET_WIN_TILE', index })}
        onRemoveMeld={(index) => dispatch({ type: 'REMOVE_MELD', index })}
      />

      <div className="hairline rounded-2xl bg-surface-800 p-5">
        {doraPickerTarget !== null ? (
          <p className="mb-3 text-sm text-gold-300">
            {doraPickerTarget === 'omote' ? 'ドラ表示牌' : '裏ドラ表示牌'}
            を選んでください
          </p>
        ) : null}
        <TilePicker
          remainingOf={(tile) => 4 - usedTileCount(state, tile)}
          onPick={handlePick}
          usedRedFives={usedRedFives}
        />
      </div>

      <ContextForm
        state={state}
        dispatch={dispatch}
        doraPickerTarget={doraPickerTarget}
        onToggleDoraPicker={(target) =>
          setDoraPickerTarget((current) =>
            current === target ? null : target,
          )
        }
      />

      <ResultPanel outcome={outcome} tilesNeeded={tilesNeeded} />
    </div>
  )
}
