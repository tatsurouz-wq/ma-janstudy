import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { motion } from 'framer-motion'
import type { QuizCategory } from '@/content/quizzes/types'
import { WAIT_QUESTIONS } from '@/content/quizzes/waitQuestions'
import { YAKU_QUESTIONS } from '@/content/quizzes/yakuQuestions'
import { SCORE_QUESTIONS } from '@/content/quizzes/scoreQuestions'
import { useProgressStore } from '@/state/progressStore'
import { ScorePanel } from './ScorePanel'
import { WaitPanel } from './WaitPanel'
import { YakuPanel } from './YakuPanel'

const CATEGORY_TITLES: Readonly<Record<QuizCategory, string>> = {
  wait: '待ち当てクイズ',
  yaku: '役当てクイズ',
  score: '点数当てクイズ',
}

const QUESTIONS_PER_SESSION = 8

const shuffle = <T,>(items: readonly T[]): readonly T[] =>
  [...items]
    .map((item) => ({ item, key: Math.random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item)

export function QuizSessionPage() {
  const { category } = useParams<{ category: QuizCategory }>()
  const recordQuizAnswer = useProgressStore((s) => s.recordQuizAnswer)
  const wrongIds = useProgressStore(
    (s) => s.quiz[category ?? 'wait'].wrongIds,
  )

  const questions = useMemo(() => {
    if (category === undefined) {
      return []
    }
    const bank =
      category === 'wait'
        ? WAIT_QUESTIONS
        : category === 'yaku'
          ? YAKU_QUESTIONS
          : SCORE_QUESTIONS
    const wrongs = bank.filter((q) => wrongIds.includes(q.id))
    const rest = bank.filter((q) => !wrongIds.includes(q.id))
    return [...shuffle(wrongs), ...shuffle(rest)].slice(
      0,
      QUESTIONS_PER_SESSION,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)

  if (category === undefined || questions.length === 0) {
    return <p className="text-text-secondary">クイズが見つかりません。</p>
  }

  const question = questions[index]
  const finished = index >= questions.length

  const handleAnswered = (isCorrect: boolean) => {
    if (question === undefined) {
      return
    }
    setAnswered(true)
    setLastCorrect(isCorrect)
    setCorrectCount((c) => c + (isCorrect ? 1 : 0))
    setStreak((s) => (isCorrect ? s + 1 : 0))
    recordQuizAnswer(category, question.id, isCorrect)
  }

  const next = () => {
    setIndex((i) => i + 1)
    setAnswered(false)
    setLastCorrect(null)
  }

  if (finished || question === undefined) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <h1 className="font-mincho text-3xl font-bold tracking-wider">
          結果発表
        </h1>
        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-mincho text-5xl font-bold text-gold-300"
        >
          {correctCount} / {questions.length}
        </motion.p>
        <p className="text-text-secondary">
          {correctCount === questions.length
            ? '全問正解です。お見事！'
            : '間違えた問題は次回のセッションで優先的に出題されます。'}
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/quiz"
            className="rounded-xl border border-gold-line px-6 py-2.5 text-sm text-text-secondary hover:bg-surface-700"
          >
            クイズ一覧へ
          </Link>
          <button
            type="button"
            onClick={() => {
              setIndex(0)
              setCorrectCount(0)
              setStreak(0)
              setAnswered(false)
            }}
            className="rounded-xl bg-gold-500 px-6 py-2.5 text-sm font-medium text-ink-950 hover:brightness-110"
          >
            もう一度挑戦
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mincho text-2xl font-bold tracking-wider">
          {CATEGORY_TITLES[category]}
        </h1>
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span>
            問 {index + 1} / {questions.length}
          </span>
          {streak >= 2 ? (
            <span className="text-gold-300">{streak}連続正解中</span>
          ) : null}
          <Link to="/quiz" className="hover:text-gold-300">
            中断
          </Link>
        </div>
      </div>

      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.24 }}
      >
          {category === 'wait' ? (
            <WaitPanel
              key={question.id}
              question={WAIT_QUESTIONS.find((q) => q.id === question.id) ?? WAIT_QUESTIONS[0]!}
              onAnswered={handleAnswered}
              answered={answered}
            />
          ) : category === 'yaku' ? (
            <YakuPanel
              key={question.id}
              question={YAKU_QUESTIONS.find((q) => q.id === question.id) ?? YAKU_QUESTIONS[0]!}
              onAnswered={handleAnswered}
              answered={answered}
            />
          ) : (
            <ScorePanel
              key={question.id}
              question={SCORE_QUESTIONS.find((q) => q.id === question.id) ?? SCORE_QUESTIONS[0]!}
              onAnswered={handleAnswered}
              answered={answered}
            />
        )}
      </motion.div>

      {answered ? (
        <div className="flex items-center justify-between">
          <motion.p
            initial={{ scale: 1.3, rotate: -6, opacity: 0 }}
            animate={{ scale: 1, rotate: lastCorrect === true ? -4 : 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className={`font-mincho text-2xl font-bold ${
              lastCorrect === true ? 'text-ok-400' : 'text-ng-400'
            }`}
            aria-live="polite"
          >
            {lastCorrect === true ? '正解' : '不正解'}
          </motion.p>
          <button
            type="button"
            onClick={next}
            className="rounded-xl bg-gold-500 px-8 py-2.5 font-medium text-ink-950 transition-all hover:brightness-110"
          >
            {index + 1 < questions.length ? '次の問題へ' : '結果を見る'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
