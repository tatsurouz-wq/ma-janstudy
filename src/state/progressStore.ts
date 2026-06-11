import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QuizCategory } from '@/content/quizzes/types'
import { STORAGE_KEYS, STORAGE_VERSION } from './storageKeys'

export interface QuizCategoryProgress {
  readonly attempts: number
  readonly correct: number
  readonly wrongIds: readonly string[]
}

export interface PracticeStats {
  readonly games: number
  readonly wins: number
  readonly bestPoints: number
  readonly bestYakuList: readonly string[]
}

interface ProgressState {
  readonly quiz: Readonly<Record<QuizCategory, QuizCategoryProgress>>
  readonly completedLessons: readonly string[]
  readonly lessonSteps: Readonly<Record<string, number>>
  readonly practice: PracticeStats
  readonly recordQuizAnswer: (
    category: QuizCategory,
    questionId: string,
    isCorrect: boolean,
  ) => void
  readonly recordLessonStep: (lessonId: string, stepIndex: number) => void
  readonly completeLesson: (lessonId: string) => void
  readonly recordPracticeResult: (
    won: boolean,
    points: number,
    yakuList: readonly string[],
  ) => void
}

const EMPTY_CATEGORY: QuizCategoryProgress = {
  attempts: 0,
  correct: 0,
  wrongIds: [],
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      quiz: { wait: EMPTY_CATEGORY, yaku: EMPTY_CATEGORY, score: EMPTY_CATEGORY },
      completedLessons: [],
      lessonSteps: {},
      practice: { games: 0, wins: 0, bestPoints: 0, bestYakuList: [] },
      recordQuizAnswer: (category, questionId, isCorrect) =>
        set((state) => {
          const current = state.quiz[category]
          const wrongIds = isCorrect
            ? current.wrongIds.filter((id) => id !== questionId)
            : current.wrongIds.includes(questionId)
              ? current.wrongIds
              : [...current.wrongIds, questionId]
          return {
            quiz: {
              ...state.quiz,
              [category]: {
                attempts: current.attempts + 1,
                correct: current.correct + (isCorrect ? 1 : 0),
                wrongIds,
              },
            },
          }
        }),
      recordLessonStep: (lessonId, stepIndex) =>
        set((state) => ({
          lessonSteps: {
            ...state.lessonSteps,
            [lessonId]: Math.max(state.lessonSteps[lessonId] ?? 0, stepIndex),
          },
        })),
      completeLesson: (lessonId) =>
        set((state) => ({
          completedLessons: state.completedLessons.includes(lessonId)
            ? state.completedLessons
            : [...state.completedLessons, lessonId],
        })),
      recordPracticeResult: (won, points, yakuList) =>
        set((state) => ({
          practice: {
            games: state.practice.games + 1,
            wins: state.practice.wins + (won ? 1 : 0),
            bestPoints: Math.max(state.practice.bestPoints, points),
            bestYakuList:
              points > state.practice.bestPoints
                ? yakuList
                : state.practice.bestYakuList,
          },
        })),
    }),
    { name: STORAGE_KEYS.progress, version: STORAGE_VERSION },
  ),
)
