import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { GroupBuildStep } from '@/content/lessons/types'
import { parseTiles } from '@/core/tiles/notation'
import type { Tile } from '@/core/tiles/tile'
import { suitOf, tileToIndex } from '@/core/tiles/tile'
import { TileSvg } from '@/components/tiles/TileSvg'
import { tileName } from '@/core/tiles/tileNames'

interface GroupBuildStepViewProps {
  readonly step: GroupBuildStep
  readonly onComplete: () => void
}

interface TileItem {
  readonly id: string
  readonly tile: Tile
}

const isValidGroup = (tiles: readonly Tile[]): boolean => {
  if (tiles.length === 2) {
    return tiles[0] === tiles[1]
  }
  if (tiles.length !== 3) {
    return false
  }
  const [a, b, c] = tiles
  if (a === undefined || b === undefined || c === undefined) {
    return false
  }
  if (a === b && b === c) {
    return true
  }
  const sorted = [a, b, c].sort((x, y) => tileToIndex(x) - tileToIndex(y))
  const [s0, s1, s2] = sorted as [Tile, Tile, Tile]
  return (
    suitOf(s0) !== 'z' &&
    suitOf(s0) === suitOf(s1) &&
    suitOf(s1) === suitOf(s2) &&
    tileToIndex(s1) === tileToIndex(s0) + 1 &&
    tileToIndex(s2) === tileToIndex(s1) + 1
  )
}

export function GroupBuildStepView({
  step,
  onComplete,
}: GroupBuildStepViewProps) {
  const allTiles: readonly TileItem[] = useMemo(
    () =>
      parseTiles(step.tiles).map((tile, i) => ({ id: `${tile}-${i}`, tile })),
    [step],
  )
  const [selected, setSelected] = useState<readonly string[]>([])
  const [groups, setGroups] = useState<readonly (readonly TileItem[])[]>([])
  const [shake, setShake] = useState(false)

  const groupedIds = new Set(groups.flat().map((t) => t.id))
  const remaining = allTiles.filter((t) => !groupedIds.has(t.id))
  const remainingCount = remaining.length
  const needPair = remainingCount === 2

  const toggleSelect = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((s) => s !== id)
        : [...current, id],
    )
  }

  const confirmGroup = () => {
    const items = selected
      .map((id) => allTiles.find((t) => t.id === id))
      .filter((t): t is TileItem => t !== undefined)
    if (isValidGroup(items.map((t) => t.tile))) {
      const nextGroups = [...groups, items]
      setGroups(nextGroups)
      setSelected([])
      if (nextGroups.flat().length === allTiles.length) {
        onComplete()
      }
    } else {
      setShake(true)
      window.setTimeout(() => setShake(false), 400)
    }
  }

  const requiredSize = needPair ? 2 : 3

  return (
    <div className="space-y-5">
      <p className="text-lg">{step.prompt}</p>
      <motion.div
        animate={shake ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.32 }}
        className="felt-surface hairline flex min-h-24 flex-wrap items-end gap-1.5 rounded-2xl p-5"
      >
        {remaining.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={tileName(item.tile)}
            onClick={() => toggleSelect(item.id)}
            className={`rounded-[7px] transition-transform ${
              selected.includes(item.id) ? 'glow-gold -translate-y-2' : ''
            }`}
          >
            <TileSvg
              tile={item.tile}
              size="md"
              className="block drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
            />
          </button>
        ))}
        {remaining.length === 0 ? (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-mincho text-xl text-ok-400"
          >
            4面子1雀頭が完成しました
          </motion.p>
        ) : null}
      </motion.div>
      <div className="flex flex-wrap items-center gap-3">
        {groups.map((group, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glow-ok flex gap-0.5 rounded-lg bg-surface-800 p-1.5"
          >
            {group.map((item) => (
              <TileSvg key={item.id} tile={item.tile} size="xs" />
            ))}
          </motion.div>
        ))}
      </div>
      {remaining.length > 0 ? (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={confirmGroup}
            disabled={selected.length !== requiredSize}
            className="rounded-xl bg-gold-500 px-6 py-2.5 font-medium text-ink-950 transition-all hover:brightness-110 disabled:opacity-40"
          >
            {needPair ? '雀頭にする（2枚）' : '面子にする（3枚）'}
          </button>
          <span className="text-xs text-text-disabled">
            牌をタップして{requiredSize}枚選んでください
          </span>
        </div>
      ) : (
        <p className="text-sm text-text-secondary">{step.explanation}</p>
      )}
    </div>
  )
}
