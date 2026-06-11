import type { Wind } from '../score/types'

export type SeatId = 0 | 1 | 2 | 3

export const SEATS: readonly SeatId[] = [0, 1, 2, 3]

export const USER_SEAT: SeatId = 1

export const SEAT_LABELS: readonly string[] = [
  '上家',
  'あなた',
  '下家',
  '対面',
]

export const nextSeat = (seat: SeatId): SeatId => (((seat + 1) % 4) as SeatId)

export const seatWindFor = (seat: SeatId, dealer: SeatId): Wind =>
  ((((seat - dealer + 4) % 4) + 1) as Wind)

export const turnOrderFrom = (start: SeatId): readonly SeatId[] =>
  [0, 1, 2, 3].map((offset) => (((start + offset) % 4) as SeatId))
