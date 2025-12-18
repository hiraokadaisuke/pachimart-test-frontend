"use client";

import { formatYen } from "@/lib/trade/calcTotals";
import { StatementItem } from "@/lib/trade/types";

type ItemsTableProps = {
  items: StatementItem[];
  taxRate?: number;
};

const numberFormat = new Intl.NumberFormat("ja-JP", { minimumFractionDigits: 0 });

export function ItemsTable({ items, taxRate: _taxRate = 0.1 }: ItemsTableProps) {
  const withAmount = items.map((item) => {
    const qty = item.qty ?? 1;
    const unitPrice = item.unitPrice ?? 0;
    const amount = item.amount ?? qty * unitPrice;
    return { ...item, amount };
  });

  return (
    <div className="overflow-x-auto rounded border border-slate-400">
      <table className="min-w-[900px] table-fixed border-collapse text-[12px]">
        <thead>
          <tr className="bg-[#0f1f3c] text-white">
            <th className="w-[120px] px-3 py-2 text-left text-[12px] font-semibold whitespace-nowrap">メーカー</th>
            <th className="w-[360px] px-3 py-2 text-left text-[12px] font-semibold whitespace-nowrap">商品名 / 機種名</th>
            <th className="w-[110px] px-3 py-2 text-left text-[12px] font-semibold whitespace-nowrap">種別</th>
            <th className="w-[80px] px-3 py-2 text-right text-[12px] font-semibold whitespace-nowrap">数量</th>
            <th className="w-[120px] px-3 py-2 text-right text-[12px] font-semibold whitespace-nowrap">単価</th>
            <th className="w-[140px] px-3 py-2 text-right text-[12px] font-semibold whitespace-nowrap">合計</th>
          </tr>
        </thead>
        <tbody>
          {withAmount.map((item) => (
            <tr key={item.lineId} className="border-t border-slate-300 align-top">
              <td className="px-3 py-2 text-neutral-900 whitespace-nowrap">{item.maker ?? "-"}</td>
              <td className="px-3 py-2 text-neutral-900 whitespace-normal">{item.itemName}</td>
              <td className="px-3 py-2 text-neutral-900 whitespace-nowrap">{item.category ?? "-"}</td>
              <td className="px-3 py-2 text-right text-neutral-900 whitespace-nowrap">
                {item.qty != null ? numberFormat.format(item.qty) : "-"}
              </td>
              <td className="px-3 py-2 text-right text-neutral-900 whitespace-nowrap">{formatYen(item.unitPrice ?? 0)}</td>
              <td className="px-3 py-2 text-right text-neutral-900 whitespace-nowrap">{formatYen(item.amount ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-slate-400 bg-slate-50 px-3 py-2 text-[12px] text-neutral-800">
        <p className="font-semibold text-neutral-900">備考 / 行メモ</p>
        <ul className="list-disc space-y-1 pl-5">
          {items
            .filter((item) => item.note)
            .map((item) => (
              <li key={`${item.lineId}-note`}>{item.note}</li>
            ))}
          {items.every((item) => !item.note) && <li className="text-neutral-500">特記事項なし</li>}
        </ul>
      </div>
    </div>
  );
}
