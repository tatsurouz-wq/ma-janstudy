import { describe, expect, it } from 'vitest'
import { countsFromTiles } from '../tiles/tileCounts'
import { parseTiles } from '../tiles/notation'
import { indexToTile, tileToIndex } from '../tiles/tile'
import { decomposeStandard } from './decompose'
import { waitingTiles, waitShapesIn } from './waits'

const waitsOf = (notation: string): readonly string[] =>
  waitingTiles(countsFromTiles(parseTiles(notation))).map((i) =>
    indexToTile(i),
  )

describe('waitingTiles', () => {
  it('両面待ちの和了牌を列挙する', () => {
    expect(waitsOf('23m456p789s111z22z')).toEqual(['m1', 'm4'])
  })

  it('嵌張待ち', () => {
    expect(waitsOf('13m456p789s111z22z')).toEqual(['m2'])
  })

  it('辺張待ち', () => {
    expect(waitsOf('12m456p789s111z22z')).toEqual(['m3'])
    expect(waitsOf('89m456p789s111z22z')).toEqual(['m7'])
  })

  it('双碰待ち', () => {
    expect(waitsOf('11m22p345s678s999s')).toEqual(['m1', 'p2'])
  })

  it('単騎待ち', () => {
    expect(waitsOf('123m456p111s789s1z')).toEqual(['z1'])
  })

  it('純正九蓮宝燈は9面待ち', () => {
    expect(waitsOf('1112345678999m')).toEqual([
      'm1',
      'm2',
      'm3',
      'm4',
      'm5',
      'm6',
      'm7',
      'm8',
      'm9',
    ])
  })

  it('ノベタンは両端の単騎待ち', () => {
    expect(waitsOf('4567m111p222s333z')).toEqual(['m4', 'm7'])
  })

  it('和了牌を自分で4枚使っている場合は待ちにならない（純カラ）', () => {
    expect(waitsOf('1111m567m567p567s')).toEqual([])
  })

  it('七対子の単騎待ち', () => {
    expect(waitsOf('1199m1199p1199s1z')).toEqual(['z1'])
  })

  it('国士無双13面待ち', () => {
    expect(waitsOf('19m19p19s1234567z')).toHaveLength(13)
  })
})

describe('waitShapesIn', () => {
  const shapesOf = (winning14: string, winTile: string) => {
    const counts = countsFromTiles(parseTiles(winning14))
    const decompositions = decomposeStandard(counts)
    return decompositions.flatMap((d) =>
      waitShapesIn(d, tileToIndex(winTile as never)),
    )
  }

  it('両面・嵌張・辺張・双碰・単騎を分類する', () => {
    expect(shapesOf('123m456p789s111z22z', 'm1')).toContain('ryanmen')
    expect(shapesOf('123m456p789s111z22z', 'm2')).toContain('kanchan')
    expect(shapesOf('123m456p789s111z22z', 'm3')).toContain('penchan')
    expect(shapesOf('111m22p345s678s999s', 'm1')).toContain('shanpon')
    expect(shapesOf('123m456p111s789s11z', 'z1')).toContain('tanki')
  })

  it('789の9側辺張: 78に9をツモった形は両面ではない', () => {
    expect(shapesOf('789m456p789s111z22z', 'm9')).toContain('ryanmen')
    expect(shapesOf('789m456p789s111z22z', 'm7')).toContain('penchan')
  })
})
