import { describe, expect, it } from 'vitest'
import { parseTiles } from '@/core/tiles/notation'
import { countsFromTiles } from '@/core/tiles/tileCounts'
import { shanten } from '@/core/hand/shanten'
import { WAIT_QUESTIONS } from '@/content/quizzes/waitQuestions'
import { YAKU_QUESTIONS } from '@/content/quizzes/yakuQuestions'
import { SCORE_QUESTIONS } from '@/content/quizzes/scoreQuestions'
import {
  paymentLabel,
  scoreChoices,
  solveScore,
  solveWaits,
  YAKU_NAME_BY_ID,
} from './quizEngine'

describe('待ち当て問題バンクの検証', () => {
  it.each(WAIT_QUESTIONS.map((q) => [q.id, q] as const))(
    '%s はテンパイで待ちが存在する',
    (_id, question) => {
      const counts = countsFromTiles(parseTiles(question.hand))
      expect(parseTiles(question.hand)).toHaveLength(13)
      expect(shanten(counts)).toBe(0)
      expect(solveWaits(question).length).toBeGreaterThan(0)
    },
  )

  it('IDに重複がない', () => {
    const ids = WAIT_QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('役当て問題バンクの検証', () => {
  it.each(YAKU_QUESTIONS.map((q) => [q.id, q] as const))(
    '%s は和了でき、正解の役がすべて選択肢に含まれる',
    (_id, question) => {
      const result = solveScore(question)
      for (const hit of result.yaku) {
        expect(question.choices).toContain(hit.id)
      }
      const answerIds = new Set(result.yaku.map((y) => y.id))
      const decoys = question.choices.filter((c) => !answerIds.has(c))
      expect(decoys.length).toBeGreaterThan(0)
      for (const choice of question.choices) {
        expect(YAKU_NAME_BY_ID.has(choice)).toBe(true)
      }
    },
  )
})

describe('点数当て問題バンクの検証', () => {
  it.each(SCORE_QUESTIONS.map((q) => [q.id, q] as const))(
    '%s は和了でき、誤答選択肢に正解が混ざっていない',
    (_id, question) => {
      const result = solveScore(question)
      const correct = paymentLabel(result)
      expect(question.distractors).not.toContain(correct)
      expect(new Set(question.distractors).size).toBe(3)
      const choices = scoreChoices(question)
      expect(choices).toHaveLength(4)
      expect(choices).toContain(correct)
    },
  )
})
