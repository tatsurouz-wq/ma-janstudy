import type { QuizContext } from '@/content/quizzes/types'
import { tileName } from '@/core/tiles/tileNames'

const WIND_LABELS: readonly string[] = ['東', '南', '西', '北']

export function ContextChips({ context }: { readonly context: QuizContext }) {
  const mutableChips: string[] = [
    context.winType === 'tsumo' ? 'ツモ' : 'ロン',
    `${WIND_LABELS[context.roundWind - 1]}場`,
    `自風${WIND_LABELS[context.seatWind - 1]}`,
  ]
  if (context.riichi === true) {
    mutableChips.push('リーチ')
  }
  if (context.ippatsu === true) {
    mutableChips.push('一発')
  }
  if (context.doraIndicators !== undefined && context.doraIndicators.length > 0) {
    mutableChips.push(
      `ドラ表示: ${context.doraIndicators.map((t) => tileName(t)).join('・')}`,
    )
  }
  if (context.uraIndicators !== undefined && context.uraIndicators.length > 0) {
    mutableChips.push(
      `裏ドラ表示: ${context.uraIndicators.map((t) => tileName(t)).join('・')}`,
    )
  }
  if (context.redFives !== undefined && context.redFives > 0) {
    mutableChips.push(`赤ドラ${context.redFives}枚`)
  }
  return (
    <div className="flex flex-wrap gap-2">
      {mutableChips.map((chip) => (
        <span
          key={chip}
          className="rounded-full border border-gold-line bg-surface-800 px-3 py-0.5 text-xs text-text-secondary"
        >
          {chip}
        </span>
      ))}
    </div>
  )
}
