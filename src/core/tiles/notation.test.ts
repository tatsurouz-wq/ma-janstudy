import { describe, expect, it } from 'vitest'
import { parseTiles } from './notation'

describe('parseTiles', () => {
  it('スート付き記法をパースする', () => {
    expect(parseTiles('123m')).toEqual(['m1', 'm2', 'm3'])
    expect(parseTiles('19p55z')).toEqual(['p1', 'p9', 'z5', 'z5'])
  })

  it('複数スートを連結できる', () => {
    expect(parseTiles('11m22p33s44z')).toEqual([
      'm1',
      'm1',
      'p2',
      'p2',
      's3',
      's3',
      'z4',
      'z4',
    ])
  })

  it('空白を無視する', () => {
    expect(parseTiles('123m 456p')).toEqual([
      'm1',
      'm2',
      'm3',
      'p4',
      'p5',
      'p6',
    ])
  })

  it('字牌に8以上を使うとエラー', () => {
    expect(() => parseTiles('8z')).toThrow()
  })

  it('スート指定のない数字はエラー', () => {
    expect(() => parseTiles('123')).toThrow()
  })
})
