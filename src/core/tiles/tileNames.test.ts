import { describe, expect, it } from 'vitest'
import { tileName, tileReading } from './tileNames'

describe('tileName', () => {
  it('数牌は漢数字+色名', () => {
    expect(tileName('m1')).toBe('一萬')
    expect(tileName('p5')).toBe('五筒')
    expect(tileName('s9')).toBe('九索')
  })

  it('赤5は赤を冠する', () => {
    expect(tileName('m5', true)).toBe('赤五萬')
  })

  it('字牌は1文字の名前', () => {
    expect(tileName('z1')).toBe('東')
    expect(tileName('z5')).toBe('白')
    expect(tileName('z7')).toBe('中')
  })
})

describe('tileReading', () => {
  it('数牌の読み', () => {
    expect(tileReading('m1')).toBe('イーマン')
    expect(tileReading('p3')).toBe('サンピン')
    expect(tileReading('s7')).toBe('チーソー')
  })

  it('字牌の読み', () => {
    expect(tileReading('z2')).toBe('ナン')
    expect(tileReading('z6')).toBe('ハツ')
  })
})
