export type SuitColor = 'man' | 'pin' | 'sou'

export interface PinDot {
  readonly x: number
  readonly y: number
  readonly r: number
  readonly color: SuitColor
}

export const PIN_LAYOUTS: Readonly<Record<number, readonly PinDot[]>> = {
  2: [
    { x: 30, y: 24, r: 9, color: 'pin' },
    { x: 30, y: 56, r: 9, color: 'sou' },
  ],
  3: [
    { x: 17, y: 20, r: 8, color: 'pin' },
    { x: 30, y: 40, r: 8, color: 'man' },
    { x: 43, y: 60, r: 8, color: 'sou' },
  ],
  4: [
    { x: 19, y: 23, r: 8, color: 'pin' },
    { x: 41, y: 23, r: 8, color: 'sou' },
    { x: 19, y: 57, r: 8, color: 'sou' },
    { x: 41, y: 57, r: 8, color: 'pin' },
  ],
  5: [
    { x: 18, y: 22, r: 7.5, color: 'pin' },
    { x: 42, y: 22, r: 7.5, color: 'pin' },
    { x: 18, y: 58, r: 7.5, color: 'pin' },
    { x: 42, y: 58, r: 7.5, color: 'pin' },
    { x: 30, y: 40, r: 7.5, color: 'man' },
  ],
  6: [
    { x: 20, y: 21, r: 7, color: 'man' },
    { x: 40, y: 21, r: 7, color: 'man' },
    { x: 20, y: 40, r: 7, color: 'pin' },
    { x: 40, y: 40, r: 7, color: 'pin' },
    { x: 20, y: 59, r: 7, color: 'pin' },
    { x: 40, y: 59, r: 7, color: 'pin' },
  ],
  7: [
    { x: 15, y: 16, r: 6, color: 'sou' },
    { x: 28, y: 22, r: 6, color: 'sou' },
    { x: 41, y: 28, r: 6, color: 'sou' },
    { x: 20, y: 48, r: 6.5, color: 'man' },
    { x: 40, y: 48, r: 6.5, color: 'man' },
    { x: 20, y: 64, r: 6.5, color: 'man' },
    { x: 40, y: 64, r: 6.5, color: 'man' },
  ],
  8: [
    { x: 20, y: 16, r: 6, color: 'pin' },
    { x: 40, y: 16, r: 6, color: 'pin' },
    { x: 20, y: 32, r: 6, color: 'pin' },
    { x: 40, y: 32, r: 6, color: 'pin' },
    { x: 20, y: 48, r: 6, color: 'pin' },
    { x: 40, y: 48, r: 6, color: 'pin' },
    { x: 20, y: 64, r: 6, color: 'pin' },
    { x: 40, y: 64, r: 6, color: 'pin' },
  ],
  9: [
    { x: 17, y: 19, r: 6, color: 'man' },
    { x: 30, y: 19, r: 6, color: 'man' },
    { x: 43, y: 19, r: 6, color: 'man' },
    { x: 17, y: 40, r: 6, color: 'pin' },
    { x: 30, y: 40, r: 6, color: 'pin' },
    { x: 43, y: 40, r: 6, color: 'pin' },
    { x: 17, y: 61, r: 6, color: 'sou' },
    { x: 30, y: 61, r: 6, color: 'sou' },
    { x: 43, y: 61, r: 6, color: 'sou' },
  ],
}

export interface SouStick {
  readonly x: number
  readonly y: number
  readonly color: SuitColor
  readonly scale?: number
  readonly rotate?: number
}

export const SOU_LAYOUTS: Readonly<Record<number, readonly SouStick[]>> = {
  2: [
    { x: 30, y: 24, color: 'sou' },
    { x: 30, y: 56, color: 'sou' },
  ],
  3: [
    { x: 30, y: 20, color: 'sou' },
    { x: 20, y: 58, color: 'sou' },
    { x: 40, y: 58, color: 'sou' },
  ],
  4: [
    { x: 20, y: 24, color: 'sou' },
    { x: 40, y: 24, color: 'sou' },
    { x: 20, y: 56, color: 'sou' },
    { x: 40, y: 56, color: 'sou' },
  ],
  5: [
    { x: 19, y: 22, color: 'sou' },
    { x: 41, y: 22, color: 'sou' },
    { x: 19, y: 58, color: 'sou' },
    { x: 41, y: 58, color: 'sou' },
    { x: 30, y: 40, color: 'man' },
  ],
  6: [
    { x: 17, y: 24, color: 'sou' },
    { x: 30, y: 24, color: 'sou' },
    { x: 43, y: 24, color: 'sou' },
    { x: 17, y: 56, color: 'sou' },
    { x: 30, y: 56, color: 'sou' },
    { x: 43, y: 56, color: 'sou' },
  ],
  7: [
    { x: 30, y: 17, color: 'man', scale: 0.8 },
    { x: 17, y: 42, color: 'sou', scale: 0.8 },
    { x: 30, y: 42, color: 'sou', scale: 0.8 },
    { x: 43, y: 42, color: 'sou', scale: 0.8 },
    { x: 17, y: 63, color: 'sou', scale: 0.8 },
    { x: 30, y: 63, color: 'sou', scale: 0.8 },
    { x: 43, y: 63, color: 'sou', scale: 0.8 },
  ],
  8: [
    { x: 19, y: 21, color: 'sou', scale: 0.75, rotate: -22 },
    { x: 41, y: 21, color: 'sou', scale: 0.75, rotate: 22 },
    { x: 26, y: 30, color: 'sou', scale: 0.75, rotate: 22 },
    { x: 34, y: 30, color: 'sou', scale: 0.75, rotate: -22 },
    { x: 19, y: 59, color: 'sou', scale: 0.75, rotate: 22 },
    { x: 41, y: 59, color: 'sou', scale: 0.75, rotate: -22 },
    { x: 26, y: 50, color: 'sou', scale: 0.75, rotate: -22 },
    { x: 34, y: 50, color: 'sou', scale: 0.75, rotate: 22 },
  ],
  9: [
    { x: 17, y: 18, color: 'sou', scale: 0.78 },
    { x: 30, y: 18, color: 'sou', scale: 0.78 },
    { x: 43, y: 18, color: 'sou', scale: 0.78 },
    { x: 17, y: 40, color: 'man', scale: 0.78 },
    { x: 30, y: 40, color: 'man', scale: 0.78 },
    { x: 43, y: 40, color: 'man', scale: 0.78 },
    { x: 17, y: 62, color: 'sou', scale: 0.78 },
    { x: 30, y: 62, color: 'sou', scale: 0.78 },
    { x: 43, y: 62, color: 'sou', scale: 0.78 },
  ],
}

export const SUIT_COLOR_VAR: Readonly<Record<SuitColor, string>> = {
  man: 'var(--color-suit-man)',
  pin: 'var(--color-suit-pin)',
  sou: 'var(--color-suit-sou)',
}
