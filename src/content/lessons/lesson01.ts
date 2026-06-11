import type { Lesson } from './types'

export const LESSON_01: Lesson = {
  id: 'lesson-01',
  number: 1,
  title: '牌を知る',
  goal: '34種類の牌を見分けられるようになる',
  steps: [
    {
      kind: 'text',
      title: '麻雀牌は34種類×4枚 = 136枚',
      body: '麻雀は136枚の牌を使って遊びます。牌は大きく分けて「数牌（シューパイ）」と「字牌（ジハイ）」の2種類。数牌には萬子（マンズ）・筒子（ピンズ）・索子（ソーズ）の3色があり、それぞれ1〜9まであります。\nまずは見た目の違いを覚えましょう。萬子は漢数字、筒子は丸、索子は竹の絵柄です。',
      tiles: '159m159p159s',
    },
    {
      kind: 'sort-to-zones',
      prompt: '牌を正しい種類のトレイに仕分けてみましょう',
      zones: [
        { id: 'man', label: '萬子（マンズ）' },
        { id: 'pin', label: '筒子（ピンズ）' },
        { id: 'sou', label: '索子（ソーズ）' },
        { id: 'honor', label: '字牌（ジハイ）' },
      ],
      assignments: [
        { tile: 'm3', zone: 'man' },
        { tile: 'm7', zone: 'man' },
        { tile: 'p2', zone: 'pin' },
        { tile: 'p8', zone: 'pin' },
        { tile: 's1', zone: 'sou' },
        { tile: 's5', zone: 'sou' },
        { tile: 'z1', zone: 'honor' },
        { tile: 'z6', zone: 'honor' },
      ],
    },
    {
      kind: 'text',
      title: '字牌は7種類',
      body: '字牌には風牌（東・南・西・北）と三元牌（白・發・中）があります。白は何も書いていない真っ白な牌です。\n1索（イーソー）は鳥の絵柄なので初心者がよく戸惑います。これも索子の1です。',
      tiles: '1234567z',
    },
    {
      kind: 'select-from-palette',
      prompt: 'この中から「幺九牌（ヤオチューハイ）」＝1・9・字牌をすべて選んでください',
      palette: '2m9m5p1s7s1z6z',
      correct: ['m9', 's1', 'z1', 'z6'],
      explanation:
        '1と9の数牌、そして字牌をまとめて幺九牌と呼びます。後で学ぶ「タンヤオ」や符計算で重要になる区分です。逆に2〜8の数牌は中張牌（チュンチャンパイ）と呼びます。',
    },
    {
      kind: 'quiz',
      prompt: '鳥の絵が描かれたこの牌は何でしょう？',
      tiles: '1s',
      choices: ['索子の1（イーソー）', '字牌の一種', '萬子の1', 'ドラ専用の牌'],
      correctIndex: 0,
      explanation:
        '1索は鳥（孔雀）の絵柄ですが、索子の1です。竹が1本だと寂しいので鳥が描かれるようになったと言われています。',
    },
  ],
}
