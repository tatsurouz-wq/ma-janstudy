import { describe, expect, it } from 'vitest'
import { countsFromTiles } from '../tiles/tileCounts'
import { parseTiles } from '../tiles/notation'
import { isChiitoi, isKokushi, isWinningHand } from './winning'

const counts = (notation: string) => countsFromTiles(parseTiles(notation))

describe('winning', () => {
  it('標準形の和了を判定する', () => {
    expect(isWinningHand(counts('123m456p789s111z22z'))).toBe(true)
    expect(isWinningHand(counts('123m456p789s12z34z5z'))).toBe(false)
  })

  it('七対子を判定する', () => {
    expect(isChiitoi(counts('1199m1199p1199s11z'))).toBe(true)
    expect(isWinningHand(counts('1199m1199p1199s11z'))).toBe(true)
  })

  it('同種4枚は2対子と数えない', () => {
    expect(isChiitoi(counts('1111m99m1199p1199s'))).toBe(false)
  })

  it('国士無双を判定する', () => {
    expect(isKokushi(counts('119m19p19s1234567z'))).toBe(true)
    expect(isWinningHand(counts('119m19p19s1234567z'))).toBe(true)
  })

  it('幺九牌が13種そろわない国士は不成立', () => {
    expect(isKokushi(counts('1129m19p19s123456z7z'))).toBe(false)
  })

  it('枚数が3n+2でない手は和了形でない', () => {
    expect(isWinningHand(counts('123m456p789s1122z'))).toBe(false)
    expect(isWinningHand(counts('123m456p789s1z'))).toBe(false)
  })

  it('副露分を除いた3n+2枚の手牌も和了形として判定できる', () => {
    expect(isWinningHand(counts('123m456p789s11z'))).toBe(true)
  })
})
