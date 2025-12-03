export type Inventory = {
  id: number;
  kind: 'P本体' | 'S本体';
  status: '倉庫' | '出品中' | '売却済';
  maker: string;
  modelName: string;
  framePanel: string;
  warehouse: string;
  purchasePrice: number;
  sellPrice: number | null;
  missStore: string;
};

const kinds = ['P本体', 'S本体'] as const;
const statuses = ['倉庫', '出品中', '売却済'] as const;
const makers = [
  '三洋',
  'サミー',
  'ユニバーサル',
  '京楽',
  'SANKYO',
  '北電子',
  '平和',
  'ビスティ',
  'メーシー',
  '大都技研',
] as const;
const framePanels = [
  'ブルーパネル',
  'レッドパネル',
  'ホワイトパネル',
  'ブラックパネル',
  'ゴールドパネル',
  'グリーンパネル',
  'シルバーパネル',
] as const;
const warehouses = ['東京第1倉庫', '東京第2倉庫', '埼玉倉庫', '大阪倉庫', '福岡倉庫'] as const;
const missStores = ['サンプル店舗A', 'サンプル店舗B', 'サンプル店舗C', 'サンプル店舗D', 'サンプル店舗E', '-'] as const;

export const mockInventories: Inventory[] = Array.from({ length: 250 }, (_, index) => {
  const purchasePrice = 100_000 + index * 700;
  const status = statuses[index % statuses.length];

  return {
    id: index + 1,
    kind: kinds[index % kinds.length],
    status,
    maker: makers[index % makers.length],
    modelName: `モデル-${index + 1}`,
    framePanel: framePanels[index % framePanels.length],
    warehouse: warehouses[index % warehouses.length],
    purchasePrice,
    sellPrice: status === '売却済' ? purchasePrice + 20_000 : null,
    missStore: missStores[index % missStores.length],
  };
});
