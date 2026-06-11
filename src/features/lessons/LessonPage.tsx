import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { motion } from 'framer-motion'
import type { LessonStep } from '@/content/lessons/types'
import { LESSONS } from '@/content/lessons'
import { useProgressStore } from '@/state/progressStore'
import { ChoiceQuizStepView } from './steps/ChoiceQuizStepView'
import { CompareStepView } from './steps/CompareStepView'
import { GroupBuildStepView } from './steps/GroupBuildStepView'
import { OrderSequenceStepView } from './steps/OrderSequenceStepView'
import { SelectFromPaletteStepView } from './steps/SelectFromPaletteStepView'
import { SortToZonesStepView } from './steps/SortToZonesStepView'
import { TextStepView } from './steps/TextStepView'

const AUTO_COMPLETE_KINDS: ReadonlySet<LessonStep['kind']> = new Set([
  'text',
  'compare',
])

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const lesson = LESSONS.find((l) => l.id === lessonId)
  const recordLessonStep = useProgressStore((s) => s.recordLessonStep)
  const completeLesson = useProgressStore((s) => s.completeLesson)

  const [stepIndex, setStepIndex] = useState(0)
  const [stepDone, setStepDone] = useState(false)
  const [finished, setFinished] = useState(false)

  const step = lesson?.steps[stepIndex]

  if (lesson === undefined || step === undefined) {
    return <p className="text-text-secondary">レッスンが見つかりません。</p>
  }

  const isStepDone = stepDone || AUTO_COMPLETE_KINDS.has(step.kind)
  const isLast = stepIndex === lesson.steps.length - 1

  const goNext = () => {
    recordLessonStep(lesson.id, stepIndex + 1)
    if (isLast) {
      completeLesson(lesson.id)
      setFinished(true)
      return
    }
    setStepIndex((i) => i + 1)
    setStepDone(false)
  }

  const goPrev = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1)
      setStepDone(false)
    }
  }

  if (finished) {
    const next = LESSONS.find((l) => l.number === lesson.number + 1)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg space-y-6 py-10 text-center"
      >
        <div className="hairline mx-auto max-w-sm rounded-2xl bg-surface-800 p-8 shadow-panel">
          <p className="text-sm text-text-secondary">修了認定</p>
          <h1 className="mt-2 font-mincho text-3xl font-bold tracking-widest text-gold-300">
            第{lesson.number}章 {lesson.title}
          </h1>
          <p className="mt-4 text-sm text-text-secondary">{lesson.goal}</p>
        </div>
        <div className="flex justify-center gap-3">
          <Link
            to="/lessons"
            className="rounded-xl border border-gold-line px-6 py-2.5 text-sm text-text-secondary hover:bg-surface-700"
          >
            章一覧へ
          </Link>
          {next !== undefined ? (
            <button
              type="button"
              onClick={() => {
                setFinished(false)
                setStepIndex(0)
                setStepDone(false)
                void navigate(`/lessons/${next.id}`)
              }}
              className="rounded-xl bg-gold-500 px-6 py-2.5 text-sm font-medium text-ink-950 hover:brightness-110"
            >
              第{next.number}章へ進む
            </button>
          ) : (
            <Link
              to="/quiz"
              className="rounded-xl bg-gold-500 px-6 py-2.5 text-sm font-medium text-ink-950 hover:brightness-110"
            >
              クイズで腕試し
            </Link>
          )}
        </div>
      </motion.div>
    )
  }

  const markDone = () => setStepDone(true)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/lessons"
            className="text-xs text-text-secondary hover:text-gold-300"
          >
            ◂ 章一覧
          </Link>
          <h1 className="font-mincho text-2xl font-bold tracking-wider">
            第{lesson.number}章 {lesson.title}
          </h1>
        </div>
        <div className="text-right text-sm text-text-secondary">
          <p>
            ステップ {stepIndex + 1} / {lesson.steps.length}
          </p>
          <div className="mt-1 flex gap-1">
            {lesson.steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${
                  i < stepIndex
                    ? 'bg-gold-500'
                    : i === stepIndex
                      ? 'bg-gold-300'
                      : 'bg-surface-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <motion.div
        key={`${lesson.id}-${stepIndex}`}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.24 }}
        className="min-h-72"
      >
          {step.kind === 'text' ? (
            <TextStepView step={step} />
          ) : step.kind === 'sort-to-zones' ? (
            <SortToZonesStepView step={step} onComplete={markDone} />
          ) : step.kind === 'select-from-palette' ? (
            <SelectFromPaletteStepView step={step} onComplete={markDone} />
          ) : step.kind === 'group-build' ? (
            <GroupBuildStepView step={step} onComplete={markDone} />
          ) : step.kind === 'order-sequence' ? (
            <OrderSequenceStepView step={step} onComplete={markDone} />
          ) : step.kind === 'quiz' ? (
            <ChoiceQuizStepView step={step} onComplete={markDone} />
          ) : (
            <CompareStepView step={step} onComplete={markDone} />
        )}
      </motion.div>

      <div className="flex items-center justify-between border-t border-gold-line pt-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIndex === 0}
          className="rounded-xl border border-gold-line px-6 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-700 disabled:opacity-30"
        >
          ◂ 前へ
        </button>
        <motion.button
          type="button"
          onClick={goNext}
          disabled={!isStepDone}
          animate={isStepDone ? { scale: [1, 1.06, 1] } : {}}
          className="rounded-xl bg-gold-500 px-8 py-2.5 font-medium text-ink-950 transition-all hover:brightness-110 disabled:opacity-40"
        >
          {isLast ? '章を修了する' : '次へ ▸'}
        </motion.button>
      </div>
    </div>
  )
}
