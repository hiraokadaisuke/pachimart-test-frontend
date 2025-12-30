"use client";

import type { ChangeEvent } from "react";

import type { AdditionalCostItem } from "@/types/purchaseInvoices";

const COST_OPTIONS: AdditionalCostItem["label"][] = ["手数料", "保険料", "その他", "書類代"];

const buildId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `extra-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type Props = {
  value: AdditionalCostItem[];
  onChange: (next: AdditionalCostItem[]) => void;
  title?: string;
  note?: string;
};

export default function ExtraCostEditor({ value, onChange, title = "別費用", note }: Props) {
  const handleAdd = () => {
    onChange([
      ...value,
      {
        id: buildId(),
        label: "手数料",
        amount: 0,
      },
    ]);
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  const handleLabelChange = (id: string, nextLabel: AdditionalCostItem["label"]) => {
    onChange(value.map((item) => (item.id === id ? { ...item, label: nextLabel } : item)));
  };

  const handleAmountChange = (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const nextAmount = Number(event.target.value) || 0;
    onChange(value.map((item) => (item.id === id ? { ...item, amount: nextAmount } : item)));
  };

  return (
    <div className="border-2 border-black bg-white">
      <div className="flex items-center justify-between border-b border-black bg-slate-700 px-3 py-2 text-xs font-bold text-white">
        <span>{title}</span>
        <button
          type="button"
          onClick={handleAdd}
          className="border border-white bg-white px-3 py-1 text-xs font-semibold text-slate-900"
        >
          ＋追加
        </button>
      </div>
      <div className="p-3 text-[12px] text-neutral-900">
        {note && <div className="mb-2 text-[11px] text-neutral-600">{note}</div>}
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-slate-100 text-left font-semibold text-neutral-800">
            <tr>
              <th className="border border-black px-2 py-1">別費用</th>
              <th className="border border-black px-2 py-1 text-right">金額</th>
              <th className="border border-black px-2 py-1 text-center">削除</th>
            </tr>
          </thead>
          <tbody>
            {value.length === 0 ? (
              <tr>
                <td colSpan={3} className="border border-black px-2 py-4 text-center text-[11px] text-neutral-500">
                  追加費用は未登録です。
                </td>
              </tr>
            ) : (
              value.map((item) => (
                <tr key={item.id}>
                  <td className="border border-black px-2 py-1">
                    <select
                      value={item.label}
                      onChange={(event) =>
                        handleLabelChange(item.id, event.target.value as AdditionalCostItem["label"])
                      }
                      className="w-full border border-black bg-amber-50 px-2 py-1 text-[12px] focus:outline-none"
                    >
                      {COST_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-black px-2 py-1 text-right">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(event) => handleAmountChange(item.id, event)}
                      className="w-full border border-black bg-amber-50 px-2 py-1 text-right text-[12px] focus:outline-none"
                    />
                  </td>
                  <td className="border border-black px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="border border-black bg-white px-2 py-0.5 text-[11px] font-semibold"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
