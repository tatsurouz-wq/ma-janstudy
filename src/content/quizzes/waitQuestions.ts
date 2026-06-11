import type { WaitQuestion } from './types'

export const WAIT_QUESTIONS: readonly WaitQuestion[] = [
  {
    id: 'w01',
    level: 1,
    hand: '23m456p789s111z55z',
    hint: '連続する2枚（両面）はその両側を待てます',
  },
  {
    id: 'w02',
    level: 1,
    hand: '46m123p789s88s222z',
    hint: '1つ飛びの2枚（嵌張）は間の牌を待ちます',
  },
  {
    id: 'w03',
    level: 1,
    hand: '12m456p99p567s333z',
    hint: '12の並び（辺張）は3しか待てません',
  },
  {
    id: 'w04',
    level: 1,
    hand: '123m456p789s222z5s',
    hint: '雀頭が片方しかない形（単騎）はその牌自身を待ちます',
  },
  {
    id: 'w05',
    level: 2,
    hand: '5577m123p456s789s',
    hint: '対子が2組ある形（双碰）はどちらの牌も待ちです',
  },
  {
    id: 'w06',
    level: 2,
    hand: '4567m123p456s111z',
    hint: '4枚続きの形（ノベタン）は両端の単騎待ちです',
  },
  {
    id: 'w07',
    level: 2,
    hand: '1344m456p789s111z',
    hint: 'どれを雀頭と見るかで待ちが決まります',
  },
  {
    id: 'w08',
    level: 2,
    hand: '78m123p456s99s222z',
    hint: '両面はスジの2種類を待てます',
  },
  {
    id: 'w09',
    level: 3,
    hand: '34567m123p456s11z',
    hint: '5枚続きの形は3種類の牌を待てます（三面張）',
  },
  {
    id: 'w10',
    level: 3,
    hand: '2233445566778s',
    hint: '清一色の多面張。順子の組み合わせを複数試しましょう',
  },
  {
    id: 'w11',
    level: 3,
    hand: '1112399m456p789s',
    hint: '刻子を崩す解釈と崩さない解釈の両方を考えます',
  },
  {
    id: 'w12',
    level: 3,
    hand: '1113456777999s',
    hint: '暗刻が多い手は意外な待ちが隠れています',
  },
  {
    id: 'w13',
    level: 4,
    hand: '1112345678999m',
    hint: '九蓮宝燈の純正形。待ちは何種類あるでしょう',
  },
  {
    id: 'w14',
    level: 4,
    hand: '19m19p19s1234567z',
    hint: '国士無双の13面待ちです',
  },
  {
    id: 'w15',
    level: 4,
    hand: '1122334455667s',
    hint: '清一色の複雑な多面張です',
  },
  {
    id: 'w16',
    level: 4,
    hand: '2223344455666s',
    hint: '刻子と順子の解釈が複雑に絡みます',
  },
]
