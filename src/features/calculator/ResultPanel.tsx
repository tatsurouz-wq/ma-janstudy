import { motion } from 'framer-motion'
import type { ScoreOutcome } from '@/core/score/types'
import { StepPlayer } from '@/components/score/StepPlayer'

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  'invalid-hand': '手牌の枚数が足りません',
  'not-winning': 'この手牌は和了形ではありません（4面子1雀頭・七対子・国士無双のいずれでもありません）',
  'no-yaku': '役がありません。役が最低1つないと和了できません（ドラは役になりません）',
}

const LIMIT_LABELS: Readonly<Record<string, string>> = {
  mangan: '満貫',
  haneman: '跳満',
  baiman: '倍満',
  sanbaiman: '三倍満',
  yakuman: '役満',
}

interface ResultPanelProps {
  readonly outcome: ScoreOutcome | null
  readonly tilesNeeded: number
}

export function ResultPanel({ outcome, tilesNeeded }: ResultPanelProps) {
  if (outcome === null) {
    return (
      <div className="hairline rounded-2xl bg-surface-800 p-6 text-center text-sm text-text-secondary">
        {tilesNeeded > 0
          ? `あと${tilesNeeded}枚で和了形です。牌を選んでください。`
          : '手牌を作ると自動で計算します。'}
      </div>
    )
  }
  if (!outcome.ok) {
    return (
      <div className="hairline rounded-2xl bg-surface-800 p-6 text-center text-sm text-ng-400">
        {ERROR_MESSAGES[outcome.reason] ?? '計算できませんでした'}
      </div>
    )
  }

  const { result } = outcome
  const p = result.points.payments
  const totalLabel = `${p.total.toLocaleString()}点`
  const headline =
    result.points.limit !== 'none'
      ? `${LIMIT_LABELS[result.points.limit] ?? ''} ${totalLabel}`
      : `${result.fu?.rounded ?? 0}符${result.totalHan}翻 ${totalLabel}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="hairline space-y-5 rounded-2xl bg-surface-800 p-6"
      aria-live="polite"
    >
      <div className="space-y-1 text-center">
        <p className="text-sm text-text-secondary">
          {p.type === 'ron'
            ? 'ロン和了'
            : p.type === 'tsumo-dealer'
              ? '親のツモ和了'
              : '子のツモ和了'}
        </p>
        <motion.p
          key={headline}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="font-mincho text-4xl font-bold tracking-wide text-gold-300"
        >
          {headline}
        </motion.p>
        {p.type === 'tsumo-nondealer' ? (
          <p className="text-sm text-text-secondary">
            親から{p.fromDealer.toLocaleString()}点 / 子から
            {p.fromOthers.toLocaleString()}点ずつ
          </p>
        ) : p.type === 'tsumo-dealer' ? (
          <p className="text-sm text-text-secondary">
            全員から{p.fromEach.toLocaleString()}点ずつ
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {result.yaku.map((hit) => (
          <span
            key={hit.id}
            className="rounded-full border border-gold-line bg-surface-700 px-3 py-1 text-sm"
          >
            <span className="font-mincho text-gold-300">{hit.name}</span>
            <span className="ml-1.5 text-xs text-text-secondary">
              {hit.isYakuman
                ? hit.isDouble
                  ? 'ダブル役満'
                  : '役満'
                : `${hit.han}翻`}
            </span>
          </span>
        ))}
        {result.dora.omote + result.dora.ura + result.dora.aka > 0 ? (
          <span className="rounded-full border border-gold-line bg-surface-700 px-3 py-1 text-sm">
            <span className="text-gold-300">ドラ</span>
            <span className="ml-1.5 text-xs text-text-secondary">
              {result.dora.omote + result.dora.ura + result.dora.aka}翻
            </span>
          </span>
        ) : null}
      </div>

      <details className="group" open>
        <summary className="cursor-pointer text-sm text-text-secondary transition-colors hover:text-gold-300">
          計算過程をステップで見る
        </summary>
        <div className="mt-3">
          <StepPlayer steps={result.steps} />
        </div>
      </details>
    </motion.div>
  )
}
