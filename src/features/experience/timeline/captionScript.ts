import type { ScenarioEvent } from '@/core/sim/scenarioEvents'
import type { SeatId } from '@/core/sim/seatTypes'
import { SEAT_LABELS } from '@/core/sim/seatTypes'
import type { ScoreResult, Wind } from '@/core/score/types'
import type { CaptionSegment } from './timelineTypes'

export interface CaptionScriptState {
  readonly seenKinds: ReadonlySet<string>
  readonly lastWin: ScoreResult | null
  readonly lastWinSeat: SeatId | null
  readonly kyotakuBeforeWin: number
}

export const INITIAL_CAPTION_STATE: CaptionScriptState = {
  seenKinds: new Set(),
  lastWin: null,
  lastWinSeat: null,
  kyotakuBeforeWin: 0,
}

export interface CaptionSpec {
  readonly segments: readonly CaptionSegment[]
  readonly minDuration: number
  readonly learning: boolean
}

const text = (value: string): CaptionSegment => ({ kind: 'text', text: value })
const emphasis = (value: string): CaptionSegment => ({
  kind: 'emphasis',
  text: value,
})

const seatLabel = (seat: SeatId): string => SEAT_LABELS[seat] ?? ''

const roundLabel = (round: Wind, kyoku: number): string =>
  `${round === 1 ? '東' : '南'}${kyoku}局`

const paymentText = (result: ScoreResult): string => {
  const p = result.points.payments
  if (p.type === 'ron') {
    return `${p.fromDiscarder.toLocaleString()}点`
  }
  if (p.type === 'tsumo-dealer') {
    return `${p.fromEach.toLocaleString()}点オール`
  }
  return `${p.fromOthers.toLocaleString()}/${p.fromDealer.toLocaleString()}`
}

interface CaptionResult {
  readonly spec: CaptionSpec | null
  readonly state: CaptionScriptState
}

const once = (
  state: CaptionScriptState,
  key: string,
  spec: CaptionSpec,
): CaptionResult =>
  state.seenKinds.has(key)
    ? { spec: null, state }
    : {
        spec,
        state: { ...state, seenKinds: new Set([...state.seenKinds, key]) },
      }

