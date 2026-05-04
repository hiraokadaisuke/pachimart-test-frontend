import type { InboundSchedule, InventoryActivity, InventoryItem, OutboundSchedule } from "./types";

export const formatCurrency = (value: number) => `¥${value.toLocaleString("ja-JP")}`;
export const formatQuantity = (value: number) => `${value}台`;

export const inventoryItems: InventoryItem[] = [
  { id: "INV-0001", type: "パチンコ", manufacturer: "SANKYO", modelName: "eフィーバーからくりサーカス2", frameColor: "赤", quantity: 3, storageLocation: "名古屋倉庫", purchasePrice: 180000, plannedSalePrice: 230000, status: "在庫", listingStatus: "未出品", notes: "フレーム擦り傷軽微。" },
  { id: "INV-0002", type: "パチスロ", manufacturer: "北電子", modelName: "SアイムジャグラーEX", frameColor: "-", quantity: 10, storageLocation: "大阪倉庫", purchasePrice: 80000, plannedSalePrice: 105000, status: "在庫", listingStatus: "出品中", notes: "ロット在庫。" },
  { id: "INV-0003", type: "パチンコ", manufacturer: "三洋", modelName: "P大海物語5", frameColor: "青", quantity: 5, storageLocation: "東京倉庫", purchasePrice: 120000, plannedSalePrice: 158000, status: "商談中", listingStatus: "出品中", notes: "5/3から商談中。" },
  { id: "INV-0004", type: "パチスロ", manufacturer: "山佐", modelName: "LモンキーターンV", frameColor: "-", quantity: 2, storageLocation: "名古屋倉庫", purchasePrice: 350000, plannedSalePrice: 420000, status: "発送予定", listingStatus: "成約済", notes: "発送調整中。" },
  { id: "INV-0005", type: "パチンコ", manufacturer: "京楽", modelName: "P仮面ライダー電王", frameColor: "黒", quantity: 4, storageLocation: "福岡倉庫", purchasePrice: 140000, plannedSalePrice: 182000, status: "在庫", listingStatus: "未出品", notes: "整備済。" },
  { id: "INV-0006", type: "パチスロ", manufacturer: "大都技研", modelName: "L押忍!番長4", frameColor: "-", quantity: 3, storageLocation: "東京倉庫", purchasePrice: 260000, plannedSalePrice: 320000, status: "商談中", listingStatus: "出品中", notes: "見積提出済。" },
];

export const inboundSchedules: InboundSchedule[] = [
  { id: "INB-0001", expectedDate: "2026-05-10", supplier: "株式会社A社", type: "パチンコ", manufacturer: "平和", modelName: "P烈火の炎3", quantity: 2, destination: "名古屋倉庫", status: "未入庫" },
  { id: "INB-0002", expectedDate: "2026-05-12", supplier: "株式会社B社", type: "パチスロ", manufacturer: "サミー", modelName: "L北斗の拳", quantity: 4, destination: "大阪倉庫", status: "入庫待ち" },
  { id: "INB-0003", expectedDate: "2026-05-15", supplier: "株式会社C社", type: "パチンコ", manufacturer: "三洋", modelName: "P大海物語5", quantity: 5, destination: "東京倉庫", status: "一部入庫" },
  { id: "INB-0004", expectedDate: "2026-05-16", supplier: "株式会社G社", type: "パチスロ", manufacturer: "大都技研", modelName: "L押忍!番長4", quantity: 3, destination: "東京倉庫", status: "未入庫" },
];

export const outboundSchedules: OutboundSchedule[] = [
  { id: "OUT-0001", expectedDate: "2026-05-09", buyer: "株式会社D社", type: "パチスロ", manufacturer: "北電子", modelName: "SアイムジャグラーEX", quantity: 3, origin: "大阪倉庫", shippingMethod: "元払い", status: "発送準備中" },
  { id: "OUT-0002", expectedDate: "2026-05-11", buyer: "株式会社E社", type: "パチンコ", manufacturer: "SANKYO", modelName: "eフィーバーからくりサーカス2", quantity: 1, origin: "名古屋倉庫", shippingMethod: "着払い", status: "未発送" },
  { id: "OUT-0003", expectedDate: "2026-05-13", buyer: "株式会社F社", type: "パチスロ", manufacturer: "山佐", modelName: "LモンキーターンV", quantity: 2, origin: "名古屋倉庫", shippingMethod: "元払い", status: "発送済" },
  { id: "OUT-0004", expectedDate: "2026-05-14", buyer: "株式会社H社", type: "パチンコ", manufacturer: "京楽", modelName: "P仮面ライダー電王", quantity: 2, origin: "福岡倉庫", shippingMethod: "チャーター便", status: "発送準備中" },
];

export const recentActivities: InventoryActivity[] = [
  { date: "2026-05-03", category: "商談", modelName: "P大海物語5", quantity: 5, location: "東京倉庫", status: "商談中" },
  { date: "2026-05-02", category: "発送", modelName: "LモンキーターンV", quantity: 2, location: "名古屋倉庫", status: "発送準備中" },
  { date: "2026-05-01", category: "出品", modelName: "eフィーバーからくりサーカス2", quantity: 3, location: "名古屋倉庫", status: "出品中" },
  { date: "2026-04-28", category: "入庫", modelName: "SアイムジャグラーEX", quantity: 10, location: "大阪倉庫", status: "在庫" },
  { date: "2026-04-27", category: "購入", modelName: "P仮面ライダー電王", quantity: 4, location: "福岡倉庫", status: "未出品" },
];

export const itemActivities: Record<string, string[]> = {
  "INV-0001": ["2026-05-03 商談中", "2026-05-01 パチマートへ出品", "2026-04-28 名古屋倉庫へ入庫", "2026-04-25 購入伝票作成"],
  "INV-0006": ["2026-05-02 見積依頼を受領", "2026-05-01 パチマートへ出品", "2026-04-29 東京倉庫へ入庫", "2026-04-26 購入伝票作成"],
};
