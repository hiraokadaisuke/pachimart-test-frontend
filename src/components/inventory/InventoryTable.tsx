import type { InventoryItem, InventoryStatus } from "@/types/inventory";

import { ALL_INVENTORY_COLUMN_OPTIONS, type InventoryColumnId, type InventorySortKey } from "./columnOptions";

const statusStyles: Record<InventoryStatus, string> = {
  在庫中: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  出品中: "bg-green-50 text-green-700 ring-1 ring-green-200",
  成功済み: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

interface InventoryColumnDefinition {
  id: InventoryColumnId;
  render: (item: InventoryItem) => React.ReactNode;
}

interface InventoryTableProps {
  items: InventoryItem[];
  visibleColumnIds: InventoryColumnId[];
  onSortChange?: (key: InventorySortKey) => void;
  sortKey?: InventorySortKey | null;
  sortOrder?: "asc" | "desc";
}

const columnLabels = ALL_INVENTORY_COLUMN_OPTIONS.reduce<Record<InventoryColumnId, string>>((acc, option) => {
  acc[option.id] = option.label;
  return acc;
}, {} as Record<InventoryColumnId, string>);

const columnWidthClasses: Partial<Record<InventoryColumnId, string>> = {
  status: "w-[90px]",
  category: "w-[80px]",
  maker: "w-[100px]",
  model: "w-[200px]",
  frameColorPanel: "w-[120px]",
  gameBoardNumber: "w-[120px]",
  frameSerial: "w-[120px]",
  mainBoardSerial: "w-[120px]",
  removalDate: "w-[110px]",
  warehouse: "w-[140px]",
  pachimartSalePrice: "w-[110px]",
  saleDate: "w-[110px]",
  saleDestination: "w-[140px]",
  note: "w-[160px]",
};

const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null) return "-";
  return `${value.toLocaleString()} 円`;
};

