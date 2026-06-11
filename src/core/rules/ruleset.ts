export interface RuleConfig {
  readonly kuitan: boolean
  readonly redFives: boolean
  readonly kiriageMangan: boolean
  readonly pinfuTsumo: boolean
  readonly doubleWindPairFu: 2 | 4
  readonly doubleYakuman: boolean
  readonly stackedYakuman: boolean
  readonly kazoeYakuman: boolean
}

export const DEFAULT_RULE: RuleConfig = {
  kuitan: true,
  redFives: true,
  kiriageMangan: false,
  pinfuTsumo: true,
  doubleWindPairFu: 2,
  doubleYakuman: false,
  stackedYakuman: false,
  kazoeYakuman: true,
}
