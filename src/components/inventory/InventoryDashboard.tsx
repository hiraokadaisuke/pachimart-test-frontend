"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
import type {
  InventoryCategory,
  InventoryDocumentKind,
  InventoryDocumentMeta,
  InventoryItem,
  InventoryStatus,
} from "@/types/inventory";
import { InventoryColumnSelectorModal } from "./InventoryColumnSelectorModal";
import { InventoryDocumentsModal } from "./InventoryDocumentsModal";
import { InventoryTable } from "./InventoryTable";
import {
  DEFAULT_INVENTORY_COLUMNS,
  type InventoryColumnId,
  type InventoryColumnSetting,
  type InventorySortKey,
} from "./columnSettings";

const PAGE_SIZE = 20;

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
  onPageClick: (page: number) => void;
};

function InventoryPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPrev,
  onNext,
  onPageClick,
}: PaginationProps) {
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  const pages: number[] = [];
  for (let p = 1; p <= totalPages; p += 1) {
    pages.push(p);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 shadow-sm">
      <div>{totalCount > 0 ? `${start} - ${end} / ${totalCount}件` : "0 件"}</div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage === 1}
          className="rounded border px-2 py-[3px] text-[11px] font-semibold disabled:opacity-40"
        >
          前へ
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageClick(p)}
            className={`min-w-[28px] rounded border px-2 py-[3px] text-[11px] font-semibold ${p === currentPage ? " border-blue-600 bg-blue-600 text-white" : " bg-white"}`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="rounded border px-2 py-[3px] text-[11px] font-semibold disabled:opacity-40"
        >
          次へ
        </button>
      </div>
    </div>
  );
}

