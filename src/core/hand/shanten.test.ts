import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  countsFromTiles,
  totalTiles,
  withTileAdded,
  withTileRemoved,
} from '../tiles/tileCounts'
import { parseTiles } from '../tiles/notation'
import { shanten } from './shanten'
import { waitingTiles } from './waits'

const shantenOf = (notation: string, meldCount = 0) =>
  shanten(countsFromTiles(parseTiles(notation)), meldCount)

describe('shanten 既知ベクタ', () => {
  it.each([
    ['123m456p789s11122z', -1],
    ['123m456p789s1122z', 0],
    ['123m456p789s1145z', 1],
    ['123m456p78s1122z9s', 0],
    ['123m456p99s112233z', 1],
    ['147m258p369s1234z', 6],
    ['1112345678999m1z', 0],
    ['1112345678999m', 0],
    ['19m19p19s1234567z', 0],
    ['119m129p19s12345z', 1],
    ['1199m1199p1199s1z', 0],
    ['1199m1199p1199s11z', -1],
    ['1123m445566p79s1z', 1],
    ['13579m13579p135s', 4],
  ])('%s の向聴数は %i', (notation, expected) => {
    expect(shantenOf(notation)).toBe(expected)
  })

  it('副露がある場合は残り手牌だけで計算する', () => {
    expect(shantenOf('123m45p11z', 2)).toBe(0)
    expect(shantenOf('123m455p1z', 2)).toBe(1)
  })

  it('四枚使い: 純カラの単騎テンパイ形は真のテンパイではない', () => {
    expect(shantenOf('1111m567m567p567s')).toBe(1)
  })

  it('四枚使い: 4枚持ちの浮き牌も塔子には発展できる', () => {
    expect(shantenOf('1111p1111s123m99m')).toBe(1)
  })
})

describe('shanten 性質テスト', () => {
  const tileIndexArb = fc.integer({ min: 0, max: 33 })

  const hand13Arb = fc
    .array(tileIndexArb, { minLength: 30, maxLength: 30 })
    .map((indices) => {
      const counts = Array.from({ length: 34 }, () => 0)
      const picked: number[] = []
      for (const i of indices) {
        if (picked.length >= 13) {
          break
        }
        if ((counts[i] ?? 0) < 4) {
          counts[i] = (counts[i] ?? 0) + 1
          picked.push(i)
        }
      }
      let fill = 0
      while (picked.length < 13 && fill < 34) {
        if ((counts[fill] ?? 0) < 4) {
          counts[fill] = (counts[fill] ?? 0) + 1
          picked.push(fill)
        } else {
          fill += 1
        }
      }
      return counts as readonly number[]
    })

  it('13枚の手牌に待ち牌を加えると和了（-1向聴）になる', () => {
    fc.assert(
      fc.property(hand13Arb, (counts) => {
        const waits = waitingTiles(counts)
        for (const w of waits) {
          expect(shanten(withTileAdded(counts, w))).toBe(-1)
        }
        if (waits.length > 0) {
          expect(shanten(counts)).toBe(0)
        }
      }),
      { numRuns: 60 },
    )
  })

  it('1枚交換で向聴数は1より大きく変化しない', () => {
    fc.assert(
      fc.property(hand13Arb, tileIndexArb, tileIndexArb, (counts, out, inn) => {
        if ((counts[out] ?? 0) === 0 || (counts[inn] ?? 0) >= 4 || out === inn) {
          return
        }
        const before = shanten(counts)
        const after = shanten(withTileAdded(withTileRemoved(counts, out), inn))
        expect(Math.abs(after - before)).toBeLessThanOrEqual(1)
      }),
      { numRuns: 80 },
    )
  })

  it('向聴数は-1以上8以下で、手牌は常に13枚', () => {
    fc.assert(
      fc.property(hand13Arb, (counts) => {
        const s = shanten(counts)
        expect(s).toBeGreaterThanOrEqual(-1)
        expect(s).toBeLessThanOrEqual(8)
        expect(totalTiles(counts)).toBe(13)
      }),
      { numRuns: 60 },
    )
  })

  it('テンパイ（0向聴）と判定された13枚手牌には必ず待ち牌が存在する', () => {
    fc.assert(
      fc.property(hand13Arb, (counts) => {
        if (shanten(counts) === 0) {
          expect(waitingTiles(counts).length).toBeGreaterThan(0)
        }
      }),
      { numRuns: 60 },
    )
  })

  it('代表的なテンパイ形は0向聴かつ待ちが存在する', () => {
    const tenpaiHands: readonly string[] = [
      '111m222p333s4455z',
      '2233445566778m',
      '123456789m1122p',
    ]
    for (const hand of tenpaiHands) {
      const counts = countsFromTiles(parseTiles(hand))
      expect(shanten(counts)).toBe(0)
      expect(waitingTiles(counts).length).toBeGreaterThan(0)
    }
  })
})
