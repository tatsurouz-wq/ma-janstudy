import { Link } from 'react-router'
import type { QuizCategory } from '@/content/quizzes/types'
import { useProgressStore } from '@/state/progressStore'

const CATEGORIES: readonly {
  readonly id: QuizCategory
  readonly title: string
  readonly description: string
}[] = [
  {
    id: 'wait',
    title: '待ち当て',
    description: 'テンパイ手牌の和了牌をすべて当てる。待ちの形の総仕上げ',
  },
  {
    id: 'yaku',
    title: '役当て',
    description: '和了形から成立している役を見抜く。引っかけ問題あり',
  },
  {
    id: 'score',
    title: '点数当て',
    description: '翻と符から支払い点数を導く。点数計算の実戦練習',
  },
]

export function QuizHomePage() {
  const quiz = useProgressStore((s) => s.quiz)
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mincho text-3xl font-bold tracking-wider">
          クイズ
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          1セッション8問。間違えた問題は次回優先的に出題されます。
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CATEGORIES.map((category) => {
          const stats = quiz[category.id]
          const rate =
            stats.attempts > 0
              ? Math.round((stats.correct / stats.attempts) * 100)
              : null
          return (
            <Link
              key={category.id}
              to={`/quiz/${category.id}`}
              className="hairline block rounded-2xl bg-surface-800 p-6 shadow-panel transition-all hover:-translate-y-1 hover:bg-surface-700"
            >
              <h2 className="font-mincho text-xl font-semibold text-gold-300">
                {category.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {category.description}
              </p>
              <p className="mt-4 text-xs text-text-disabled">
                {rate !== null
                  ? `正答率 ${rate}%（${stats.correct}/${stats.attempts}問）`
                  : 'まだ挑戦していません'}
                {stats.wrongIds.length > 0
                  ? ` / 復習待ち${stats.wrongIds.length}問`
                  : ''}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
