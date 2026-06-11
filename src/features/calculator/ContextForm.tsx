import type { Tile } from '@/core/tiles/tile'
import type { MeldType, Wind } from '@/core/score/types'
import { TileButton } from '@/components/tiles/TileButton'
import type { CalculatorAction, CalculatorState } from './calculatorState'

const WINDS: readonly { readonly value: Wind; readonly label: string }[] = [
  { value: 1, label: '東' },
  { value: 2, label: '南' },
  { value: 3, label: '西' },
  { value: 4, label: '北' },
]

const MELD_MODES: readonly { readonly value: MeldType; readonly label: string }[] =
  [
    { value: 'chi', label: 'チー' },
    { value: 'pon', label: 'ポン' },
    { value: 'minkan', label: '明槓' },
    { value: 'ankan', label: '暗槓' },
  ]

interface SegmentProps<T extends string | number | boolean> {
  readonly label: string
  readonly options: readonly { readonly value: T; readonly label: string }[]
  readonly value: T
  readonly onChange: (value: T) => void
}

function Segment<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
}: SegmentProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-xs text-text-secondary">{label}</span>
      <div className="flex overflow-hidden rounded-lg border border-gold-line">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1 text-sm transition-colors ${
              option.value === value
                ? 'bg-gold-500 font-medium text-ink-950'
                : 'bg-surface-800 text-text-secondary hover:bg-surface-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface DoraRowProps {
  readonly label: string
  readonly tiles: readonly Tile[]
  readonly ura: boolean
  readonly pickerOpen: boolean
  readonly onTogglePicker: () => void
  readonly onRemove: (index: number) => void
}

function DoraRow({
  label,
  tiles,
  pickerOpen,
  onTogglePicker,
  onRemove,
}: Omit<DoraRowProps, 'ura'>) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-xs text-text-secondary">{label}</span>
      <div className="flex items-center gap-1">
        {tiles.map((tile, i) => (
          <TileButton
            key={`${tile}-${i}`}
            tile={tile}
            size="xs"
            onClick={() => onRemove(i)}
            ariaLabel={`${label}の${tile}を削除`}
          />
        ))}
        <button
          type="button"
          onClick={onTogglePicker}
          aria-pressed={pickerOpen}
          className={`flex h-[39px] w-[28px] items-center justify-center rounded border border-dashed text-lg ${
            pickerOpen
              ? 'border-gold-500 text-gold-500'
              : 'border-gold-line text-text-disabled hover:text-gold-300'
          }`}
        >
          +
        </button>
      </div>
    </div>
  )
}

interface ContextFormProps {
  readonly state: CalculatorState
  readonly dispatch: (action: CalculatorAction) => void
  readonly doraPickerTarget: 'omote' | 'ura' | null
  readonly onToggleDoraPicker: (target: 'omote' | 'ura') => void
}

export function ContextForm({
  state,
  dispatch,
  doraPickerTarget,
  onToggleDoraPicker,
}: ContextFormProps) {
  return (
    <div className="hairline grid grid-cols-1 gap-3 rounded-2xl bg-surface-800 p-5 sm:grid-cols-2">
      <Segment
        label="和了"
        options={[
          { value: 'ron' as const, label: 'ロン' },
          { value: 'tsumo' as const, label: 'ツモ' },
        ]}
        value={state.winType}
        onChange={(winType) => dispatch({ type: 'SET_WIN_TYPE', winType })}
      />
      <Segment
        label="自風"
        options={WINDS}
        value={state.seatWind}
        onChange={(wind) => dispatch({ type: 'SET_SEAT_WIND', wind })}
      />
      <Segment
        label="場風"
        options={WINDS.slice(0, 2)}
        value={state.roundWind}
        onChange={(wind) => dispatch({ type: 'SET_ROUND_WIND', wind })}
      />
      <Segment
        label="リーチ"
        options={[
          { value: 'none' as const, label: 'なし' },
          { value: 'riichi' as const, label: 'リーチ' },
          { value: 'double' as const, label: 'ダブル' },
        ]}
        value={state.riichi}
        onChange={(riichi) => dispatch({ type: 'SET_RIICHI', riichi })}
      />
      {state.riichi !== 'none' ? (
        <Segment
          label="一発"
          options={[
            { value: false, label: 'なし' },
            { value: true, label: 'あり' },
          ]}
          value={state.ippatsu}
          onChange={(ippatsu) => dispatch({ type: 'SET_IPPATSU', ippatsu })}
        />
      ) : null}
      <Segment
        label="本場"
        options={[0, 1, 2, 3].map((n) => ({ value: n, label: `${n}` }))}
        value={Math.min(state.honba, 3)}
        onChange={(honba) => dispatch({ type: 'SET_HONBA', honba })}
      />
      <DoraRow
        label="ドラ表示"
        tiles={state.doraIndicators}
        pickerOpen={doraPickerTarget === 'omote'}
        onTogglePicker={() => onToggleDoraPicker('omote')}
        onRemove={(index) => dispatch({ type: 'REMOVE_DORA', index, ura: false })}
      />
      {state.riichi !== 'none' ? (
        <DoraRow
          label="裏ドラ表示"
          tiles={state.uraIndicators}
          pickerOpen={doraPickerTarget === 'ura'}
          onTogglePicker={() => onToggleDoraPicker('ura')}
          onRemove={(index) => dispatch({ type: 'REMOVE_DORA', index, ura: true })}
        />
      ) : null}
      <div className="flex items-center gap-2 sm:col-span-2">
        <span className="w-14 shrink-0 text-xs text-text-secondary">副露</span>
        <div className="flex gap-2">
          {MELD_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              aria-pressed={state.meldMode === mode.value}
              onClick={() =>
                dispatch({
                  type: 'SET_MELD_MODE',
                  mode: state.meldMode === mode.value ? null : mode.value,
                })
              }
              className={`rounded-lg border px-3 py-1 text-sm transition-colors ${
                state.meldMode === mode.value
                  ? 'border-gold-500 bg-gold-500 font-medium text-ink-950'
                  : 'border-gold-line bg-surface-800 text-text-secondary hover:bg-surface-700'
              }`}
            >
              {mode.label}
            </button>
          ))}
          {state.meldMode !== null ? (
            <span className="self-center text-xs text-gold-300">
              下の牌をクリックすると副露が追加されます
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