const columnDefinitions: InventoryColumnDefinition[] = [
  {
    id: "status",
    render: (item) => (
      <span className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold ${statusStyles[item.status]}`}>
        {item.status}
      </span>
    ),
  },
  { id: "category", render: (item) => item.category },
  { id: "maker", render: (item) => item.manufacturer },
  { id: "model", render: (item) => <span className="font-semibold text-slate-900">{item.modelName}</span> },
  { id: "frameColorPanel", render: (item) => item.colorPanel },
  { id: "gameBoardNumber", render: (item) => item.inspectionNumber ?? "-" },
  { id: "frameSerial", render: (item) => item.frameSerial ?? "-" },
  { id: "mainBoardSerial", render: (item) => item.boardSerial ?? "-" },
  { id: "removalDate", render: (item) => item.removalDate ?? "-" },
  { id: "usageCount", render: (item) => item.usageCount ?? "-" },
  { id: "warehouse", render: (item) => item.warehouse ?? "-" },
  { id: "note", render: (item) => item.note ?? "-" },
  { id: "installDate", render: (item) => item.installDate ?? "-" },
  { id: "installPeriod", render: (item) => item.installPeriod ?? "-" },
  { id: "inspectionDate", render: (item) => item.inspectionDate ?? "-" },
  { id: "inspectionExpiry", render: (item) => item.inspectionExpiry ?? "-" },
  { id: "approvalDate", render: (item) => item.approvalDate ?? "-" },
  { id: "approvalExpiry", render: (item) => item.approvalExpiry ?? "-" },
  { id: "purchaseSource", render: (item) => item.purchaseSource ?? "-" },
  { id: "purchasePriceExTax", render: (item) => formatNumber(item.purchasePriceExTax) },
  { id: "purchasePriceIncTax", render: (item) => formatNumber(item.purchasePriceIncTax) },
  { id: "saleDate", render: (item) => item.saleDate ?? "-" },
  { id: "saleDestination", render: (item) => item.saleDestination ?? item.buyer ?? "-" },
  { id: "salePriceExTax", render: (item) => formatNumber(item.salePriceExTax) },
  { id: "salePriceIncTax", render: (item) => formatNumber(item.salePriceIncTax) },
  { id: "externalCompany", render: (item) => item.externalCompany ?? "-" },
  { id: "externalStore", render: (item) => item.externalStore ?? "-" },
  { id: "stockInDate", render: (item) => item.stockInDate ?? "-" },
  { id: "scanDate", render: (item) => item.scanDate ?? "-" },
  { id: "scanStaff", render: (item) => item.scanStaff ?? "-" },
  { id: "storageFeeCalc", render: (item) => item.storageFeeCalc ?? "-" },
  { id: "glassCylinder", render: (item) => item.glassCylinder ?? "-" },
  {
    id: "pachimartSalePrice",
    render: (item) => formatNumber(item.pachimartSalePrice ?? item.salePrice ?? item.salePriceIncTax ?? item.salePriceExTax),
  },
  { id: "nailSheet", render: (item) => item.nailSheet ?? "-" },
  { id: "pachimartStatus", render: (item) => item.pachimartStatus ?? "-" },
];

const columnSortKeyMap: Partial<Record<InventoryColumnId, InventorySortKey>> = {
  status: "status",
  category: "category",
  maker: "maker",
  model: "model",
  frameColorPanel: "frameColorPanel",
  gameBoardNumber: "gameBoardNumber",
  frameSerial: "frameSerial",
  mainBoardSerial: "mainBoardSerial",
  removalDate: "removalDate",
  warehouse: "warehouse",
  saleDate: "saleDate",
  saleDestination: "saleDestination",
  pachimartSalePrice: "salePrice",
};

export function InventoryTable({ items, visibleColumnIds, onSortChange, sortKey, sortOrder }: InventoryTableProps) {
  const orderedVisibleColumns = visibleColumnIds
    .map((id) => columnDefinitions.find((column) => column.id === id))
    .filter((column): column is InventoryColumnDefinition => Boolean(column));

  return (
    <div className="relative max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white text-xs shadow-sm">
      <table className="min-w-[1200px] w-full border-collapse text-[11px] text-slate-800">
        <thead className="sticky top-0 z-10 bg-slate-100 text-left font-semibold text-slate-900">
          <tr>
            {orderedVisibleColumns.map((column) => {
              const sortableKey = columnSortKeyMap[column.id];
              const isActive = sortableKey && sortKey === sortableKey;
              const isSortable = Boolean(sortableKey && onSortChange);
              const widthClass = columnWidthClasses[column.id] ?? "";

              return (
                <th
                  key={column.id}
                  className={`${widthClass} whitespace-nowrap px-2 py-1.5 text-[11px] font-semibold text-slate-600`}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => sortableKey && onSortChange?.(sortableKey)}
                      className="inline-flex items-center gap-1 text-left text-slate-800"
                    >
                      <span>{columnLabels[column.id]}</span>
                      {isActive && (
                        <span className="text-[10px] text-slate-500">{sortOrder === "asc" ? "▲" : "▼"}</span>
                      )}
                    </button>
                  ) : (
                    columnLabels[column.id]
                  )}
                </th>
              );
            })}
            <th className="w-[140px] whitespace-nowrap px-2 py-1.5 text-center text-[11px] font-semibold text-slate-600">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="odd:bg-white even:bg-slate-50 border-t border-slate-200 hover:bg-blue-50/30">
              {orderedVisibleColumns.map((column) => (
                <td
                  key={`${item.id}-${column.id}`}
                  className={`${columnWidthClasses[column.id] ?? ""} whitespace-nowrap px-2 py-1 text-[11px] text-slate-800`}
                >
                  {column.render(item)}
                </td>
              ))}
              <td className="w-[140px] whitespace-nowrap px-2 py-1 text-[11px]">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      /* TODO: 出品処理を実装 */
                    }}
                    className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    出品
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      /* TODO: 取り下げ処理を実装 */
                    }}
                    className="rounded border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-700 transition hover:bg-orange-100"
                  >
                    取り下げ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      /* TODO: 詳細表示処理を実装 */
                    }}
                    className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    詳細
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">在庫データがありません。</div>
      )}
    </div>
  );
}
