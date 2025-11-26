import { Item } from './types';

export const items: Item[] = [
  {
    id: 1,
    name: 'オリジナル マグカップ',
    description: '朝のコーヒーにぴったりなシンプルデザインのマグ。',
    price: 1200,
    tags: ['キッチン', '新商品'],
  },
  {
    id: 2,
    name: 'ロゴ入り T シャツ',
    description: '軽くて着心地の良いコットン素材のTシャツ。',
    price: 2800,
    tags: ['アパレル'],
  },
  {
    id: 3,
    name: 'キャンバス トートバッグ',
    description: 'A4サイズがすっぽり入る丈夫なトートバッグ。',
    price: 2400,
    tags: ['バッグ', '人気'],
  },
  {
    id: 4,
    name: 'ステッカーセット',
    description: 'デバイスを彩る耐水ステッカー3枚セット。',
    price: 600,
    tags: ['アクセサリー'],
  },
  {
    id: 5,
    name: 'ノート（ドット方眼）',
    description: 'アイデアを書き留めるのに便利なドット方眼ノート。',
    price: 900,
    tags: ['ステーショナリー'],
  },
];

export const findItemById = (id: number): Item | undefined =>
  items.find((item) => item.id === id);
