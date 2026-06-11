export class PlaybackClock {
  private time = 0

  advance(delta: number, speed: number): number {
    const clamped = Math.min(delta, 0.1)
    this.time += clamped * speed
    return this.time
  }

  now(): number {
    return this.time
  }

  setTime(t: number): void {
    this.time = Math.max(0, t)
  }
}