const fallbackInventory: InventoryItem[] = [
  {
    id: 1,
    status: "在庫中",
    category: "パチンコ",
    manufacturer: "三洋",
    modelName: "大海物語5",
    colorPanel: "ブルーパネル",
    inspectionNumber: "4P-123456",
    frameSerial: "FRM-00123",
    boardSerial: "BRD-98765",
    removalDate: "2024-07-15",
    warehouse: "東京第1倉庫",
    hasDocuments: true,
  },
  {
    id: 2,
    status: "出品中",
    category: "パチスロ",
    manufacturer: "ユニバーサル",
    modelName: "バジリスク絆3",
    colorPanel: "レッドパネル",
    inspectionNumber: "6S-654321",
    frameSerial: "FRM-00456",
    boardSerial: "BRD-24680",
    removalDate: null,
    warehouse: "埼玉倉庫",
    salePrice: 320000,
    hasDocuments: true,
  },
  {
    id: 3,
    status: "成功済み",
    category: "パチンコ",
    manufacturer: "京楽",
    modelName: "冬のソナタ FOREVER",
    colorPanel: "ホワイトパネル",
    inspectionNumber: "4P-654987",
    frameSerial: "FRM-00999",
    boardSerial: "BRD-13579",
    removalDate: "2024-05-10",
    warehouse: "大阪倉庫",
    salePrice: 280000,
    saleDate: "2024-06-02",
    buyer: "ABCパチンコ",
  },
  {
    id: 4,
    status: "在庫中",
    category: "パチスロ",
    manufacturer: "山佐",
    modelName: "スマスロ モンキーターンV",
    colorPanel: "ブラックパネル",
    inspectionNumber: "6S-112233",
    frameSerial: "FRM-01010",
    boardSerial: "BRD-20202",
    removalDate: "2024-08-01",
    warehouse: "東京第2倉庫",
  },
  {
    id: 5,
    status: "出品中",
    category: "パチンコ",
    manufacturer: "SANKYO",
    modelName: "フィーバー 機動戦士ガンダムSEED",
    colorPanel: "ブラック×ネイビー",
    inspectionNumber: "4P-777111",
    frameSerial: "FRM-10101",
    boardSerial: "BRD-30303",
    removalDate: "2024-07-30",
    warehouse: "埼玉倉庫",
  },
  {
    id: 6,
    status: "成功済み",
    category: "パチスロ",
    manufacturer: "サミー",
    modelName: "スマスロ 北斗の拳",
    colorPanel: "ブルーブラック",
    inspectionNumber: "6S-998877",
    frameSerial: "FRM-30303",
    boardSerial: "BRD-50505",
    removalDate: "2024-06-20",
    warehouse: "大阪倉庫",
    salePrice: 450000,
    saleDate: "2024-07-01",
    buyer: "北新地ホール",
  },
  {
    id: 7,
    status: "在庫中",
    category: "パチンコ",
    manufacturer: "平和",
    modelName: "ルパン三世 THE FIRST",
    colorPanel: "ゴールドパネル",
    inspectionNumber: "4P-222555",
    frameSerial: "FRM-50505",
    boardSerial: "BRD-60606",
    removalDate: "2024-09-10",
    warehouse: "東京第1倉庫",
  },
  {
    id: 8,
    status: "出品中",
    category: "パチスロ",
    manufacturer: "北電子",
    modelName: "ジャグラーEX",
    colorPanel: "クラシック",
    inspectionNumber: "6S-334455",
    frameSerial: "FRM-70707",
    boardSerial: "BRD-80808",
    removalDate: null,
    warehouse: "埼玉倉庫",
  },
  {
    id: 9,
    status: "在庫中",
    category: "パチンコ",
    manufacturer: "藤商事",
    modelName: "リング 呪いの7日間2",
    colorPanel: "ブラックレッド",
    inspectionNumber: "4P-889900",
    frameSerial: "FRM-80808",
    boardSerial: "BRD-01010",
    removalDate: "2024-10-05",
    warehouse: "大阪倉庫",
  },
  {
    id: 10,
    status: "成功済み",
    category: "パチスロ",
    manufacturer: "メーシー",
    modelName: "バイオハザードRE:2",
    colorPanel: "グレーパネル",
    inspectionNumber: "6S-556677",
    frameSerial: "FRM-90909",
    boardSerial: "BRD-11111",
    removalDate: "2024-05-18",
    warehouse: "東京第2倉庫",
    salePrice: 380000,
    saleDate: "2024-06-10",
    buyer: "横浜アミューズ",
  },
  {
    id: 11,
    status: "出品中",
    category: "パチンコ",
    manufacturer: "ビスティ",
    modelName: "新世紀エヴァンゲリオン 未来への咆哮",
    colorPanel: "エメラルドパネル",
    inspectionNumber: "4P-445566",
    frameSerial: "FRM-11122",
    boardSerial: "BRD-22211",
    removalDate: "2024-08-20",
    warehouse: "東京第1倉庫",
  },
  {
    id: 12,
    status: "在庫中",
    category: "パチスロ",
    manufacturer: "ディライト",
    modelName: "L主役は銭形4",
    colorPanel: "レッド",
    inspectionNumber: "6S-221144",
    frameSerial: "FRM-33344",
    boardSerial: "BRD-55533",
    removalDate: "2024-11-12",
    warehouse: "大阪倉庫",
  },
  {
    id: 13,
    status: "成功済み",
    category: "パチンコ",
    manufacturer: "ニューギン",
    modelName: "P真・牙狼2",
    colorPanel: "ゴールドブラック",
    inspectionNumber: "4P-119922",
    frameSerial: "FRM-44455",
    boardSerial: "BRD-66644",
    removalDate: "2024-04-28",
    warehouse: "埼玉倉庫",
    salePrice: 295000,
    saleDate: "2024-05-12",
    buyer: "所沢レジャー",
  },
  {
    id: 14,
    status: "出品中",
    category: "パチスロ",
    manufacturer: "大都技研",
    modelName: "L吉宗RISING",
    colorPanel: "ブラック×金",
    inspectionNumber: "6S-778899",
    frameSerial: "FRM-55566",
    boardSerial: "BRD-77755",
    removalDate: "2024-09-01",
    warehouse: "東京第2倉庫",
  },
  {
    id: 15,
    status: "在庫中",
    category: "パチンコ",
    manufacturer: "西陣",
    modelName: "CR花満開天ノ舞",
    colorPanel: "ピンクパネル",
    inspectionNumber: "4P-667788",
    frameSerial: "FRM-66677",
    boardSerial: "BRD-88866",
    removalDate: "2024-12-20",
    warehouse: "埼玉倉庫",
  },
  {
    id: 16,
    status: "在庫中",
    category: "パチスロ",
    manufacturer: "オリンピア",
    modelName: "マイジャグラーV",
    colorPanel: "ホワイト",
    inspectionNumber: "6S-990011",
    frameSerial: "FRM-77788",
    boardSerial: "BRD-99977",
    removalDate: null,
    warehouse: "大阪倉庫",
  },
  {
    id: 17,
    status: "成功済み",
    category: "パチンコ",
    manufacturer: "高尾",
    modelName: "P弾球黙示録カイジ沼4",
    colorPanel: "ダークグリーン",
    inspectionNumber: "4P-333999",
    frameSerial: "FRM-88899",
    boardSerial: "BRD-00088",
    removalDate: "2024-03-15",
    warehouse: "東京第1倉庫",
    salePrice: 210000,
    saleDate: "2024-04-01",
    buyer: "千葉ステーション",
  },
  {
    id: 18,
    status: "出品中",
    category: "パチスロ",
    manufacturer: "サンスリー",
    modelName: "S海物語IN JAPAN",
    colorPanel: "ブルーパール",
    inspectionNumber: "6S-774411",
    frameSerial: "FRM-99900",
    boardSerial: "BRD-11100",
    removalDate: "2024-08-25",
    warehouse: "東京第2倉庫",
  },
  {
    id: 19,
    status: "在庫中",
    category: "パチンコ",
    manufacturer: "京楽",
    modelName: "ぱちんこ AKB48 桜LIGHT",
    colorPanel: "ピンクブラック",
    inspectionNumber: "4P-223344",
    frameSerial: "FRM-12121",
    boardSerial: "BRD-21212",
    removalDate: "2024-10-30",
    warehouse: "埼玉倉庫",
  },
  {
    id: 20,
    status: "成功済み",
    category: "パチスロ",
    manufacturer: "KPE",
    modelName: "マジカルハロウィン8",
    colorPanel: "オレンジブラック",
    inspectionNumber: "6S-440022",
    frameSerial: "FRM-23232",
    boardSerial: "BRD-32323",
    removalDate: "2024-06-12",
    warehouse: "大阪倉庫",
    salePrice: 265000,
    saleDate: "2024-06-25",
    buyer: "難波エンタメ",
  },
  {
    id: 21,
    status: "出品中",
    category: "パチンコ",
    manufacturer: "SANKYO",
    modelName: "PF炎炎ノ消防隊",
    colorPanel: "ネイビーパネル",
    inspectionNumber: "4P-664422",
    frameSerial: "FRM-34343",
    boardSerial: "BRD-43434",
    removalDate: null,
    warehouse: "東京第1倉庫",
  },
  {
    id: 22,
    status: "在庫中",
    category: "パチスロ",
    manufacturer: "SANYO",
    modelName: "Lラブ嬢3",
    colorPanel: "レッドゴールド",
    inspectionNumber: "6S-778855",
    frameSerial: "FRM-45454",
    boardSerial: "BRD-54545",
    removalDate: "2024-11-05",
    warehouse: "東京第2倉庫",
  },
  {
    id: 23,
    status: "成功済み",
    category: "パチンコ",
    manufacturer: "OK!!",
    modelName: "ぱちんこ GANTZ覚醒",
    colorPanel: "ブラックメタリック",
    inspectionNumber: "4P-556644",
    frameSerial: "FRM-56565",
    boardSerial: "BRD-65656",
    removalDate: "2024-04-05",
    warehouse: "大阪倉庫",
    salePrice: 305000,
    saleDate: "2024-04-18",
    buyer: "梅田ホール",
  },
  {
    id: 24,
    status: "出品中",
    category: "パチスロ",
    manufacturer: "オーイズミ",
    modelName: "ひぐらしのなく頃に 祭2",
    colorPanel: "ホワイトブルー",
    inspectionNumber: "6S-991122",
    frameSerial: "FRM-67676",
    boardSerial: "BRD-76767",
    removalDate: "2024-09-15",
    warehouse: "埼玉倉庫",
  },
  {
    id: 25,
    status: "在庫中",
    category: "パチンコ",
    manufacturer: "サンセイ",
    modelName: "Pゴッドイーター究極一閃",
    colorPanel: "ブラックゴールド",
    inspectionNumber: "4P-881166",
    frameSerial: "FRM-78787",
    boardSerial: "BRD-87878",
    removalDate: "2024-10-08",
    warehouse: "東京第1倉庫",
  },
  {
    id: 26,
    status: "成功済み",
    category: "パチスロ",
    manufacturer: "NET",
    modelName: "スナイパイ71",
    colorPanel: "ホワイトグリーン",
    inspectionNumber: "6S-550033",
    frameSerial: "FRM-89898",
    boardSerial: "BRD-98989",
    removalDate: "2024-05-22",
    warehouse: "大阪倉庫",
    salePrice: 180000,
    saleDate: "2024-06-03",
    buyer: "心斎橋プラザ",
  },
  {
    id: 27,
    status: "出品中",
    category: "パチンコ",
    manufacturer: "マルホン",
    modelName: "P天龍∞",
    colorPanel: "グリーンパネル",
    inspectionNumber: "4P-664400",
    frameSerial: "FRM-90990",
    boardSerial: "BRD-09090",
    removalDate: "2024-12-01",
    warehouse: "東京第1倉庫",
  },
  {
    id: 28,
    status: "在庫中",
    category: "パチスロ",
    manufacturer: "パイオニア",
    modelName: "沖ドキ!GOLD",
    colorPanel: "ゴールド",
    inspectionNumber: "6S-663399",
    frameSerial: "FRM-01019",
    boardSerial: "BRD-19191",
    removalDate: null,
    warehouse: "東京第2倉庫",
  },
  {
    id: 29,
    status: "成功済み",
    category: "パチンコ",
    manufacturer: "豊丸",
    modelName: "P弾球黙示録カイジ沼5",
    colorPanel: "ネイビーシルバー",
    inspectionNumber: "4P-114477",
    frameSerial: "FRM-02020",
    boardSerial: "BRD-20202",
    removalDate: "2024-07-02",
    warehouse: "埼玉倉庫",
    salePrice: 230000,
    saleDate: "2024-07-20",
    buyer: "大宮スター",
  },
  {
    id: 30,
    status: "出品中",
    category: "パチスロ",
    manufacturer: "サミー",
    modelName: "この素晴らしい世界に祝福を!",
    colorPanel: "ブルーホワイト",
    inspectionNumber: "6S-889911",
    frameSerial: "FRM-30333",
    boardSerial: "BRD-31313",
    removalDate: "2024-10-18",
    warehouse: "大阪倉庫",
  },
];

