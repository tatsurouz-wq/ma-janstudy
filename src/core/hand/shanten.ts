import type { TileCounts } from '../tiles/tileCounts'
import { totalTiles } from '../tiles/tileCounts'
import { chiitoiShanten } from './chiitoiShanten'
import { kokushiShanten } from './kokushiShanten'
import { standardShanten } from './standardShanten'
import { waitingTiles } from './waits'

export const shanten = (counts: TileCounts, meldCount = 0): number => {
  const total = totalTiles(counts)
  const mutableCandidates = [standardShanten(counts, meldCount)]
  if (meldCount === 0 && total >= 13) {
    mutableCandidates.push(chiitoiShanten(counts), kokushiShanten(counts))
  }
  const naive = Math.min(...mutableCandidates)
  if (naive === 0 && total % 3 === 1 && waitingTiles(counts).length === 0) {
    return 1
  }
  return naive
}
