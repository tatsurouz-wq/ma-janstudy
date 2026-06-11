import * as THREE from 'three'
import type { Tile } from '@/core/tiles/tile'
import { ALL_TILES, numberRank, suitOf } from '@/core/tiles/tile'
import type { SuitColor } from '@/components/tiles/tileFaceData'
import { PIN_LAYOUTS, SOU_LAYOUTS } from '@/components/tiles/tileFaceData'

export type FaceKey = Tile | 'red-m5' | 'red-p5' | 'red-s5'

export interface ThemeColors {
  readonly tileFaceTop: string
  readonly tileFaceBottom: string
  readonly tileFace: string
  readonly tileInk: string
  readonly suitMan: string
  readonly suitPin: string
  readonly suitSou: string
  readonly tileBack400: string
  readonly tileBack600: string
}

export const resolveThemeColors = (): ThemeColors => {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string): string => {
    const value = style.getPropertyValue(name).trim()
    return value === '' ? fallback : value
  }
  return {
    tileFaceTop: read('--color-tile-face-top', '#fbf7ec'),
    tileFaceBottom: read('--color-tile-face-bottom', '#efe8d4'),
    tileFace: read('--color-tile-face', '#f7f2e4'),
    tileInk: read('--color-tile-ink', '#26271f'),
    suitMan: read('--color-suit-man', '#b5454b'),
    suitPin: read('--color-suit-pin', '#2e5e8c'),
    suitSou: read('--color-suit-sou', '#2e7d4f'),
    tileBack400: read('--color-tile-back-400', '#e2b254'),
    tileBack600: read('--color-tile-back-600', '#c9933b'),
  }
}

const CANVAS_W = 256
const CANVAS_H = 324
const K = CANVAS_W / 60

const KANJI_NUMBERS = '一二三四五六七八九'
const HONOR_CHARS = '東南西北白發中'

const BIRD_PATHS: readonly {
  readonly d: string
  readonly color: 'sou' | 'man' | 'beak' | 'face'
  readonly stroke?: number
}[] = [
  {
    d: 'M 30 60 C 22 58 18 50 20 42 C 22 34 28 30 33 31 C 40 32 43 39 41 47 C 39 55 35 60 30 60 Z',
    color: 'sou',
  },
  {
    d: 'M 24 38 C 18 30 16 22 22 16 C 24 22 27 26 31 29 Z',
    color: 'man',
    stroke: 2.4,
  },
  {
    d: 'M 28 36 C 24 28 25 20 31 15 C 31 21 33 26 36 30 Z',
    color: 'sou',
    stroke: 2.4,
  },
  {
    d: 'M 33 35 C 32 27 35 19 42 16 C 40 22 40 27 41 32 Z',
    color: 'man',
    stroke: 2.4,
  },
  { d: 'M 40 32 L 47 34 L 40 37 Z', color: 'beak' },
  {
    d: 'M 34 42 C 30 40 27 41 25 44 C 28 45 31 45 34 44 Z',
    color: 'man',
  },
  {
    d: 'M 27 60 L 24 68 M 27 60 L 29 68',
    color: 'beak',
    stroke: 2,
  },
  {
    d: 'M 35 58 L 34 67 M 35 58 L 39 66',
    color: 'beak',
    stroke: 2,
  },
]

const suitColorOf = (colors: ThemeColors, color: SuitColor): string =>
  color === 'man'
    ? colors.suitMan
    : color === 'pin'
      ? colors.suitPin
      : colors.suitSou

const drawFaceBackground = (
  mutableCtx: CanvasRenderingContext2D,
  colors: ThemeColors,
): void => {
  const gradient = mutableCtx.createLinearGradient(0, 0, 0, CANVAS_H)
  gradient.addColorStop(0, colors.tileFaceTop)
  gradient.addColorStop(1, colors.tileFaceBottom)
  mutableCtx.fillStyle = gradient
  mutableCtx.fillRect(0, 0, CANVAS_W, CANVAS_H)
}

const drawPinDot = (
  mutableCtx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string,
): void => {
  mutableCtx.strokeStyle = fill
  mutableCtx.lineWidth = r * 0.28 * K
  mutableCtx.beginPath()
  mutableCtx.arc(x * K, y * K, r * K, 0, Math.PI * 2)
  mutableCtx.stroke()
  mutableCtx.fillStyle = fill
  mutableCtx.beginPath()
  mutableCtx.arc(x * K, y * K, r * 0.45 * K, 0, Math.PI * 2)
  mutableCtx.fill()
}

