import React, { useEffect, useMemo, useState } from "react";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { InventoryItem, InventoryStatus } from "@/types/inventory";

import type {
  InventoryColumnId,
  InventoryColumnSetting,
  InventorySortKey,
} from "./columnSettings";

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
  columns: InventoryColumnSetting[];
  onHeaderReorder?: (newOrder: InventoryColumnId[]) => void;
  onSortChange?: (key: InventorySortKey) => void;
  sortKey?: InventorySortKey | null;
  sortOrder?: "asc" | "desc";
}

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
  { id: "inspectionNumber", render: (item) => item.inspectionNumber ?? "-" },
  { id: "frameSerial", render: (item) => item.frameSerial ?? "-" },
  { id: "boardSerial", render: (item) => item.boardSerial ?? "-" },
  { id: "removalDate", render: (item) => item.removalDate ?? "-" },
  { id: "warehouse", render: (item) => item.warehouse ?? "-" },
  {
    id: "salePrice",
    render: (item) => formatNumber(item.pachimartSalePrice ?? item.salePrice ?? item.salePriceIncTax ?? item.salePriceExTax),
  },
  { id: "soldAt", render: (item) => item.saleDate ?? "-" },
  { id: "buyer", render: (item) => item.saleDestination ?? item.buyer ?? "-" },
];

const columnSortKeyMap: Partial<Record<InventoryColumnId, InventorySortKey>> = {
  status: "status",
  category: "category",
  maker: "maker",
  model: "model",
  frameColorPanel: "frameColorPanel",
  inspectionNumber: "inspectionNumber",
  frameSerial: "frameSerial",
  boardSerial: "boardSerial",
  removalDate: "removalDate",
  warehouse: "warehouse",
  soldAt: "soldAt",
  buyer: "buyer",
  salePrice: "salePrice",
};

export function InventoryTable({ items, columns, onHeaderReorder, onSortChange, sortKey, sortOrder }: InventoryTableProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [headerOrder, setHeaderOrder] = useState<InventoryColumnId[]>(columns.map((column) => column.id));

  useEffect(() => {
    setHeaderOrder(columns.map((column) => column.id));
  }, [columns]);

  const visibleColumns = useMemo(
    () =>
      headerOrder
        .map((id) => columns.find((column) => column.id === id))
        .filter((column): column is InventoryColumnSetting => Boolean(column)),
    [columns, headerOrder],
  );

  const orderedRenderers = useMemo(
    () =>
      visibleColumns
        .map((column) => columnDefinitions.find((definition) => definition.id === column.id))
        .filter((definition): definition is InventoryColumnDefinition => Boolean(definition)),
    [visibleColumns],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = headerOrder.indexOf(active.id as InventoryColumnId);
    const newIndex = headerOrder.indexOf(over.id as InventoryColumnId);
    const newOrder = arrayMove(headerOrder, oldIndex, newIndex);
    setHeaderOrder(newOrder);
    onHeaderReorder?.(newOrder);
  };

  return (
    <div className="relative max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white text-xs shadow-sm">
      <table className="min-w-[1200px] w-full border-collapse text-[11px] text-slate-800">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={headerOrder}>
            <thead className="sticky top-0 z-10 bg-slate-100 text-left font-semibold text-slate-900">
              <tr>
                {visibleColumns.map((column) => {
                  const sortableKey = columnSortKeyMap[column.id];
                  const isActive = sortableKey && sortKey === sortableKey;
                  const isSortable = Boolean(sortableKey && onSortChange);
                  const widthStyle: React.CSSProperties = column.width ? { width: column.width } : {};

                  return (
                    <SortableHeaderCell key={column.id} column={column}>
                      <div style={widthStyle} className="flex items-center gap-1">
                        {isSortable ? (
                          <button
                            type="button"
                            onClick={() => sortableKey && onSortChange?.(sortableKey)}
                            className="inline-flex items-center gap-1 text-left text-slate-800"
                          >
                            <span>{column.label}</span>
                            {isActive && (
                              <span className="text-[10px] text-slate-500">{sortOrder === "asc" ? "▲" : "▼"}</span>
                            )}
                          </button>
                        ) : (
                          <span>{column.label}</span>
                        )}
                      </div>
                    </SortableHeaderCell>
                  );
                })}
                <th className="w-[140px] whitespace-nowrap px-2 py-1.5 text-center text-[11px] font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
          </SortableContext>
        </DndContext>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="odd:bg-white even:bg-slate-50 border-t border-slate-200 hover:bg-blue-50/30">
              {orderedRenderers.map((column) => {
                const columnSetting = visibleColumns.find((c) => c.id === column.id);
                const widthStyle: React.CSSProperties = columnSetting?.width ? { width: columnSetting.width } : {};

                return (
                  <td
                    key={`${item.id}-${column.id}`}
                    style={widthStyle}
                    className="whitespace-nowrap px-2 py-1 text-[11px] text-slate-800"
                  >
                    {column.render(item)}
                  </td>
                );
              })}
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

function SortableHeaderCell({
  column,
  children,
}: {
  column: InventoryColumnSetting;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="px-2 py-1.5 text-[11px] font-semibold text-slate-600 whitespace-nowrap bg-slate-100"
      {...attributes}
      {...listeners}
    >
      {children}
    </th>
  );
}
