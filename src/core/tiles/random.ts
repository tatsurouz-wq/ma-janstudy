export interface Rng {
  readonly next: () => readonly [number, Rng]
}

const mulberry32Step = (state: number): readonly [number, number] => {
  const nextState = (state + 0x6d2b79f5) | 0
  const t1 = Math.imul(nextState ^ (nextState >>> 15), 1 | nextState)
  const t2 = (t1 + Math.imul(t1 ^ (t1 >>> 7), 61 | t1)) ^ t1
  const value = ((t2 ^ (t2 >>> 14)) >>> 0) / 4294967296
  return [value, nextState]
}

export const createRng = (seed: number): Rng => {
  const make = (state: number): Rng => ({
    next: () => {
      const [value, nextState] = mulberry32Step(state)
      return [value, make(nextState)]
    },
  })
  return make(seed | 0)
}

export const shuffled = <T>(
  items: readonly T[],
  rng: Rng,
): readonly [readonly T[], Rng] => {
  const pick = (
    remaining: readonly T[],
    acc: readonly T[],
    currentRng: Rng,
  ): readonly [readonly T[], Rng] => {
    if (remaining.length === 0) {
      return [acc, currentRng]
    }
    const [value, nextRng] = currentRng.next()
    const j = Math.floor(value * remaining.length)
    const pickedTile = remaining[j] as T
    const rest = remaining.filter((_, index) => index !== j)
    return pick(rest, [...acc, pickedTile], nextRng)
  }
  return pick(items, [], rng)
}