const drawPinFace = (
  mutableCtx: CanvasRenderingContext2D,
  colors: ThemeColors,
  rank: number,
): void => {
  if (rank === 1) {
    mutableCtx.strokeStyle = colors.suitPin
    mutableCtx.lineWidth = 3.5 * K
    mutableCtx.beginPath()
    mutableCtx.arc(30 * K, 40 * K, 16 * K, 0, Math.PI * 2)
    mutableCtx.stroke()
    mutableCtx.strokeStyle = colors.suitMan
    mutableCtx.lineWidth = 1.6 * K
    mutableCtx.beginPath()
    mutableCtx.arc(30 * K, 40 * K, 10.5 * K, 0, Math.PI * 2)
    mutableCtx.stroke()
    mutableCtx.fillStyle = colors.suitSou
    for (let i = 0; i < 8; i += 1) {
      const angle = (i * Math.PI) / 4
      mutableCtx.beginPath()
      mutableCtx.arc(
        (30 + 6.5 * Math.cos(angle)) * K,
        (40 + 6.5 * Math.sin(angle)) * K,
        2.4 * K,
        0,
        Math.PI * 2,
      )
      mutableCtx.fill()
    }
    mutableCtx.fillStyle = colors.suitMan
    mutableCtx.beginPath()
    mutableCtx.arc(30 * K, 40 * K, 2.6 * K, 0, Math.PI * 2)
    mutableCtx.fill()
    return
  }
  for (const dot of PIN_LAYOUTS[rank] ?? []) {
    drawPinDot(mutableCtx, dot.x, dot.y, dot.r, suitColorOf(colors, dot.color))
  }
}

const drawBambooStick = (
  mutableCtx: CanvasRenderingContext2D,
  colors: ThemeColors,
  x: number,
  y: number,
  fill: string,
  scale: number,
  rotate: number,
): void => {
  mutableCtx.save()
  mutableCtx.translate(x * K, y * K)
  mutableCtx.rotate((rotate * Math.PI) / 180)
  const w = 8.5 * scale * K
  const h = 24 * scale * K
  mutableCtx.fillStyle = fill
  mutableCtx.beginPath()
  mutableCtx.roundRect(-w / 2, -h / 2, w, h, w / 2)
  mutableCtx.fill()
  mutableCtx.fillStyle = colors.tileFace
  mutableCtx.globalAlpha = 0.85
  mutableCtx.fillRect(-w / 2, -1.4 * scale * K, w, 2.8 * scale * K)
  mutableCtx.globalAlpha = 0.7
  mutableCtx.beginPath()
  mutableCtx.arc(0, -h / 2 + 2.6 * scale * K, 1.1 * scale * K, 0, Math.PI * 2)
  mutableCtx.fill()
  mutableCtx.beginPath()
  mutableCtx.arc(0, h / 2 - 2.6 * scale * K, 1.1 * scale * K, 0, Math.PI * 2)
  mutableCtx.fill()
  mutableCtx.globalAlpha = 1
  mutableCtx.restore()
}

const drawSouFace = (
  mutableCtx: CanvasRenderingContext2D,
  colors: ThemeColors,
  rank: number,
): void => {
  if (rank === 1) {
    mutableCtx.save()
    mutableCtx.scale(K, K)
    for (const path of BIRD_PATHS) {
      const p = new Path2D(path.d)
      const color =
        path.color === 'beak'
          ? '#d9a53c'
          : path.color === 'face'
            ? colors.tileFace
            : suitColorOf(colors, path.color)
      if (path.stroke !== undefined) {
        mutableCtx.strokeStyle = color
        mutableCtx.lineWidth = path.stroke
        mutableCtx.lineCap = 'round'
        mutableCtx.stroke(p)
      } else {
        mutableCtx.fillStyle = color
        mutableCtx.fill(p)
      }
    }
    mutableCtx.fillStyle = colors.tileFace
    mutableCtx.beginPath()
    mutableCtx.arc(37.5, 33, 1.1, 0, Math.PI * 2)
    mutableCtx.fill()
    mutableCtx.restore()
    return
  }
  for (const stick of SOU_LAYOUTS[rank] ?? []) {
    drawBambooStick(
      mutableCtx,
      colors,
      stick.x,
      stick.y,
      suitColorOf(colors, stick.color),
      stick.scale ?? 1,
      stick.rotate ?? 0,
    )
  }
}

const drawText = (
  mutableCtx: CanvasRenderingContext2D,
  char: string,
  x: number,
  y: number,
  size: number,
  fill: string,
): void => {
  mutableCtx.fillStyle = fill
  mutableCtx.font = `${size * K}px "Yuji Syuku", serif`
  mutableCtx.textAlign = 'center'
  mutableCtx.textBaseline = 'middle'
  mutableCtx.fillText(char, x * K, y * K)
}

const drawManFace = (
  mutableCtx: CanvasRenderingContext2D,
  colors: ThemeColors,
  rank: number,
  isRed: boolean,
): void => {
  drawText(
    mutableCtx,
    KANJI_NUMBERS[rank - 1] ?? '',
    30,
    26,
    27,
    isRed ? colors.suitMan : colors.tileInk,
  )
  drawText(mutableCtx, '萬', 30, 56, 25, colors.suitMan)
}

