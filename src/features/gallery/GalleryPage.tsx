import type { Tile } from '@/core/tiles/tile'
import { ALL_TILES, suitOf } from '@/core/tiles/tile'
import type { TileSize } from '@/components/tiles/TileSvg'
import { TileSvg } from '@/components/tiles/TileSvg'
import { tileName, tileReading } from '@/core/tiles/tileNames'

const SUIT_TITLES: Readonly<Record<string, string>> = {
  m: '萬子（マンズ）',
  p: '筒子（ピンズ）',
  s: '索子（ソーズ）',
  z: '字牌（ジハイ）',
}

const RED_FIVES: readonly Tile[] = ['m5', 'p5', 's5']

const SIZES: readonly TileSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

function TileCell({ tile, isRed }: { readonly tile: Tile; readonly isRed?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <TileSvg tile={tile} isRed={isRed} size="lg" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]" />
      <span className="text-xs text-text-secondary">{tileName(tile, isRed)}</span>
      <span className="text-[10px] text-text-disabled">{tileReading(tile)}</span>
    </div>
  )
}

export function GalleryPage() {
  const suits = ['m', 'p', 's', 'z'] as const
  return (
    <div className="space-y-10">
      <h1 className="font-mincho text-3xl font-bold tracking-wider">
        牌ギャラリー
      </h1>
      <p className="text-sm text-text-secondary">
        全34種 + 赤ドラ3種 + 裏面の描画確認ページ（開発用）
      </p>
      {suits.map((suit) => (
        <section key={suit} className="space-y-4">
          <h2 className="font-mincho text-xl font-semibold text-gold-300">
            {SUIT_TITLES[suit]}
          </h2>
          <div className="felt-surface hairline flex flex-wrap gap-4 rounded-2xl p-6">
            {ALL_TILES.filter((t) => suitOf(t) === suit).map((tile) => (
              <TileCell key={tile} tile={tile} />
            ))}
          </div>
        </section>
      ))}
      <section className="space-y-4">
        <h2 className="font-mincho text-xl font-semibold text-gold-300">
          赤ドラ・裏面
        </h2>
        <div className="felt-surface hairline flex flex-wrap gap-4 rounded-2xl p-6">
          {RED_FIVES.map((tile) => (
            <TileCell key={tile} tile={tile} isRed />
          ))}
          <div className="flex flex-col items-center gap-1">
            <TileSvg tile="z1" faceDown size="lg" />
            <span className="text-xs text-text-secondary">裏面</span>
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="font-mincho text-xl font-semibold text-gold-300">
          サイズバリエーション
        </h2>
        <div className="felt-surface hairline flex flex-wrap items-end gap-4 rounded-2xl p-6">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <TileSvg tile="p7" size={size} />
              <span className="text-xs text-text-secondary">{size}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
