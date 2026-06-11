import { Link } from 'react-router'
import { LESSONS } from '@/content/lessons'
import { useProgressStore } from '@/state/progressStore'

export function LessonsHomePage() {
  const completedLessons = useProgressStore((s) => s.completedLessons)
  const lessonSteps = useProgressStore((s) => s.lessonSteps)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mincho text-3xl font-bold tracking-wider">
          レッスン
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          全8章で麻雀のルールと点数計算を学びます。前の章を修了すると次の章が解放されます。
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LESSONS.map((lesson, index) => {
          const isCompleted = completedLessons.includes(lesson.id)
          const prev = LESSONS[index - 1]
          const isLocked =
            index > 0 && prev !== undefined && !completedLessons.includes(prev.id)
          const progress = lessonSteps[lesson.id] ?? 0
          return (
            <Link
              key={lesson.id}
              to={isLocked ? '#' : `/lessons/${lesson.id}`}
              aria-disabled={isLocked}
              className={`hairline block rounded-2xl bg-surface-800 p-5 shadow-panel transition-all ${
                isLocked
                  ? 'cursor-default opacity-50'
                  : 'hover:-translate-y-1 hover:bg-surface-700'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-mincho text-lg font-semibold">
                  <span className="mr-2 text-gold-500">
                    {String(lesson.number).padStart(2, '0')}
                  </span>
                  <span className={isCompleted ? 'text-text-secondary' : ''}>
                    {lesson.title}
                  </span>
                </h2>
                <span className="text-xs">
                  {isCompleted ? (
                    <span className="text-ok-400">修了</span>
                  ) : isLocked ? (
                    <span className="text-text-disabled">前章で解放</span>
                  ) : progress > 0 ? (
                    <span className="text-gold-300">
                      {progress}/{lesson.steps.length}
                    </span>
                  ) : (
                    <span className="text-text-secondary">未着手</span>
                  )}
                </span>
              </div>
              <p className="mt-2 text-sm text-text-secondary">{lesson.goal}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-700">
                <div
                  className={`h-full rounded-full ${isCompleted ? 'bg-ok-400' : 'bg-gold-500'}`}
                  style={{
                    width: isCompleted
                      ? '100%'
                      : `${Math.min(100, (progress / lesson.steps.length) * 100)}%`,
                  }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
