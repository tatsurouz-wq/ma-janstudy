import { Link } from 'react-router'
import { LESSONS } from '@/content/lessons'
import { useProgressStore } from '@/state/progressStore'

interface ModeCard {
  readonly to: string
  readonly title: string
  readonly description: string
}

const MODES: readonly ModeCard[] = [
  {
    to: '/lessons',
    title: 'レッスン',
    description: '牌を動かしながら8章でルールを学ぶ',
  },
  {
    to: '/quiz',
    title: 'クイズ',
    description: '待ち当て・役当て・点数当てで腕試し',
  },
  {
    to: '/calculator',
    title: '点数計算機',
    description: '手牌を作ると役・符・点数を自動判定',
  },
  {
    to: '/practice',
    title: 'ミニ実戦',
    description: '一人打ちで和了までの流れを練習',
  },
  {
    to: '/experience',
    title: '3D実戦体験',
    description: '全自動卓の半荘を1人称3Dアニメで体験',
  },
]

export function HomePage() {
  const completedLessons = useProgressStore((s) => s.completedLessons)
  const quiz = useProgressStore((s) => s.quiz)
  const practice = useProgressStore((s) => s.practice)

  const quizAttempts = quiz.wait.attempts + quiz.yaku.attempts + quiz.score.attempts
  const quizCorrect = quiz.wait.correct + quiz.yaku.correct + quiz.score.correct
  const quizRate =
    quizAttempts > 0 ? Math.round((quizCorrect / quizAttempts) * 100) : null

  const stats: Readonly<Record<string, string>> = {
    'レッスン': `${completedLessons.length}/${LESSONS.length}章 修了`,
    'クイズ': quizRate !== null ? `正答率 ${quizRate}%` : 'まだ挑戦していません',
    '点数計算機': 'いつでも使えます',
    'ミニ実戦': practice.games > 0
      ? `${practice.games}局 ${practice.wins}勝`
      : 'まだ対局していません',
    '3D実戦体験': 'NEW: 洗牌から精算まで観る',
  }

  const nextLesson = LESSONS.find((l) => !completedLessons.includes(l.id))

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="font-mincho text-3xl font-bold tracking-wider">
          ようこそ、雀学へ。
        </h1>
        <p className="text-text-secondary">
          麻雀のルールと点数計算を、牌を動かしながら確実に身につける学習アプリです。
        </p>
      </section>

      {nextLesson !== undefined ? (
        <Link
          to={`/lessons/${nextLesson.id}`}
          className="glow-gold block rounded-2xl border border-gold-500 bg-surface-800 p-5 transition-all hover:bg-surface-700"
        >
          <p className="text-xs text-text-secondary">
            {completedLessons.length === 0 ? 'ここから始める' : '続きから学ぶ'}
          </p>
          <p className="mt-1 font-mincho text-xl text-gold-300">
            第{nextLesson.number}章 {nextLesson.title} ▸
          </p>
        </Link>
      ) : (
        <div className="hairline rounded-2xl bg-surface-800 p-5">
          <p className="font-mincho text-xl text-gold-300">
            全8章修了おめでとうございます！
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            クイズとミニ実戦で知識を磨き続けましょう。
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((mode) => (
          <Link
            key={mode.to}
            to={mode.to}
            className="hairline block rounded-2xl bg-surface-800 p-6 shadow-panel transition-all hover:-translate-y-1 hover:bg-surface-700"
          >
            <h2 className="font-mincho text-xl font-semibold text-gold-300">
              {mode.title}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {mode.description}
            </p>
            <p className="mt-3 text-xs text-text-disabled">
              {stats[mode.title]}
            </p>
          </Link>
        ))}
      </section>

      <section>
        <Link
          to="/gallery"
          className="text-sm text-text-secondary underline decoration-dotted underline-offset-4 transition-colors hover:text-gold-300"
        >
          牌ギャラリー（全34種の牌を眺める）
        </Link>
      </section>
    </div>
  )
}