export const captionFor = (
  event: ScenarioEvent,
  state: CaptionScriptState,
  context: { readonly userSeat: SeatId },
): CaptionResult => {
  switch (event.kind) {
    case 'machineStart':
      return once(state, 'machineStart', {
        segments: [
          text('全自動麻雀卓の実戦体験へようこそ。'),
          emphasis('ボタンひとつ'),
          text('で洗牌から山積みまで卓が自動で行います。'),
        ],
        minDuration: 5,
        learning: true,
      })
    case 'shuffle':
      return once(state, 'shuffle', {
        segments: [
          text('136枚の牌が卓の中へ。内部で自動的に混ぜられます（'),
          emphasis('洗牌'),
          text('）。'),
        ],
        minDuration: 4.4,
        learning: true,
      })
    case 'wallRise':
      return once(state, 'wallRise', {
        segments: [
          text('山がせり上がりました。1人の前に'),
          emphasis('17列×2段＝34枚'),
          text('、4人分で136枚です。'),
        ],
        minDuration: 4.4,
        learning: true,
      })
    case 'dice':
      return once(state, 'dice', {
        segments: [
          text('デジタルサイコロの合計で山の取り出し位置が決まります。今回は'),
          emphasis(`${(event.values[0] ?? 0) + (event.values[1] ?? 0)}`),
          text('です。'),
        ],
        minDuration: 4.4,
        learning: true,
      })
    case 'deal':
      return once(state, 'deal', {
        segments: [
          text('配牌。山から4枚ずつ3回、最後に1枚ずつ取ります。親はさらに1枚多く取るため、'),
          emphasis('親は14枚、子は13枚'),
          text('でスタートです。'),
        ],
        minDuration: 5.2,
        learning: true,
      })
    case 'boardSnapshot':
      return {
        spec: {
          segments: [
            text('この局は終盤へ進めます。盤面と点数はここまでの結果を引き継いでいます。'),
          ],
          minDuration: 4.4,
          learning: true,
        },
        state,
      }
    case 'kyokuStart': {
      if (event.digest !== 'highlight') {
        return { spec: null, state }
      }
      const isUserDealer = event.dealer === context.userSeat
      return {
        spec: {
          segments: isUserDealer
            ? [
                emphasis(roundLabel(event.round, event.kyoku)),
                text('、あなたの親番です。親の和了は'),
                emphasis('1.5倍'),
                text('。そのぶん振り込みのリスクも大きくなります。'),
              ]
            : [
                emphasis(roundLabel(event.round, event.kyoku)),
                text(
                  event.honba > 0 ? `（${event.honba}本場）の見どころです。` : 'の見どころです。',
                ),
              ],
          minDuration: 4.4,
          learning: true,
        },
        state,
      }
    }
    case 'draw': {
      if (event.seat !== context.userSeat) {
        return { spec: null, state }
      }
      return once(state, 'draw-user', {
        segments: [
          text('自分の番。山から1枚'),
          emphasis('ツモ'),
          text('って14枚にし、いらない牌を1枚捨てて13枚に戻します。'),
        ],
        minDuration: 4.4,
        learning: true,
      })
    }
    case 'discard': {
      if (event.riichiDeclaration) {
        const isUser = event.seat === context.userSeat
        return {
          spec: {
            segments: [
              emphasis(`${seatLabel(event.seat)}がリーチ！`),
              text('宣言牌の'),
              { kind: 'tile', tile: event.tile.tile },
              text('は横向きに置きます。以降は手を変えられません。'),
            ],
            minDuration: isUser ? 5 : 4.4,
            learning: true,
          },
          state,
        }
      }
      return once(state, 'discard', {
        segments: [
          text('捨てた牌は自分の前の'),
          emphasis('河'),
          text('に6枚ずつ並びます。捨て牌は相手への大事な情報です。'),
        ],
        minDuration: 4.4,
        learning: true,
      })
    }
    case 'riichiStick':
      return once(state, 'riichiStick', {
        segments: [
          text('リーチ棒'),
          emphasis('1000点'),
          text('を供託します。この1000点は次に和了した人がもらいます。'),
        ],
        minDuration: 4.4,
        learning: true,
      })
    case 'win': {
      const yakuNames = event.result.yaku.map((y) => y.name).join('・')
      const how = event.winType === 'tsumo' ? 'ツモ' : 'ロン'
      const firstKey = `win-${event.winType}`
      const lesson = state.seenKinds.has(firstKey)
        ? []
        : event.winType === 'ron'
          ? [text(' ロンの支払いは'), emphasis('放銃した人だけ'), text('です。')]
          : [text(' ツモは'), emphasis('3人全員で支払い'), text('ます。')]
      const nextState: CaptionScriptState = {
        ...state,
        seenKinds: new Set([...state.seenKinds, firstKey]),
        lastWin: event.result,
        lastWinSeat: event.seat,
      }
      return {
        spec: {
          segments: [
            emphasis(`${seatLabel(event.seat)}が${how}和了！`),
            text(`${yakuNames}。`),
            ...lesson,
          ],
          minDuration: 5.5,
          learning: true,
        },
        state: nextState,
      }
    }
    case 'exhaustiveDraw':
      return {
        spec: {
          segments: [
            text('誰も和了できず'),
            emphasis('流局'),
            text(
              `。テンパイは${
                event.tenpaiSeats.length === 0
                  ? 'いません'
                  : event.tenpaiSeats.map((s) => seatLabel(s)).join('・')
              }。`,
            ),
          ],
          minDuration: 4.4,
          learning: true,
        },
        state,
      }
    case 'payment': {
      if (state.lastWin !== null) {
        const result = state.lastWin
        const fuPart = result.isYakuman
          ? '役満'
          : `${result.totalHan}翻${result.fu !== null ? `${result.fu.rounded}符` : ''}`
        const kyotakuPart =
          state.kyotakuBeforeWin > 0
            ? ` 供託のリーチ棒${state.kyotakuBeforeWin}本も和了者がもらいます。`
            : ''
        return {
          spec: {
            segments: [
              emphasis(fuPart),
              text(`で${paymentText(result)}。${kyotakuPart}`),
            ],
            minDuration: 5,
            learning: true,
          },
          state: { ...state, lastWin: null, lastWinSeat: null },
        }
      }
      const moved = event.deltas.some((d) => d !== 0)
      if (!moved) {
        return { spec: null, state }
      }
      return once(state, 'noten-penalty', {
        segments: [
          emphasis('ノーテン罰符'),
          text('。テンパイの人がノーテンの人から合計3000点を受け取ります。'),
        ],
        minDuration: 4.4,
        learning: true,
      })
    }
    case 'kyokuEnd':
      return once(state, event.dealerKept ? 'renchan' : 'oyanagare', {
        segments: event.dealerKept
          ? [
              text('親が和了（またはテンパイ）したので'),
              emphasis('連荘'),
              text('。同じ親が続き、本場が1つ増えます。'),
            ]
          : [
              emphasis('親流れ'),
              text('。次の人に親が移ります。'),
            ],
        minDuration: 4.4,
        learning: true,
      })
    case 'digestSkip':
      return {
        spec: {
          segments: [
            emphasis(
              `${roundLabel(event.summary.round, event.summary.kyoku)}${
                event.summary.honba > 0 ? ` ${event.summary.honba}本場` : ''
              }`,
            ),
            text(`: ${event.summary.headline}`),
          ],
          minDuration: 4.4,
          learning: false,
        },
        state,
      }
    case 'gameEnd':
      return {
        spec: {
          segments: [
            emphasis('半荘終了'),
            text('。東1局から南4局までを戦い、最終的な持ち点で順位が決まります。'),
          ],
          minDuration: 5,
          learning: true,
        },
        state,
      }
  }
}

export const trackKyotakuBeforeWin = (
  state: CaptionScriptState,
  kyotaku: number,
): CaptionScriptState => ({ ...state, kyotakuBeforeWin: kyotaku })

const VOCABULARY: readonly string[] = [
  '洗牌',
  '配牌',
  'ツモ',
  'ロン',
  '河',
  'リーチ',
  '供託',
  'テンパイ',
  '流局',
  '連荘',
  '親流れ',
  'ノーテン罰符',
  '翻',
  '符',
  '役満',
  '半荘',
  '本場',
]

export const CAPTION_VOCABULARY: ReadonlySet<string> = new Set(VOCABULARY)
