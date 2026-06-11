import type { Tile } from '@/core/tiles/tile'
import { numberRank, suitOf } from '@/core/tiles/tile'
import { HonorFace } from './faces/HonorFace'
import { ManFace } from './faces/ManFace'
import { PinFace } from './faces/PinFace'
import { SouFace } from './faces/SouFace'

interface TileFaceProps {
  readonly tile: Tile
  readonly isRed: boolean
}

export function TileFace({ tile, isRed }: TileFaceProps) {
  const suit = suitOf(tile)
  const rank = numberRank(tile) ?? Number(tile[1])
  switch (suit) {
    case 'm':
      return <ManFace rank={rank} isRed={isRed} />
    case 'p':
      return <PinFace rank={rank} />
    case 's':
      return <SouFace rank={rank} />
    case 'z':
      return <HonorFace rank={rank} />
  }
}
