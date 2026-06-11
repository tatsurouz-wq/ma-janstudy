import { describe, expect, it } from 'vitest'
import {
  ALL_TILES,
  honorRank,
  indexToTile,
  isHonor,
  isNumberTile,
  isTerminal,
  isYaochuu,
  numberRank,
  suitOf,
  tileToIndex,
} from './tile'

describe('tile', () => {
  it('ALL_TILES は34種を index 順に列挙する', () => {
    expect(ALL_TILES).toHaveLength(34)
    expect(ALL_TILES[0]).toBe('m1')
    expect(ALL_TILES[8]).toBe('m9')
    expect(ALL_TILES[9]).toBe('p1')
    expect(ALL_TILES[18]).toBe('s1')
    expect(ALL_TILES[27]).toBe('z1')
    expect(ALL_TILES[33]).toBe('z7')
  })

  it('tileToIndex と indexToTile は逆変換になっている', () => {
    for (const [i, tile] of ALL_TILES.entries()) {
      expect(tileToIndex(tile)).toBe(i)
      expect(indexToTile(i)).toBe(tile)
    }
  })

  it('suitOf はスートを返す', () => {
    expect(suitOf('m3')).toBe('m')
    expect(suitOf('p9')).toBe('p')
    expect(suitOf('s1')).toBe('s')
    expect(suitOf('z5')).toBe('z')
  })

  it('数牌と字牌を区別する', () => {
    expect(isNumberTile('m1')).toBe(true)
    expect(isNumberTile('z1')).toBe(false)
    expect(isHonor('z7')).toBe(true)
    expect(isHonor('s5')).toBe(false)
  })

  it('numberRank は数牌のランクを返す', () => {
    expect(numberRank('m1')).toBe(1)
    expect(numberRank('s9')).toBe(9)
    expect(numberRank('z3')).toBeNull()
  })

  it('honorRank は字牌のランクを返す', () => {
    expect(honorRank('z1')).toBe(1)
    expect(honorRank('z7')).toBe(7)
    expect(honorRank('m5')).toBeNull()
  })

  it('老頭牌（1・9）を判定する', () => {
    expect(isTerminal('m1')).toBe(true)
    expect(isTerminal('p9')).toBe(true)
    expect(isTerminal('s5')).toBe(false)
    expect(isTerminal('z1')).toBe(false)
  })

  it('幺九牌（1・9・字牌）を判定する', () => {
    expect(isYaochuu('m1')).toBe(true)
    expect(isYaochuu('z6')).toBe(true)
    expect(isYaochuu('p2')).toBe(false)
  })
})
