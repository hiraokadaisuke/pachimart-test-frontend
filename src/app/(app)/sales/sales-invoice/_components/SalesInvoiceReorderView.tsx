"use client";

import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { loadSalesInvoiceGroups } from "@/lib/demo-data/salesInvoiceGroups";
import { loadAllSalesInvoices, upsertSalesInvoices } from "@/lib/demo-data/salesInvoices";
import type { SalesInvoice, SalesInvoiceItem } from "@/types/salesInvoices";

type Props = {
  invoiceId: string;
  invoiceType?: "vendor" | "hall";
  isGroup?: boolean;
};

type Row = SalesInvoiceItem & { id: string; sourceInvoiceId: string };

const formatNumber = (value?: number): string => (value == null || Number.isNaN(value) ? "―" : value.toLocaleString("ja-JP"));

export default function SalesInvoiceReorderView({ invoiceId, invoiceType, isGroup }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const all = loadAllSalesInvoices();
    if (isGroup) {
      const group = loadSalesInvoiceGroups().find((entry) => entry.id === invoiceId);
      if (!group) return setMissing(true);
      const grouped = group.invoiceIds.map((id) => all.find((entry) => entry.invoiceId === id)).filter((entry): entry is SalesInvoice => Boolean(entry));
      const nextRows = grouped.flatMap((invoice) =>
        (invoice.items ?? []).map((item, index) => ({ ...item, id: item.itemId ?? `${invoice.invoiceId}-item-${index + 1}`, sourceInvoiceId: invoice.invoiceId })),
      );
      setRows(nextRows);
      return;
    }

    const invoice = all.find((entry) => entry.invoiceId === invoiceId);
    if (!invoice || (invoiceType && invoice.invoiceType !== invoiceType)) return setMissing(true);
    setRows((invoice.items ?? []).map((item, index) => ({ ...item, id: item.itemId ?? `${invoice.invoiceId}-item-${index + 1}`, sourceInvoiceId: invoice.invoiceId })));
  }, [invoiceId, invoiceType, isGroup]);

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

  const returnPath = isGroup ? `/sales/sales-invoice/group/${invoiceId}` : `/sales/sales-invoice/${invoiceType}/${invoiceId}`;

  const handleSave = () => {
    const all = loadAllSalesInvoices();
    if (isGroup) {
      const groupedMap = new Map<string, Row[]>();
      rows.forEach((row) => {
        const bucket = groupedMap.get(row.sourceInvoiceId) ?? [];
        bucket.push(row);
        groupedMap.set(row.sourceInvoiceId, bucket);
      });
      const updated: SalesInvoice[] = [];
      groupedMap.forEach((bucket, id) => {
        const source = all.find((entry) => entry.invoiceId === id);
        if (!source) return;
        updated.push({
          ...source,
          items: bucket.map((row, index) => ({
            itemId: row.id,
            sortOrder: index,
            inventoryId: row.inventoryId,
            maker: row.maker,
            productName: row.productName,
            type: row.type,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            amount: row.amount,
            remainingDebt: row.remainingDebt,
            applicationPrefecture: row.applicationPrefecture,
            applicationDate: row.applicationDate,
            note: row.note,
            selectedSerialIndexes: row.selectedSerialIndexes,
            selectedSerialRows: row.selectedSerialRows,
          })),
        });
      });
      upsertSalesInvoices(updated);
      router.push(returnPath);
      return;
    }
    const source = all.find((entry) => entry.invoiceId === invoiceId);
    if (!source) return;
    upsertSalesInvoices([{
      ...source,
      items: rows.map((row, index) => ({
        itemId: row.id,
        sortOrder: index,
        inventoryId: row.inventoryId,
        maker: row.maker,
        productName: row.productName,
        type: row.type,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        amount: row.amount,
        remainingDebt: row.remainingDebt,
        applicationPrefecture: row.applicationPrefecture,
        applicationDate: row.applicationDate,
        note: row.note,
        selectedSerialIndexes: row.selectedSerialIndexes,
        selectedSerialRows: row.selectedSerialRows,
      })),
    }]);
    router.push(returnPath);
  };

  const SortableRow = ({ row }: { row: Row }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.id });
    const style = useMemo(() => ({ transform: CSS.Transform.toString(transform), transition }), [transform, transition]);
    return (
      <tr ref={setNodeRef} style={style} className="bg-white text-center">
        <td className="border border-black px-2 py-2"><button type="button" className="cursor-grab text-lg" {...attributes} {...listeners}>≡</button></td>
        <td className="border border-black px-2 py-2 text-left">{row.maker || ""}</td>
        <td className="border border-black px-2 py-2 text-left">{row.productName || ""}</td>
        <td className="border border-black px-2 py-2 text-left">{row.type || ""}</td>
        <td className="border border-black px-2 py-2 text-right">{formatNumber(row.quantity)}</td>
        <td className="border border-black px-2 py-2 text-right">{formatNumber(row.unitPrice)}</td>
        <td className="border border-black px-2 py-2 text-right">{formatNumber(row.amount)}</td>
        <td className="border border-black px-2 py-2 text-right">{formatNumber(row.remainingDebt)}</td>
      </tr>
    );
  };

  if (missing) return <div className="p-10 text-center">対象の販売伝票が見つかりませんでした。</div>;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-5xl rounded border border-slate-300 bg-white p-6">
        <h1 className="mb-4 text-lg font-bold">販売伝票 明細並び替え</h1>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
            <table className="w-full table-fixed border border-black text-[12px]"><thead className="bg-slate-100"><tr><th className="border border-black">操作</th><th className="border border-black">メーカー名</th><th className="border border-black">商品名</th><th className="border border-black">タイプ</th><th className="border border-black">数量</th><th className="border border-black">単価</th><th className="border border-black">金額</th><th className="border border-black">残債</th></tr></thead><tbody>{rows.map((row)=><SortableRow key={row.id} row={row} />)}</tbody></table>
          </SortableContext>
        </DndContext>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={handleSave} className="rounded border border-emerald-500 bg-emerald-600 px-6 py-2 text-white">保存</button>
          <button type="button" onClick={() => router.push(returnPath)} className="rounded border border-slate-400 bg-slate-200 px-6 py-2">キャンセル</button>
        </div>
      </div>
    </div>
  );
}
