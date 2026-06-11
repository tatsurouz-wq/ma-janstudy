import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Difficulty } from '@/core/game/gameState'
import {
  canDeclareRiichi,
  canDeclareTsumo,
  currentShanten,
  currentWaits,
  discardEvaluations,
  solveTsumo,
} from '@/core/game/selectors'
import { indexToTile } from '@/core/tiles/tile'
import { tileName } from '@/core/tiles/tileNames'
import { TileSvg } from '@/components/tiles/TileSvg'
import { useGameStore } from '@/state/gameStore'
import { useProgressStore } from '@/state/progressStore'
import type { AssistLevel } from '@/state/settingsStore'
import { useSettingsStore } from '@/state/settingsStore'
import { PracticeHand } from './PracticeHand'
import { RiverView } from './RiverView'
import { WinOverlay } from './WinOverlay'

const DIFFICULTIES: readonly {
  readonly value: Difficulty
  readonly label: string
  readonly description: string
}[] = [
  { value: 'easy', label: 'かんたん', description: '2向聴以内の配牌・18巡' },
  { value: 'normal', label: 'ふつう', description: '4向聴以内の配牌・18巡' },
  { value: 'hard', label: 'むずかしい', description: '完全ランダム配牌・15巡' },
]

const ASSIST_LEVELS: readonly {
  readonly value: AssistLevel
  readonly label: string
}[] = [
  { value: 'full', label: 'フル補助' },
  { value: 'half', label: '半補助' },
  { value: 'none', label: '補助なし' },
]

