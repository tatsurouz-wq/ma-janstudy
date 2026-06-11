import type { RuleConfig } from '../rules/ruleset'
import type { LimitName, Payments, PointsResult, WinType } from './types'

const ceil100 = (value: number): number => Math.ceil(value / 100) * 100

interface BaseResult {
  readonly base: number
  readonly limit: LimitName
  readonly formula: string
}

const limitedBase = (
  han: number,
  fu: number,
  isYakuman: boolean,
  yakumanUnits: number,
  rule: RuleConfig,
): BaseResult => {
  if (isYakuman) {
    return {
      base: 8000 * yakumanUnits,
      limit: 'yakuman',
      formula:
        yakumanUnits > 1
          ? `役満 × ${yakumanUnits} = 基本点${8000 * yakumanUnits}`
          : '役満 = 基本点8000',
    }
  }
  if (han >= 13 && rule.kazoeYakuman) {
    return { base: 8000, limit: 'yakuman', formula: '13翻以上は数え役満 = 基本点8000' }
  }
  if (han >= 11) {
    return { base: 6000, limit: 'sanbaiman', formula: '11〜12翻は三倍満 = 基本点6000' }
  }
  if (han >= 8) {
    return { base: 4000, limit: 'baiman', formula: '8〜10翻は倍満 = 基本点4000' }
  }
  if (han >= 6) {
    return { base: 3000, limit: 'haneman', formula: '6〜7翻は跳満 = 基本点3000' }
  }
  if (han >= 5) {
    return { base: 2000, limit: 'mangan', formula: '5翻は満貫 = 基本点2000' }
  }
  const raw = fu * 2 ** (2 + han)
  if (raw > 2000) {
    return {
      base: 2000,
      limit: 'mangan',
      formula: `${fu}符 × 2^(2+${han}) = ${raw} → 2000を超えるため満貫に切り上げ`,
    }
  }
  if (
    rule.kiriageMangan &&
    ((han === 4 && fu === 30) || (han === 3 && fu === 60))
  ) {
    return {
      base: 2000,
      limit: 'mangan',
      formula: `${fu}符${han}翻は切り上げ満貫ルールにより基本点2000`,
    }
  }
  return {
    base: raw,
    limit: 'none',
    formula: `${fu}符 × 2^(2+${han}) = ${raw}`,
  }
}

export const calculatePoints = (
  han: number,
  fu: number,
  isYakuman: boolean,
  yakumanUnits: number,
  isDealer: boolean,
  winType: WinType,
  honba: number,
  kyotaku: number,
  rule: RuleConfig,
): PointsResult => {
  const { base, limit, formula } = limitedBase(
    han,
    fu,
    isYakuman,
    yakumanUnits,
    rule,
  )
  const kyotakuPoints = kyotaku * 1000
  const payments: Payments = (() => {
    if (winType === 'ron') {
      const fromDiscarder = ceil100(base * (isDealer ? 6 : 4)) + honba * 300
      return {
        type: 'ron' as const,
        fromDiscarder,
        total: fromDiscarder + kyotakuPoints,
      }
    }
    if (isDealer) {
      const fromEach = ceil100(base * 2) + honba * 100
      return {
        type: 'tsumo-dealer' as const,
        fromEach,
        total: fromEach * 3 + kyotakuPoints,
      }
    }
    const fromDealer = ceil100(base * 2) + honba * 100
    const fromOthers = ceil100(base) + honba * 100
    return {
      type: 'tsumo-nondealer' as const,
      fromDealer,
      fromOthers,
      total: fromDealer + fromOthers * 2 + kyotakuPoints,
    }
  })()
  return { base, formula, limit, payments }
}
