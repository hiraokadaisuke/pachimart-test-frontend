"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import MainContainer from "@/components/layout/MainContainer";
import type { InventoryCategory } from "@/types/inventory";
import { addInventoryItems, type StoredInventoryItem } from "@/lib/inventory/storage";

const CATEGORY_OPTIONS: InventoryCategory[] = ["P本体", "S本体", "P枠", "Pセル"];

// メーカー一覧（5社）
const MANUFACTURER_OPTIONS = ["三洋", "ユニバーサル", "京楽", "サミー", "平和"] as const;

// 種別×メーカーごとの機種名候補（7機種ずつ）
const MODEL_OPTIONS: Record<
  InventoryCategory,
  Record<(typeof MANUFACTURER_OPTIONS)[number], string[]>
> = {
  P本体: {
    三洋: [
      "海物語スペシャル",
      "大海物語5",
      "スーパー海物語IN JAPAN",
      "地中海甘デジ",
      "ブラックライト",
      "アクアリウムDX",
      "ゴールドラッシュ",
    ],
    ユニバーサル: [
      "バジリスク桜花",
      "まどか☆マギカA",
      "アステカR",
      "ハーデスライト",
      "ゴッドブラスト",
      "サンダーライト",
      "バーサスクラシック",
    ],
    京楽: [
      "ぱちんこAKB桜",
      "ウルトラセブンX",
      "必殺仕置人極",
      "冬のソナタリメンバー",
      "水戸黄門ちゃま",
      "仮面ライダー疾風",
      "とある魔術の禁書目録L",
    ],
    サミー: [
      "北斗無双Re",
      "コードギアスR2",
      "デジハネ物語",
      "シンフォギア彩",
      "真・牙狼Z",
      "蒼天の拳双龍",
      "七つの大罪X",
    ],
    平和: [
      "ルパンザファースト",
      "ターボライダー",
      "戦国乙女暁",
      "黄門ちゃま寿",
      "シティーハンターL",
      "キャッツアイB",
      "ガールフレンド仮",
    ],
  },
  S本体: {
    三洋: [
      "沖ドキ!マリン",
      "スーパーリゾート",
      "海物語ドラム",
      "南国育ちDX",
      "プレミアム波",
      "ビッグマリンS",
      "楽園シーサイド",
    ],
    ユニバーサル: [
      "バジリスク絆風",
      "まどかマギカ叛逆",
      "アナザーゴッド颯",
      "バーサスリボルト",
      "クランキーアップ2",
      "ドンちゃん極",
      "サンダーVスペシャル",
    ],
    京楽: [
      "ぱちスロAKB紅",
      "必殺仕事人桜",
      "仮面ライダー轟音S",
      "冬のソナタS",
      "水戸黄門ちゃまS",
      "麻雀姫伝",
      "リングリバースS",
    ],
    サミー: [
      "北斗の拳宿命",
      "頭文字D高速",
      "ツインエンジェルBR",
      "甲鉄城カバネリS",
      "ラグランジェNova",
      "東京レイヴンズS",
      "シンフォギア勇気",
    ],
    平和: [
      "戦国乙女暁S",
      "ルパン三世Lupin",
      "JAWSワイルド",
      "キャッツアイS",
      "南国育ち30S",
      "ガールズ&パンツァーS",
      "麻雀物語風",
    ],
  },
  P枠: {
    三洋: [
      "マリンブルー枠",
      "ピンクサンフラワー",
      "パールホワイト",
      "ネイビーモデル",
      "アクアブルー",
      "ブラックエディション",
      "ホワイトクリア",
    ],
    ユニバーサル: [
      "ギアチェンジ枠",
      "エンブレム枠",
      "クラシック枠",
      "グリッター枠",
      "ディープブルー",
      "ライジング",
      "フォージドシルバー",
    ],
    京楽: [
      "ドットライン枠",
      "オーシャンブルー",
      "クロームフレーム",
      "ルビーシェル",
      "ホワイトグロウ",
      "スカイハーモニー",
      "サファイアリング",
    ],
    サミー: [
      "ライトニング枠",
      "スターフレーム",
      "プライムブルー",
      "メタルウィング",
      "オーロラ",
      "シャドウブラック",
      "レイジブルー",
    ],
    平和: [
      "ルパンフレーム",
      "ブルージェム",
      "シルバーステップ",
      "アクアライン",
      "クリアスモーク",
      "スカイウォッシュ",
      "ラグジュアリーブルー",
    ],
  },
  Pセル: {
    三洋: [
      "海物語セル",
      "マリンセル",
      "アクアセル",
      "オーシャンセル",
      "プレミアセル",
      "パールセル",
      "ミラクルセル",
    ],
    ユニバーサル: [
      "バジリスクセル",
      "まどマギセル",
      "アステカセル",
      "ドンちゃんセル",
      "バーサスセル",
      "ハーデスセル",
      "ゴッドセル",
    ],
    京楽: [
      "AKBセル",
      "ウルトラセル",
      "必殺セル",
      "仮面ライダーセル",
      "冬ソナセル",
      "リングセル",
      "水戸黄門セル",
    ],
    サミー: [
      "北斗セル",
      "シンフォギアセル",
      "ギアスセル",
      "七つの大罪セル",
      "エウレカセル",
      "カバネリセル",
      "頭文字Dセル",
    ],
    平和: [
      "乙女セル",
      "ルパンセル",
      "JAWSセル",
      "南国セル",
      "キャッツアイセル",
      "麻雀物語セル",
      "黄門ちゃまセル",
    ],
  },
};

