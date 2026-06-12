import { describe, expect, it } from 'vitest'
import { SCORE_QUESTIONS } from '@/content/quizzes/scoreQuestions'
import { paymentLabel, solveScore } from '@/features/quiz/quizEngine'

describe('review: score question answers', () => {
  it('prints engine answers for every question', () => {
    const rows = SCORE_QUESTIONS.map((q) => {
      const result = solveScore(q)
      return {
        id: q.id,
        answer: paymentLabel(result),
        han: result.totalHan,
        fu: result.fu?.rounded ?? null,
        limit: result.points.limit,
        yaku: result.yaku.map((y) => `${y.name}${y.han ?? ''}`).join('+'),
        dora: result.dora,
        collision: q.distractors.includes(paymentLabel(result)),
      }
    })
    console.log(JSON.stringify(rows, null, 1))
    expect(rows.every((r) => !r.collision)).toBe(true)
  })
})