const drawHonorFace = (
  mutableCtx: CanvasRenderingContext2D,
  colors: ThemeColors,
  rank: number,
): void => {
  if (rank === 5) {
    mutableCtx.strokeStyle = colors.suitPin
    mutableCtx.globalAlpha = 0.55
    mutableCtx.lineWidth = 2 * K
    mutableCtx.beginPath()
    mutableCtx.roundRect(10 * K, 10 * K, 40 * K, 56 * K, 4 * K)
    mutableCtx.stroke()
    mutableCtx.globalAlpha = 1
    return
  }
  const fill =
    rank === 6 ? colors.suitSou : rank === 7 ? colors.suitMan : colors.tileInk
  drawText(mutableCtx, HONOR_CHARS[rank - 1] ?? '', 30, 40, 38, fill)
}

const drawRedCorners = (
  mutableCtx: CanvasRenderingContext2D,
  colors: ThemeColors,
): void => {
  mutableCtx.strokeStyle = colors.suitMan
  mutableCtx.lineWidth = 2 * K
  mutableCtx.lineCap = 'round'
  mutableCtx.globalAlpha = 0.9
  const corners = [
    'M 5 11 L 5 6 L 10 6',
    'M 50 6 L 55 6 L 55 11',
    'M 5 65 L 5 70 L 10 70',
    'M 50 70 L 55 70 L 55 65',
  ]
  mutableCtx.save()
  mutableCtx.scale(K, K)
  mutableCtx.lineWidth = 2
  for (const d of corners) {
    mutableCtx.stroke(new Path2D(d))
  }
  mutableCtx.restore()
  mutableCtx.globalAlpha = 1
}

const drawFace = (
  mutableCtx: CanvasRenderingContext2D,
  colors: ThemeColors,
  tile: Tile,
  isRed: boolean,
): void => {
  drawFaceBackground(mutableCtx, colors)
  const suit = suitOf(tile)
  const rank = numberRank(tile) ?? Number(tile[1])
  if (suit === 'm') {
    drawManFace(mutableCtx, colors, rank, isRed)
  } else if (suit === 'p') {
    drawPinFace(mutableCtx, colors, rank)
  } else if (suit === 's') {
    drawSouFace(mutableCtx, colors, rank)
  } else {
    drawHonorFace(mutableCtx, colors, rank)
  }
  if (isRed) {
    drawRedCorners(mutableCtx, colors)
  }
}

const createCanvas = (
  width: number,
  height: number,
): readonly [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const canvas = document.createElement('canvas')
  const mutableCanvas = canvas
  mutableCanvas.width = width
  mutableCanvas.height = height
  const mutableCtx = canvas.getContext('2d')
  if (mutableCtx === null) {
    throw new Error('Canvas 2Dコンテキストを取得できません')
  }
  return [canvas, mutableCtx]
}

const toTexture = (canvas: HTMLCanvasElement): THREE.CanvasTexture => {
  const texture = new THREE.CanvasTexture(canvas)
  const mutableTexture = texture
  mutableTexture.colorSpace = THREE.SRGBColorSpace
  mutableTexture.anisotropy = 4
  return texture
}

export interface TileTextureSet {
  readonly faces: ReadonlyMap<FaceKey, THREE.CanvasTexture>
  readonly back: THREE.CanvasTexture
}

export const faceKeyFor = (tile: Tile, isRed: boolean): FaceKey =>
  isRed ? (`red-${tile}` as FaceKey) : tile

export const createTileTextures = async (
  colors: ThemeColors,
): Promise<TileTextureSet> => {
  await document.fonts.load(
    `${27 * K}px "Yuji Syuku"`,
    '一二三四五六七八九萬東南西北白發中',
  )
  const mutableFaces = new Map<FaceKey, THREE.CanvasTexture>()
  for (const tile of ALL_TILES) {
    const [canvas, mutableCtx] = createCanvas(CANVAS_W, CANVAS_H)
    drawFace(mutableCtx, colors, tile, false)
    mutableFaces.set(tile, toTexture(canvas))
  }
  for (const tile of ['m5', 'p5', 's5'] as const) {
    const [canvas, mutableCtx] = createCanvas(CANVAS_W, CANVAS_H)
    drawFace(mutableCtx, colors, tile, true)
    mutableFaces.set(faceKeyFor(tile, true), toTexture(canvas))
  }
  const [backCanvas, mutableBackCtx] = createCanvas(8, 64)
  const gradient = mutableBackCtx.createLinearGradient(0, 0, 0, 64)
  gradient.addColorStop(0, colors.tileBack400)
  gradient.addColorStop(1, colors.tileBack600)
  mutableBackCtx.fillStyle = gradient
  mutableBackCtx.fillRect(0, 0, 8, 64)
  return { faces: mutableFaces, back: toTexture(backCanvas) }
}
