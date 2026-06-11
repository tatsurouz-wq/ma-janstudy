import { useMemo, useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { motion } from 'framer-motion'
import type { SortToZonesStep } from '@/content/lessons/types'
import type { Tile } from '@/core/tiles/tile'
import { tileName } from '@/core/tiles/tileNames'
import { TileSvg } from '@/components/tiles/TileSvg'

interface SortToZonesStepViewProps {
  readonly step: SortToZonesStep
  readonly onComplete: () => void
}

function DraggableTile({
  id,
  tile,
  selected,
  onClick,
}: {
  readonly id: string
  readonly tile: Tile
  readonly selected: boolean
  readonly onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id })
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={onClick}
      aria-label={tileName(tile)}
      className={`touch-none rounded-[7px] ${selected ? 'glow-gold -translate-y-1.5' : ''}`}
      style={{
        transform:
          transform !== null
            ? `translate(${transform.x}px, ${transform.y}px) scale(1.1)`
            : undefined,
        zIndex: isDragging ? 50 : undefined,
        position: 'relative',
      }}
    >
      <TileSvg
        tile={tile}
        size="md"
        className={`block ${
          isDragging
            ? 'drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]'
            : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]'
        }`}
      />
    </button>
  )
}

function Zone({
  id,
  label,
  tiles,
  onClick,
  active,
}: {
  readonly id: string
  readonly label: string
  readonly tiles: readonly Tile[]
  readonly onClick: () => void
  readonly active: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={`min-h-24 flex-1 rounded-xl border-2 border-dashed p-3 text-left transition-all ${
        isOver || active
          ? 'border-gold-500 bg-gold-500/10'
          : 'border-gold-line bg-surface-800/60'
      }`}
    >
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="mt-2 flex flex-wrap gap-1">
        {tiles.map((tile, i) => (
          <TileSvg key={`${tile}-${i}`} tile={tile} size="xs" />
        ))}
      </span>
    </button>
  )
}

export function SortToZonesStepView({
  step,
  onComplete,
}: SortToZonesStepViewProps) {
  const initial = useMemo(
    () =>
      [...step.assignments]
        .map((a, i) => ({
          id: `t${i}`,
          tile: a.tile,
          zone: a.zone,
          sortKey: (i * 2654435761) % 97,
        }))
        .sort((a, b) => a.sortKey - b.sortKey),
    [step],
  )
  const [placed, setPlaced] = useState<ReadonlyMap<string, string>>(new Map())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [shakeId, setShakeId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const tryPlace = (itemId: string, zoneId: string) => {
    const item = initial.find((t) => t.id === itemId)
    if (item === undefined || placed.has(itemId)) {
      return
    }
    if (item.zone === zoneId) {
      const nextPlaced = new Map([...placed, [itemId, zoneId]])
      setPlaced(nextPlaced)
      setSelectedId(null)
      if (nextPlaced.size === initial.length) {
        onComplete()
      }
    } else {
      setShakeId(itemId)
      window.setTimeout(() => setShakeId(null), 400)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over !== null) {
      tryPlace(String(event.active.id), String(event.over.id))
    }
  }

  const remaining = initial.filter((t) => !placed.has(t.id))

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-5">
        <p className="text-lg">{step.prompt}</p>
        <div className="felt-surface hairline flex min-h-24 flex-wrap items-center gap-2 rounded-2xl p-5">
          {remaining.length === 0 ? (
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="font-mincho text-xl text-ok-400"
            >
              すべて仕分けできました
            </motion.p>
          ) : (
            remaining.map((item) => (
              <motion.div
                key={item.id}
                animate={
                  shakeId === item.id ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }
                }
                transition={{ duration: 0.32 }}
              >
                <DraggableTile
                  id={item.id}
                  tile={item.tile}
                  selected={selectedId === item.id}
                  onClick={() =>
                    setSelectedId((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                />
              </motion.div>
            ))
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {step.zones.map((zone) => (
            <Zone
              key={zone.id}
              id={zone.id}
              label={zone.label}
              active={selectedId !== null}
              tiles={initial
                .filter((t) => placed.get(t.id) === zone.id)
                .map((t) => t.tile)}
              onClick={() => {
                if (selectedId !== null) {
                  tryPlace(selectedId, zone.id)
                }
              }}
            />
          ))}
        </div>
        <p className="text-xs text-text-disabled">
          牌をドラッグするか、牌をタップしてから置き場所をタップしてください
        </p>
      </div>
    </DndContext>
  )
}