export function PracticePage() {
  const game = useGameStore((s) => s.game)
  const dispatch = useGameStore((s) => s.dispatch)
  const assistLevel = useSettingsStore((s) => s.assistLevel)
  const setAssistLevel = useSettingsStore((s) => s.setAssistLevel)
  const recordPracticeResult = useProgressStore((s) => s.recordPracticeResult)
  const practice = useProgressStore((s) => s.practice)

  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [riichiSelect, setRiichiSelect] = useState(false)

  useEffect(() => {
    if (game.phase === 'awaitingDraw') {
      const willExhaust =
        game.turn >= game.maxTurns || game.wall.length === 0
      const timer = window.setTimeout(() => {
        if (willExhaust) {
          recordPracticeResult(false, 0, [])
        }
        dispatch({ type: 'DRAW' })
      }, 250)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [
    game.phase,
    game.turn,
    game.maxTurns,
    game.wall.length,
    dispatch,
    recordPracticeResult,
  ])

  const startGame = () => {
    setSelectedId(null)
    setRiichiSelect(false)
    dispatch({ type: 'START', seed: Date.now() % 2147483647, difficulty })
  }

  const declareTsumo = () => {
    const result = solveTsumo(game)
    if (result !== null) {
      recordPracticeResult(
        true,
        result.points.payments.total,
        result.yaku.map((y) => y.name),
      )
    }
    dispatch({ type: 'DECLARE_TSUMO' })
  }

  const shantenNow = currentShanten(game)
  const waits = currentWaits(game)
  const evaluations =
    game.phase === 'awaitingDiscard' ? discardEvaluations(game) : []
  const showShanten = assistLevel !== 'none'
  const showEvaluations = assistLevel === 'full'
  const showWaits = assistLevel === 'full' && waits.length > 0

  const handleTileTap = (tileId: string) => {
    if (game.phase !== 'awaitingDiscard') {
      return
    }
    if (riichiSelect) {
      dispatch({ type: 'DECLARE_RIICHI', discardTileId: tileId })
      setRiichiSelect(false)
      setSelectedId(null)
      return
    }
    if (selectedId === tileId) {
      dispatch({ type: 'DISCARD', tileId })
      setSelectedId(null)
    } else {
      setSelectedId(tileId)
    }
  }

  if (game.phase === 'ready') {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <div>
          <h1 className="font-mincho text-3xl font-bold tracking-wider">
            ミニ実戦（一人打ち）
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            ツモと打牌を繰り返して、制限ツモ回数以内の和了を目指します。和了すると点数計算の解説つき。相手はいないので、自分のペースで「ツモ→切る→テンパイ→リーチ→和了」の流れを体に覚えさせましょう。
          </p>
          <p className="mt-1 text-xs text-text-disabled">
            配牌は13枚で、最初のツモが親の14枚目に相当します（この練習ではあなたが親です）。
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">難易度</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                aria-pressed={difficulty === d.value}
                onClick={() => setDifficulty(d.value)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  difficulty === d.value
                    ? 'glow-gold border-gold-500 bg-surface-700'
                    : 'hairline bg-surface-800 hover:bg-surface-700'
                }`}
              >
                <p className="font-mincho text-gold-300">{d.label}</p>
                <p className="mt-1 text-xs text-text-secondary">
                  {d.description}
                </p>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">学習補助</p>
          <div className="flex gap-2">
            {ASSIST_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                aria-pressed={assistLevel === level.value}
                onClick={() => setAssistLevel(level.value)}
                className={`rounded-lg border px-4 py-1.5 text-sm transition-colors ${
                  assistLevel === level.value
                    ? 'border-gold-500 bg-gold-500 font-medium text-ink-950'
                    : 'border-gold-line bg-surface-800 text-text-secondary hover:bg-surface-700'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
        {practice.games > 0 ? (
          <p className="text-xs text-text-disabled">
            これまでの戦績: {practice.games}局 {practice.wins}勝 / 最高
            {practice.bestPoints.toLocaleString()}点
          </p>
        ) : null}
        <button
          type="button"
          onClick={startGame}
          className="w-full rounded-xl bg-gold-500 py-3 text-lg font-medium text-ink-950 transition-all hover:brightness-110"
        >
          対局開始
        </button>
      </div>
    )
  }

  if (game.phase === 'exhausted') {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <h1 className="font-mincho text-3xl font-bold tracking-wider">流局</h1>
        <p className="text-text-secondary">
          {shantenNow === 0
            ? 'テンパイで流局。あと一歩でした'
            : `${shantenNow}向聴で流局。次は形を早く整えてみましょう`}
        </p>
        {waits.length > 0 ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-text-secondary">待っていた牌:</span>
            {waits.map((i) => (
              <TileSvg key={i} tile={indexToTile(i)} size="xs" />
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={startGame}
          className="rounded-xl bg-gold-500 px-8 py-2.5 font-medium text-ink-950 hover:brightness-110"
        >
          もう一局
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mincho text-2xl font-bold tracking-wider">
          ミニ実戦
        </h1>
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span>
            残りツモ <span className="font-bold tabular-nums text-text-primary">{game.maxTurns - game.turn}</span> 回
          </span>
          <span className="flex items-center gap-1.5">
            ドラ表示
            {game.doraIndicators.map((t) => (
              <TileSvg key={t.id} tile={t.tile} isRed={t.isRed} size="xs" />
            ))}
          </span>
          {game.isRiichi ? (
            <span className="rounded border border-lacquer-600 px-2 py-0.5 text-xs font-bold text-lacquer-600">
              リーチ中
            </span>
          ) : null}
        </div>
      </div>

      <RiverView discards={game.discards} riichiTileId={game.riichiTileId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          {showShanten ? (
            <motion.span
              key={shantenNow}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`rounded-lg border px-3 py-1 ${
                shantenNow <= 0
                  ? 'border-gold-500 text-gold-300'
                  : 'border-gold-line text-text-secondary'
              }`}
            >
              {shantenNow === -1
                ? '和了形！'
                : shantenNow === 0
                  ? 'テンパイ'
                  : `${shantenNow}向聴`}
            </motion.span>
          ) : null}
          {showWaits ? (
            <span className="flex items-center gap-1.5 text-text-secondary">
              待ち:
              {waits.map((i) => (
                <span key={i}>{tileName(indexToTile(i))}</span>
              ))}
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          {riichiSelect ? (
            <button
              type="button"
              onClick={() => setRiichiSelect(false)}
              className="rounded-xl border border-gold-line px-5 py-2 text-sm text-text-secondary hover:bg-surface-700"
            >
              リーチをやめる
            </button>
          ) : (
            <button
              type="button"
              disabled={!canDeclareRiichi(game)}
              onClick={() => {
                setRiichiSelect(true)
                setSelectedId(null)
              }}
              className="rounded-xl border-2 border-gold-600 bg-lacquer-600 px-6 py-2 font-mincho font-bold text-text-primary transition-all hover:brightness-110 disabled:opacity-30"
            >
              リーチ
            </button>
          )}
          <button
            type="button"
            disabled={!canDeclareTsumo(game)}
            onClick={declareTsumo}
            className="rounded-xl bg-gold-500 px-6 py-2 font-mincho font-bold text-ink-950 transition-all hover:brightness-110 disabled:opacity-30"
          >
            ツモ和了
          </button>
        </div>
      </div>

      <PracticeHand
        hand={game.hand}
        drawnTile={game.drawnTile}
        selectedId={selectedId}
        riichiSelect={riichiSelect}
        evaluations={evaluations}
        showEvaluations={showEvaluations}
        onTileTap={handleTileTap}
        disabled={game.phase !== 'awaitingDiscard'}
      />
      <p className="text-xs text-text-disabled">
        {riichiSelect
          ? '金色の点がついた牌を切るとリーチ宣言になります'
          : '牌をタップで選択、もう一度タップで捨てます。' +
            (game.isRiichi ? 'リーチ中はツモった牌しか捨てられません。' : '')}
      </p>

      {game.phase === 'won' && game.result !== null ? (
        <WinOverlay result={game.result} onNextGame={startGame} />
      ) : null}
    </div>
  )
}
