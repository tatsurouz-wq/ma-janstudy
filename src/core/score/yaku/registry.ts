import type { YakuDefinition } from '../types'
import { doubleRiichi, ippatsu, menzenTsumo, riichi } from './riichiFamily'
import { chankan, haitei, houtei, rinshan } from './situational'
import { pinfu } from './pinfu'
import {
  tanyao,
  yakuhaiChun,
  yakuhaiHaku,
  yakuhaiHatsu,
  yakuhaiRound,
  yakuhaiSeat,
} from './tanyaoYakuhai'
import { iipeiko, ryanpeiko } from './peikou'
import { ittsu, sanshokuDoujun } from './sequences'
import { sanankou, sankantsu, sanshokuDoukou, toitoi } from './triplets'
import { chanta, honroutou, junchan } from './terminals'
import { chinitsu, honitsu } from './flushes'
import { shousangen } from './sangen'
import { chiitoi } from './chiitoiYaku'
import {
  chiihou,
  chinroutou,
  chuuren,
  daisangen,
  daisuushi,
  kokushi,
  ryuuiisou,
  shousuushi,
  suuankou,
  suukantsu,
  tenhou,
  tsuuiisou,
} from './yakuman'

export const YAKUMAN_REGISTRY: readonly YakuDefinition[] = [
  tenhou,
  chiihou,
  kokushi,
  suuankou,
  daisangen,
  daisuushi,
  shousuushi,
  tsuuiisou,
  chinroutou,
  ryuuiisou,
  chuuren,
  suukantsu,
]

export const NORMAL_REGISTRY: readonly YakuDefinition[] = [
  riichi,
  doubleRiichi,
  ippatsu,
  menzenTsumo,
  pinfu,
  tanyao,
  yakuhaiHaku,
  yakuhaiHatsu,
  yakuhaiChun,
  yakuhaiSeat,
  yakuhaiRound,
  haitei,
  houtei,
  rinshan,
  chankan,
  chiitoi,
  sanshokuDoujun,
  ittsu,
  chanta,
  toitoi,
  sanankou,
  sanshokuDoukou,
  sankantsu,
  shousangen,
  honroutou,
  iipeiko,
  ryanpeiko,
  honitsu,
  junchan,
  chinitsu,
]