export function InventoryDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<InventorySortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus[] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory[] | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [columns, setColumns] = useState<InventoryColumnSetting[]>(DEFAULT_INVENTORY_COLUMNS);
  const [documentsByItem, setDocumentsByItem] = useState<Record<number, InventoryDocumentMeta[]>>({});
  const [documentsModalItemId, setDocumentsModalItemId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        console.warn("Supabase credentials are not set. Falling back to placeholder data.");
        setInventory(fallbackInventory);
        return;
      }

      const { data, error } = await supabase.from<InventoryItem>("inventories").select("*");

      if (error || !data) {
        console.error("Failed to fetch inventory from Supabase", error);
        setInventory(fallbackInventory);
        return;
      }

      setInventory(data);
    };

    fetchData();
  }, []);

  const allWarehouses = useMemo(
    () => Array.from(new Set(inventory.map((item) => item.warehouse).filter(Boolean))),
    [inventory],
  );

  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return inventory.filter((item) => {
      if (query) {
        const hit = [item.manufacturer, item.modelName, item.inspectionNumber]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(query));
        if (!hit) return false;
      }

      if (statusFilter && statusFilter.length > 0 && !statusFilter.includes(item.status)) {
        return false;
      }

      if (categoryFilter && categoryFilter.length > 0 && !categoryFilter.includes(item.category)) {
        return false;
      }

      if (warehouseFilter && warehouseFilter !== "all" && item.warehouse !== warehouseFilter) {
        return false;
      }

      return true;
    });
  }, [categoryFilter, inventory, searchQuery, statusFilter, warehouseFilter]);

  const sortedInventory = useMemo(() => {
    const items = [...filteredInventory];
    if (!sortKey) return items;

    items.sort((a, b) => {
      const order = sortOrder === "asc" ? 1 : -1;

      const getValue = (item: InventoryItem) => {
        switch (sortKey) {
          case "status":
            return item.status;
          case "category":
            return item.category;
          case "maker":
            return item.manufacturer;
          case "model":
            return item.modelName;
          case "frameColorPanel":
            return item.colorPanel;
          case "inspectionNumber":
            return item.inspectionNumber;
          case "frameSerial":
            return item.frameSerial;
          case "boardSerial":
            return item.boardSerial;
          case "removalDate":
            return item.removalDate ?? "";
          case "warehouse":
            return item.warehouse;
          case "salePrice":
            return item.pachimartSalePrice ?? item.salePrice ?? item.salePriceIncTax ?? item.salePriceExTax ?? 0;
          case "soldAt":
            return item.saleDate ?? "";
          case "buyer":
            return item.saleDestination ?? item.buyer ?? "";
          default:
            return "";
        }
      };

      const va = getValue(a);
      const vb = getValue(b);

      if (typeof va === "number" && typeof vb === "number") {
        return va === vb ? 0 : va > vb ? order : -order;
      }

      const sa = String(va);
      const sb = String(vb);

      return sa === sb ? 0 : sa > sb ? order : -order;
    });

    return items;
  }, [filteredInventory, sortKey, sortOrder]);

  const totalCount = sortedInventory.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((prev) => {
      if (prev < 1) return 1;
      if (prev > totalPages) return totalPages;
      return prev;
    });
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, warehouseFilter]);

  const paginatedItems = useMemo(
    () => sortedInventory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sortedInventory, currentPage],
  );

  const visibleColumns = useMemo(() => columns.filter((column) => column.visible), [columns]);

  const allItems = sortedInventory;

  const activeItem =
    documentsModalItemId != null
      ? allItems.find((item) => item.id === documentsModalItemId)
      : undefined;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  const handleSortChange = (key: InventorySortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleHeaderReorder = (newOrder: InventoryColumnId[]) => {
    setColumns((prev) => {
      const map = new Map(prev.map((column) => [column.id, column] as const));
      return newOrder
        .map((id) => map.get(id))
        .filter((column): column is InventoryColumnSetting => Boolean(column))
        .concat(prev.filter((column) => !newOrder.includes(column.id)));
    });
  };

  const handleColumnToggle = () => {
    setIsColumnSelectorOpen(true);
  };

  const handleCloseColumnSelector = () => {
    setIsColumnSelectorOpen(false);
  };

  const handleChangeColumns = (next: InventoryColumnSetting[]) => {
    setColumns(next);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: CSVインポート処理を実装
      console.log("CSV import stub", file.name);
    }
  };

  const upsertInventoryDocument = (
    itemId: number,
    kind: InventoryDocumentKind,
    file: File,
  ) => {
    setDocumentsByItem((prev) => {
      const current = prev[itemId] ?? [];

      const existed = current.find((document) => document.kind === kind);
      if (existed) {
        URL.revokeObjectURL(existed.objectUrl);
      }

      const nextDoc: InventoryDocumentMeta = {
        kind,
        fileName: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        objectUrl: URL.createObjectURL(file),
      };

      const nextList = [...current.filter((document) => document.kind !== kind), nextDoc];

      return {
        ...prev,
        [itemId]: nextList,
      };
    });
  };

  const getInventoryDocuments = (itemId: number): InventoryDocumentMeta[] => {
    return documentsByItem[itemId] ?? [];
  };

  const handleExportCsv = () => {
    const headers = [
      "id",
      "status",
      "category",
      "manufacturer",
      "modelName",
      "colorPanel",
      "inspectionNumber",
      "frameSerial",
      "boardSerial",
      "removalDate",
      "warehouse",
      "salePrice",
      "saleDate",
      "buyer",
    ];

    const escapeCsv = (value: string | number | null | undefined) => {
      const normalized = value ?? "";
      const stringified = typeof normalized === "number" ? normalized.toString() : normalized;
      return `"${stringified.replace(/"/g, '""')}"`;
    };

    const rows = sortedInventory.map((item) =>
      [
        item.id,
        item.status,
        item.category,
        item.manufacturer,
        item.modelName,
        item.colorPanel,
        item.inspectionNumber,
        item.frameSerial,
        item.boardSerial,
        item.removalDate,
        item.warehouse,
        item.salePrice,
        item.saleDate,
        item.buyer,
      ]
        .map(escapeCsv)
        .join(","),
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openDocumentsModal = (itemId: number) => {
    setDocumentsModalItemId(itemId);
  };

  const closeDocumentsModal = () => {
    setDocumentsModalItemId(null);
  };

  const handleUploadDocument = (
    itemId: number,
    kind: InventoryDocumentKind,
    file: File,
  ) => {
    upsertInventoryDocument(itemId, kind, file);
  };

  const toggleStatusFilter = (status: InventoryStatus) => {
    setStatusFilter((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next.size > 0 ? Array.from(next) : null;
    });
  };

  const toggleCategoryFilter = (category: InventoryCategory) => {
    setCategoryFilter((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next.size > 0 ? Array.from(next) : null;
    });
  };

  const handleWarehouseChange = (value: string) => {
    setWarehouseFilter(value === "all" ? null : value);
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setCategoryFilter(null);
    setWarehouseFilter(null);
  };

  const handleShowStats = () => {
    // TODO: 統計情報の表示処理を実装
    console.log("統計情報を表示する準備");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">在庫管理ダッシュボード</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
              aria-label="通知"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.25 18.75a2.25 2.25 0 01-4.5 0m9-1.5H5.25a.75.75 0 01-.75-.75v-5.25a7.5 7.5 0 0115 0v5.25a.75.75 0 01-.75.75z"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              <span>管理者</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-500">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={handleColumnToggle}
            className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            項目を表示/非表示する
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            CSVインポート
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            CSVエクスポート
          </button>

          <div className="relative ml-auto flex w-full max-w-xl items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 shadow-inner md:w-auto md:flex-1 md:max-w-[520px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5 text-slate-400"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.64 5.64a7.5 7.5 0 0010.01 10.01z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="メーカー・機種名・検定番号で検索"
              className="ml-2 w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            絞り込み
          </button>

          <button
            type="button"
            onClick={handleShowStats}
            className="rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            統計
          </button>
        </div>

        <div className="mb-3">
          <InventoryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPrev={goToPrevPage}
            onNext={goToNextPage}
            onPageClick={goToPage}
          />
        </div>

        <InventoryTable
          items={paginatedItems}
          columns={visibleColumns}
          onHeaderReorder={handleHeaderReorder}
          onSortChange={handleSortChange}
          onOpenDocuments={openDocumentsModal}
          sortKey={sortKey}
          sortOrder={sortOrder}
        />

        <div className="mt-3">
          <InventoryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPrev={goToPrevPage}
            onNext={goToNextPage}
            onPageClick={goToPage}
          />
        </div>

        <InventoryDocumentsModal
          isOpen={documentsModalItemId != null}
          onClose={closeDocumentsModal}
          itemId={documentsModalItemId}
          itemTitle={
            activeItem ? `${activeItem.manufacturer} ${activeItem.modelName}` : undefined
          }
          documents={
            documentsModalItemId != null
              ? getInventoryDocuments(documentsModalItemId)
              : []
          }
          onUpload={(kind, file) =>
            documentsModalItemId != null &&
            handleUploadDocument(documentsModalItemId, kind, file)
          }
        />

        {isFilterOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">絞り込み条件</h2>
                  <p className="mt-1 text-sm text-slate-500">ステータス・カテゴリー・倉庫で条件を指定できます。</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="閉じる"
                  className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path
                      fillRule="evenodd"
                      d="M4.22 4.22a.75.75 0 011.06 0L10 8.94l4.72-4.72a.75.75 0 111.06 1.06L11.06 10l4.72 4.72a.75.75 0 11-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 11-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 010-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid gap-6 px-5 py-5 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">ステータス</h3>
                  <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-inner">
                    {(["在庫中", "出品中", "成功済み"] as InventoryStatus[]).map((status) => (
                      <label key={status} className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={statusFilter?.includes(status) ?? false}
                          onChange={() => toggleStatusFilter(status)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-800">カテゴリー</h3>
                  <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-inner">
                    {(["パチンコ", "パチスロ"] as InventoryCategory[]).map((category) => (
                      <label key={category} className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={categoryFilter?.includes(category) ?? false}
                          onChange={() => toggleCategoryFilter(category)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-800">倉庫</h3>
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-inner">
                    <select
                      value={warehouseFilter ?? "all"}
                      onChange={(event) => handleWarehouseChange(event.target.value)}
                      className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="all">すべての倉庫</option>
                      {allWarehouses.map((warehouse) => (
                        <option key={warehouse} value={warehouse}>
                          {warehouse}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  クリア
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                >
                  適用
                </button>
              </div>
            </div>
          </div>
        )}

        <InventoryColumnSelectorModal
          isOpen={isColumnSelectorOpen}
          onClose={handleCloseColumnSelector}
          columns={columns}
          onChangeColumns={handleChangeColumns}
        />
      </div>
    </div>
  );
}
