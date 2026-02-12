"use client";

import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { loadPurchaseInvoices, upsertPurchaseInvoice } from "@/lib/demo-data/purchaseInvoices";
import type { PurchaseInvoiceItem } from "@/types/purchaseInvoices";

type Props = {
  invoiceId: string;
  expectedType: "vendor" | "hall";
};

type Row = PurchaseInvoiceItem & { id: string };

const formatNumber = (value?: number): string => (value == null || Number.isNaN(value) ? "―" : value.toLocaleString("ja-JP"));

export default function PurchaseInvoiceReorderView({ invoiceId, expectedType }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const invoice = loadPurchaseInvoices().find((entry) => entry.invoiceId === invoiceId);
    if (!invoice || invoice.invoiceType !== expectedType) {
      setMissing(true);
      return;
    }
    const nextRows = (invoice.items ?? []).map((item, index) => ({ ...item, id: item.itemId ?? `${invoice.invoiceId}-item-${index + 1}` }));
    setRows(nextRows);
  }, [invoiceId, expectedType]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setRows((prev) => {
      const oldIndex = prev.findIndex((row) => row.id === active.id);
      const newIndex = prev.findIndex((row) => row.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSave = () => {
    const invoices = loadPurchaseInvoices();
    const invoice = invoices.find((entry) => entry.invoiceId === invoiceId);
    if (!invoice) return;
    const reordered = rows.map((row, index) => ({ ...row, itemId: row.id, sortOrder: index }));
    upsertPurchaseInvoice({
      ...invoice,
      items: reordered,
      inventoryIds: reordered.map((item) => item.inventoryId),
    });
    router.push(`/sales/purchase-invoice/${expectedType}/${invoiceId}`);
  };

  const SortableRow = ({ row }: { row: Row }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.id });
    const style = useMemo(() => ({ transform: CSS.Transform.toString(transform), transition }), [transform, transition]);
    return (
      <tr ref={setNodeRef} style={style} className="bg-white text-center">
        <td className="border border-black px-2 py-2">
          <button type="button" className="cursor-grab text-lg leading-none" {...attributes} {...listeners} aria-label="並び替え">
            ≡
          </button>
        </td>
        <td className="border border-black px-2 py-2 text-left">{row.storeName || "―"}</td>
        <td className="border border-black px-2 py-2 text-left">{row.maker || ""}</td>
        <td className="border border-black px-2 py-2 text-left">{row.machineName || ""}</td>
        <td className="border border-black px-2 py-2 text-left">{row.type || ""}</td>
        <td className="border border-black px-2 py-2 text-right">{formatNumber(row.quantity)}</td>
        <td className="border border-black px-2 py-2 text-right">{formatNumber(row.unitPrice)}</td>
        <td className="border border-black px-2 py-2 text-right">{formatNumber(row.amount)}</td>
        <td className="border border-black px-2 py-2 text-right">{formatNumber(row.remainingDebt)}</td>
      </tr>
    );
  };

  if (missing) return <div className="p-10 text-center">対象の購入伝票が見つかりませんでした。</div>;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-5xl rounded border border-slate-300 bg-white p-6">
        <h1 className="mb-4 text-lg font-bold">購入伝票 明細並び替え</h1>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
            <table className="w-full table-fixed border border-black text-[12px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-black">操作</th><th className="border border-black">店舗名</th><th className="border border-black">メーカー名</th><th className="border border-black">商品名</th><th className="border border-black">タイプ</th><th className="border border-black">数量</th><th className="border border-black">単価</th><th className="border border-black">金額</th><th className="border border-black">残債</th>
                </tr>
              </thead>
              <tbody>{rows.map((row) => <SortableRow key={row.id} row={row} />)}</tbody>
            </table>
          </SortableContext>
        </DndContext>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={handleSave} className="rounded border border-emerald-500 bg-emerald-600 px-6 py-2 text-white">保存</button>
          <button type="button" onClick={() => router.push(`/sales/purchase-invoice/${expectedType}/${invoiceId}`)} className="rounded border border-slate-400 bg-slate-200 px-6 py-2">キャンセル</button>
        </div>
      </div>
    </div>
  );
}