const USAGE_TYPE_OPTIONS: Array<"一次" | "二次"> = ["一次", "二次"];

// 数値変換ユーティリティ
const parseNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

// 行ごとのフォームデータ型
type InventoryFormRow = {
  purchaseSource: string;
  purchaseRepresentative: string;
  taxCategory: string;
  isConsignment: boolean;
  category: InventoryCategory;
  manufacturer: (typeof MANUFACTURER_OPTIONS)[number];
  modelName: string;
  colorPanel: string;
  inspectionNumber: string;
  frameSerial: string;
  boardSerial: string;
  removalDate: string;
  usageType: "一次" | "二次";
  warehouse: string;
  purchasePriceExTax: string;
  purchasePriceIncTax: string;
  saleDate: string;
  saleDestination: string;
  salePriceExTax: string;
  salePriceIncTax: string;
  stockInDate: string;
  stockOutDate: string;
  stockOutDestination: string;
  note: string;
  externalCompany: string;
  externalStore: string;
  serialNumber: string;
  inspectionInfo: string;
  installDate: string;
  inspectionDate: string;
  approvalDate: string;
  hasDocuments: boolean;
};

// 新しい行の初期値
const createEmptyRow = (): InventoryFormRow => ({
  purchaseSource: "",
  purchaseRepresentative: "",
  taxCategory: "",
  isConsignment: false,
  category: "P本体",
  manufacturer: MANUFACTURER_OPTIONS[0],
  modelName: "",
  colorPanel: "",
  inspectionNumber: "",
  frameSerial: "",
  boardSerial: "",
  removalDate: "",
  usageType: "一次",
  warehouse: "",
  purchasePriceExTax: "",
  purchasePriceIncTax: "",
  saleDate: "",
  saleDestination: "",
  salePriceExTax: "",
  salePriceIncTax: "",
  stockInDate: "",
  stockOutDate: "",
  stockOutDestination: "",
  note: "",
  externalCompany: "",
  externalStore: "",
  serialNumber: "",
  inspectionInfo: "",
  installDate: "",
  inspectionDate: "",
  approvalDate: "",
  hasDocuments: false,
});

