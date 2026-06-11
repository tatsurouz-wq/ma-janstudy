import { describe, expect, it } from 'vitest'
import { parseTiles } from '@/core/tiles/notation'
import { countsFromTiles } from '@/core/tiles/tileCounts'
import { decomposeStandard } from '@/core/hand/decompose'
import { shanten } from '@/core/hand/shanten'
import { waitingTiles } from '@/core/hand/waits'
import { calculateScore } from '@/core/score/calculate'
import { DEFAULT_RULE } from '@/core/rules/ruleset'
import { LESSONS } from './index'

describe('レッスンコンテンツの検証', () => {
  it('8章が順番どおりに揃っている', () => {
    expect(LESSONS).toHaveLength(8)
    LESSONS.forEach((lesson, i) => {
      expect(lesson.number).toBe(i + 1)
      expect(lesson.steps.length).toBeGreaterThanOrEqual(4)
    })
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(8)
  })

  for (const lesson of LESSONS) {
    describe(lesson.title, () => {
      lesson.steps.forEach((step, stepIndex) => {
        it(`ステップ${stepIndex + 1}（${step.kind}）が整合している`, () => {
          switch (step.kind) {
            case 'text': {
              if (step.tiles !== undefined) {
                expect(() => parseTiles(step.tiles ?? '')).not.toThrow()
              }
              break
            }
            case 'sort-to-zones': {
              const zoneIds = new Set(step.zones.map((z) => z.id))
              expect(zoneIds.size).toBe(step.zones.length)
              for (const assignment of step.assignments) {
                expect(zoneIds.has(assignment.zone)).toBe(true)
              }
              break
            }
            case 'select-from-palette': {
              if (step.correct === 'waits-of-hand') {
                expect(step.hand).toBeDefined()
                const counts = countsFromTiles(parseTiles(step.hand ?? ''))
                expect(shanten(counts)).toBe(0)
                expect(waitingTiles(counts).length).toBeGreaterThan(0)
              } else {
                const palette =
                  step.palette === 'all'
                    ? null
                    : new Set(parseTiles(step.palette))
                for (const tile of step.correct) {
                  if (palette !== null) {
                    expect(palette.has(tile)).toBe(true)
                  }
                }
              }
              break
            }
            case 'group-build': {
              const tiles = parseTiles(step.tiles)
              expect(tiles).toHaveLength(14)
              expect(
                decomposeStandard(countsFromTiles(tiles)).length,
              ).toBeGreaterThan(0)
              break
            }
            case 'order-sequence': {
              expect([...step.correctOrder].sort()).toEqual(
                step.items.map((i) => i.id).sort(),
              )
              break
            }
            case 'quiz': {
              expect(step.correctIndex).toBeLessThan(step.choices.length)
              if (step.tiles !== undefined) {
                expect(() => parseTiles(step.tiles ?? '')).not.toThrow()
              }
              break
            }
            case 'compare': {
              for (const variant of step.variants) {
                const concealed = parseTiles(variant.hand)
                expect(concealed).toContain(variant.winTile)
                const outcome = calculateScore({
                  concealed,
                  melds: [],
                  winTile: variant.winTile,
                  win: {
                    winType: variant.winType,
                    riichi: 'none',
                    ippatsu: false,
                    haitei: false,
                    houtei: false,
                    rinshan: false,
                    chankan: false,
                    tenhou: false,
                    chiihou: false,
                    seatWind: 2,
                    roundWind: 1,
                  },
                  doraIndicators: [],
                  uraIndicators: [],
                  redFives: 0,
                  honba: 0,
                  kyotaku: 0,
                  rule: DEFAULT_RULE,
                })
                const acceptable =
                  outcome.ok ||
                  (outcome.ok === false && outcome.reason === 'no-yaku')
                expect(acceptable).toBe(true)
              }
              break
            }
          }
        })
      })
    })
  }
})
