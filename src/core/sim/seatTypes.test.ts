import { describe, expect, it } from 'vitest'
import { nextSeat, seatWindFor, turnOrderFrom, USER_SEAT } from './seatTypes'

describe('seatTypes', () => {
  it('ユーザー席は南家（seat 1）', () => {
    expect(USER_SEAT).toBe(1)
  })

  it('nextSeat は反時計回りに循環する', () => {
    expect(nextSeat(0)).toBe(1)
    expect(nextSeat(3)).toBe(0)
  })

  it('seatWindFor: 親が東、以降反時計回りに南西北', () => {
    expect(seatWindFor(0, 0)).toBe(1)
    expect(seatWindFor(1, 0)).toBe(2)
    expect(seatWindFor(3, 0)).toBe(4)
    expect(seatWindFor(0, 1)).toBe(4)
    expect(seatWindFor(1, 1)).toBe(1)
  })

  it('turnOrderFrom は指定席から1周する', () => {
    expect(turnOrderFrom(2)).toEqual([2, 3, 0, 1])
  })
})