export default function InventoryNewPage() {
  const router = useRouter();
  const [rows, setRows] = useState<InventoryFormRow[]>([createEmptyRow()]);

  // 行のフィールド更新
  const handleRowChange = <K extends keyof InventoryFormRow>(
    index: number,
    key: K,
    value: InventoryFormRow[K],
  ) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  // 新規行の追加
  const addEmptyLine = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  // 直前行のコピー追加
  const copyPreviousLine = () => {
    setRows((prev) => {
      const lastRow = prev[prev.length - 1] ?? createEmptyRow();
      return [...prev, { ...lastRow }];
    });
  };

  // 行の削除（最低1行は残す）
  const removeLine = (index: number) => {
    setRows((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [createEmptyRow()];
    });
  };

  // カテゴリとメーカーから機種候補を取得
  const modelCandidates = (
    category: InventoryCategory,
    manufacturer: (typeof MANUFACTURER_OPTIONS)[number],
  ) => {
    const byCategory = MODEL_OPTIONS[category];
    return byCategory?.[manufacturer] ?? [];
  };

  // 登録用データの生成（掲載IDは自動生成）
  const newItems = useMemo(() => {
    const baseTimestamp = Date.now();
    return rows.map<StoredInventoryItem>((row, index) => {
      return {
        id: baseTimestamp + index,
        status: "倉庫",
        listingStatus: "UNLISTED",
        listingId: `LIST-${baseTimestamp}-${index + 1}`,
        category: row.category,
        manufacturer: row.manufacturer,
        modelName: row.modelName,
        colorPanel: row.colorPanel,
        inspectionNumber: row.inspectionNumber,
        frameSerial: row.frameSerial,
        boardSerial: row.boardSerial,
        removalDate: row.removalDate ? row.removalDate : null,
        usageType: row.usageType,
        warehouse: row.warehouse,
        note: row.note,
        installDate: row.installDate || null,
        inspectionDate: row.inspectionDate || null,
        approvalDate: row.approvalDate || null,
        purchaseSource: row.purchaseSource,
        purchaseRepresentative: row.purchaseRepresentative,
        taxCategory: row.taxCategory,
        isConsignment: row.isConsignment,
        purchasePriceExTax: parseNumber(row.purchasePriceExTax),
        purchasePriceIncTax: parseNumber(row.purchasePriceIncTax),
        saleDate: row.saleDate ? row.saleDate : null,
        saleDestination: row.saleDestination,
        salePriceExTax: parseNumber(row.salePriceExTax),
        salePriceIncTax: parseNumber(row.salePriceIncTax),
        externalCompany: row.externalCompany,
        externalStore: row.externalStore,
        stockInDate: row.stockInDate ? row.stockInDate : null,
        stockOutDate: row.stockOutDate ? row.stockOutDate : null,
        stockOutDestination: row.stockOutDestination,
        serialNumber: row.serialNumber,
        inspectionInfo: row.inspectionInfo,
        hasDocuments: row.hasDocuments,
      } satisfies StoredInventoryItem;
    });
  }, [rows]);

  // フォーム送信処理
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addInventoryItems(newItems);
    router.push("/inventory");
  };

  return (
    <MainContainer>
      <div className="mx-auto max-w-5xl space-y-4">
        {/* ヘッダー */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">在庫登録</h1>
            <p className="mt-1 text-sm text-neutral-600">
              仕入れ先情報を1行目、機種情報と取引情報を2行目に入力し、複数行まとめて保存できます。
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/inventory")}
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 shadow-sm hover:border-sky-300 hover:bg-sky-100"
          >
            ← 戻る
          </button>
        </div>

        {/* 行追加／コピー */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addEmptyLine}
            className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
          >
            行を追加
          </button>
          <button
            type="button"
            onClick={copyPreviousLine}
            className="rounded-md border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-sky-800 shadow-sm hover:bg-sky-50"
          >
            直前の行をコピー
          </button>
        </div>

        {/* 入力フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {rows.map((row, index) => {
            const candidateModels = modelCandidates(row.category, row.manufacturer);
            const datalistId = `model-options-${index}`;

            return (
              <div
                key={`inventory-row-${index}`}
                className="space-y-3 rounded-2xl border border-sky-100 bg-white/70 p-4 shadow-sm"
              >
                {/* 行ヘッダーと削除ボタン */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-neutral-900">登録行 {index + 1}</div>
                  <div className="flex items-center gap-2 text-xs text-sky-700">
                    <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold">共通情報</span>
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="rounded-full border border-sky-200 bg-white px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50"
                    >
                      行を削除
                    </button>
                  </div>
                </div>

                {/* 1行目：仕入情報 */}
                <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                  <div className="grid gap-3 md:grid-cols-4">
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      仕入先（購入元）
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.purchaseSource}
                        onChange={(e) => handleRowChange(index, "purchaseSource", e.target.value)}
                        placeholder="例: 〇〇商事"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      仕入担当
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.purchaseRepresentative}
                        onChange={(e) => handleRowChange(index, "purchaseRepresentative", e.target.value)}
                        placeholder="担当者名"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      消費税区分
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.taxCategory}
                        onChange={(e) => handleRowChange(index, "taxCategory", e.target.value)}
                        placeholder="10% / 非課税 など"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-sky-600"
                          checked={row.isConsignment}
                          onChange={(e) => handleRowChange(index, "isConsignment", e.target.checked)}
                        />
                        委託取引
                      </span>
                    </label>
                  </div>
                </div>

                {/* 2行目：機種情報・取引情報 */}
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <div className="mb-1 text-xs font-semibold text-blue-700">機種情報・取引情報</div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {/* 種別 */}
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      種別
                      <select
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.category}
                        onChange={(e) =>
                          handleRowChange(index, "category", e.target.value as InventoryCategory)
                        }
                      >
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    {/* メーカー */}
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      メーカー
                      <select
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.manufacturer}
                        onChange={(e) => handleRowChange(index, "manufacturer", e.target.value as any)}
                      >
                        {MANUFACTURER_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    {/* 機種名 */}
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      機種名
                      <input
                        type="text"
                        list={datalistId}
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.modelName}
                        onChange={(e) => handleRowChange(index, "modelName", e.target.value)}
                        placeholder="候補から選択または入力"
                      />
                      <datalist id={datalistId}>
                        {candidateModels.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </label>
                    {/* 以下、その他の入力欄を同様にブルー系スタイルで配置 */}
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      枠色／パネル
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.colorPanel}
                        onChange={(e) => handleRowChange(index, "colorPanel", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      遊技盤番号
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.inspectionNumber}
                        onChange={(e) => handleRowChange(index, "inspectionNumber", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      枠番号
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.frameSerial}
                        onChange={(e) => handleRowChange(index, "frameSerial", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      主要基板番号
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.boardSerial}
                        onChange={(e) => handleRowChange(index, "boardSerial", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      撤去日
                      <input
                        type="date"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.removalDate}
                        onChange={(e) => handleRowChange(index, "removalDate", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      使用次
                      <select
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.usageType}
                        onChange={(e) =>
                          handleRowChange(index, "usageType", e.target.value as "一次" | "二次")
                        }
                      >
                        {USAGE_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      倉庫
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.warehouse}
                        onChange={(e) => handleRowChange(index, "warehouse", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      購入金額（税抜）
                      <input
                        type="number"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.purchasePriceExTax}
                        onChange={(e) => handleRowChange(index, "purchasePriceExTax", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      購入金額（税込）
                      <input
                        type="number"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.purchasePriceIncTax}
                        onChange={(e) => handleRowChange(index, "purchasePriceIncTax", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      売却日
                      <input
                        type="date"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.saleDate}
                        onChange={(e) => handleRowChange(index, "saleDate", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      売却先
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.saleDestination}
                        onChange={(e) => handleRowChange(index, "saleDestination", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      売却金額（税抜）
                      <input
                        type="number"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.salePriceExTax}
                        onChange={(e) => handleRowChange(index, "salePriceExTax", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      売却金額（税込）
                      <input
                        type="number"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.salePriceIncTax}
                        onChange((e) => handleRowChange(index, "salePriceIncTax", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      入庫日
                      <input
                        type="date"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.stockInDate}
                        onChange((e) => handleRowChange(index, "stockInDate", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      出庫日
                      <input
                        type="date"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.stockOutDate}
                        onChange((e) => handleRowChange(index, "stockOutDate", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      出庫先
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.stockOutDestination}
                        onChange((e) => handleRowChange(index, "stockOutDestination", e.target.value)}
                      />
                    </label>
                    {/* メモ欄 */}
                    <label className="flex flex-col gap-1 text-sm text-neutral-700 md:col-span-3">
                      備考
                      <textarea
                        className="min-h-[80px] rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.note}
                        onChange((e) => handleRowChange(index, "note", e.target.value)}
                        placeholder="取引メモや特記事項を入力"
                      />
                    </label>
                    {/* 日付・外部情報・書類有無など */}
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      設置日
                      <input
                        type="date"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.installDate}
                        onChange((e) => handleRowChange(index, "installDate", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      検査日
                      <input
                        type="date"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.inspectionDate}
                        onChange((e) => handleRowChange(index, "inspectionDate", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      承認日
                      <input
                        type="date"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.approvalDate}
                        onChange((e) => handleRowChange(index, "approvalDate", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      外部法人
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.externalCompany}
                        onChange((e) => handleRowChange(index, "externalCompany", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      外部店舗
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.externalStore}
                        onChange((e) => handleRowChange(index, "externalStore", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      シリアル番号
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.serialNumber}
                        onChange((e) => handleRowChange(index, "serialNumber", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      検査情報
                      <input
                        type="text"
                        className="rounded border border-sky-200 px-3 py-2 text-sm"
                        value={row.inspectionInfo}
                        onChange((e) => handleRowChange(index, "inspectionInfo", e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-neutral-700">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-sky-600"
                          checked={row.hasDocuments}
                          onChange((e) => handleRowChange(index, "hasDocuments", e.target.checked)}
                        />
                        書類あり
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 登録ボタン */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
            >
              在庫を登録
            </button>
          </div>
        </form>
      </div>
    </MainContainer>
  );
}
