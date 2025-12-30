"use client";

import { useEffect, useMemo, useState } from "react";

import { PachipayInfoCard } from "@/components/pachipay/PachipayInfoCard";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import {
  listLedgerEntries,
  type LedgerEntry,
  type LedgerEntryCategory,
} from "@/lib/balance/ledger";

const CATEGORY_LABELS: Record<LedgerEntryCategory, string> = {
  PURCHASE: "購入",
  SALE: "売却",
  DEPOSIT: "入金",
  WITHDRAWAL: "出金",
};

const CATEGORY_OPTIONS: { key: LedgerEntryCategory; label: string }[] = [
  { key: "PURCHASE", label: "購入" },
  { key: "SALE", label: "売却" },
  { key: "DEPOSIT", label: "入金" },
  { key: "WITHDRAWAL", label: "出金" },
];

type FilterState = {
  startDate: string;
  endDate: string;
  categories: LedgerEntryCategory[];
};

const INITIAL_FILTERS: FilterState = {
  startDate: "",
  endDate: "",
  categories: CATEGORY_OPTIONS.map((option) => option.key),
};

export function HistoryTabContent() {
  const currentUser = useCurrentDevUser();
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [filterInputs, setFilterInputs] = useState<FilterState>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(INITIAL_FILTERS);

  useEffect(() => {
    const syncLedger = () => {
      setLedgerEntries(listLedgerEntries(currentUser.id));
    };

    syncLedger();
    if (typeof window !== "undefined") {
      window.addEventListener("ledger_updated", syncLedger);
      window.addEventListener("storage", syncLedger);
      return () => {
        window.removeEventListener("ledger_updated", syncLedger);
        window.removeEventListener("storage", syncLedger);
      };
    }
    return;
  }, [currentUser.id]);

  const filteredEntries = useMemo(() => applyFilters(ledgerEntries, appliedFilters), [appliedFilters, ledgerEntries]);

  const handleToggleCategory = (category: LedgerEntryCategory) => {
    setFilterInputs((prev) => {
      const hasCategory = prev.categories.includes(category);
      const nextCategories = hasCategory
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: nextCategories };
    });
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filterInputs, categories: [...filterInputs.categories] });
  };

  const handleCsvExport = () => {
    const header = ["処理日時", "区分", "取引先", "メーカー", "物件名", "金額", "残高", "メモ"];
    const rows = filteredEntries.map((entry) => {
      const signedAmount = getSignedAmount(entry);
      return [
        formatDateTime(entry.occurredAt),
        CATEGORY_LABELS[entry.category],
        entry.counterpartyName ?? "-",
        entry.makerName ?? "-",
        entry.itemName ?? "-",
        formatNumber(signedAmount),
        entry.balanceAfterYen !== undefined ? formatNumber(entry.balanceAfterYen) : "-",
        entry.memo ?? "",
      ];
    });

    const csv = [header, ...rows]
      .map((cols) => cols.map(escapeCsvValue).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PachipayInfoCard title="入出金履歴" description="入金・出金の履歴をまとめて表示します。" />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-neutral-600">処理日時</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterInputs.startDate}
                onChange={(e) => setFilterInputs((prev) => ({ ...prev, startDate: e.target.value }))}
                className="rounded border border-slate-300 px-2 py-1 text-sm"
              />
              <span className="text-neutral-500">〜</span>
              <input
                type="date"
                value={filterInputs.endDate}
                onChange={(e) => setFilterInputs((prev) => ({ ...prev, endDate: e.target.value }))}
                className="rounded border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-neutral-600">売買種別</span>
            <div className="flex flex-wrap gap-3">
              {CATEGORY_OPTIONS.map((option) => (
                <label key={option.key} className="inline-flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={filterInputs.categories.includes(option.key)}
                    onChange={() => handleToggleCategory(option.key)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="rounded bg-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800"
            >
              表示
            </button>
            <button
              type="button"
              onClick={handleCsvExport}
              className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-slate-50"
            >
              CSV出力
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-slate-800">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-3 py-2">処理日時</th>
                <th className="px-3 py-2">取引先</th>
                <th className="px-3 py-2">メーカー</th>
                <th className="px-3 py-2">物件名</th>
                <th className="px-3 py-2 text-right">金額</th>
                <th className="px-3 py-2 text-right">残高</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const isNegative = entry.category === "PURCHASE" || entry.category === "WITHDRAWAL";
                const signedAmount = getSignedAmount(entry);
                return (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(entry.occurredAt)}</td>
                    <td className="px-3 py-2">{entry.counterpartyName ?? "-"}</td>
                    <td className="px-3 py-2">{entry.makerName ?? "-"}</td>
                    <td className="px-3 py-2">{entry.itemName ?? "-"}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${isNegative ? "text-rose-600" : "text-emerald-700"}`}>
                      {formatNumber(signedAmount)} 円
                    </td>
                    <td className="px-3 py-2 text-right">{entry.balanceAfterYen !== undefined ? `${formatNumber(entry.balanceAfterYen)} 円` : "-"}</td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-sm text-neutral-600" colSpan={6}>
                    入出金履歴はまだありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function formatNumber(amount: number) {
  return Math.trunc(amount).toLocaleString("ja-JP");
}

function escapeCsvValue(value: string) {
  if (value.includes(",") || value.includes("\"")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function getSignedAmount(entry: LedgerEntry) {
  const sign = entry.category === "PURCHASE" || entry.category === "WITHDRAWAL" ? -1 : 1;
  return sign * entry.amountYen;
}

function applyFilters(entries: LedgerEntry[], filters: FilterState): LedgerEntry[] {
  const startBoundary = filters.startDate ? new Date(`${filters.startDate}T00:00:00`).getTime() : null;
  const endBoundary = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999`).getTime() : null;

  return [...entries]
    .filter((entry) => {
      if (!filters.categories.includes(entry.category)) return false;

      const occurred = new Date(entry.occurredAt).getTime();
      if (!Number.isFinite(occurred)) return false;

      if (startBoundary !== null && occurred < startBoundary) return false;
      if (endBoundary !== null && occurred > endBoundary) return false;

      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.occurredAt).getTime();
      const timeB = new Date(b.occurredAt).getTime();
      if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
      if (Number.isNaN(timeA)) return 1;
      if (Number.isNaN(timeB)) return -1;
      return timeB - timeA;
    });
}
