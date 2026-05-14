"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { formatCurrency, formatDate, loadInventoryRecords } from "@/lib/demo-data/demoInventory";
import { loadSalesInvoices } from "@/lib/demo-data/salesInvoices";
import { buildSalesInvoiceUnitCandidates } from "@/lib/inventory/salesInvoiceUnitCandidates";
import type { InventoryRecord } from "@/lib/demo-data/demoInventory";

const labelCellClass = "bg-slate-100 text-center font-semibold text-slate-800";
const borderCell = "border border-gray-300";
const inputCellStyles =
  "w-full rounded-none border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400";

const getSaleDate = (record: InventoryRecord): string | undefined => {
  return record.removeDate ?? record.removalDate ?? record.createdAt;
};

const SALES_INVOICE_CREATE_SELECTED_IDS_KEY = "sales_invoice_create_selected_ids";

const parseIdList = (value: string | null) =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

function SalesInvoiceCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [invoicedInventoryIds, setInvoicedInventoryIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    id: "",
    maker: "",
    model: "",
    salesStaff: "",
    customer: "",
    displayCount: "50",
    saleDate: "",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [onlyWithUnit, setOnlyWithUnit] = useState(false);
  const [prefillIds, setPrefillIds] = useState<string[]>([]);

  const queryPrefillIds = useMemo(
    () => parseIdList(searchParams?.get("ids") ?? null),
    [searchParams],
  );

  useEffect(() => {
    setRecords(loadInventoryRecords());
  }, []);

  useEffect(() => {
    if (queryPrefillIds.length > 0) {
      setPrefillIds(queryPrefillIds);
      return;
    }
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(SALES_INVOICE_CREATE_SELECTED_IDS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setPrefillIds(parsed.filter((id) => typeof id === "string"));
      }
    } catch (error) {
      console.error("販売伝票作成の選択在庫読み込みに失敗しました", error);
    } finally {
      window.localStorage.removeItem(SALES_INVOICE_CREATE_SELECTED_IDS_KEY);
    }
  }, [queryPrefillIds]);

  useEffect(() => {
    const invoices = loadSalesInvoices();
    const ids = new Set<string>(
      invoices.flatMap((invoice) => {
        const directIds = invoice.inventoryIds ?? [];
        const itemIds = (invoice.items ?? [])
          .map((item) => item.inventoryId)
          .filter((id): id is string => Boolean(id));
        return [...directIds, ...itemIds];
      }),
    );
    setInvoicedInventoryIds(ids);
  }, []);

  useEffect(() => {
    if (prefillIds.length > 0) {
      setSelectedIds(new Set(prefillIds));
    }
  }, [prefillIds]);

  const soldRecords = useMemo(
    () =>
      records
        .filter((record) => (record.status ?? record.stockStatus) === "売却済")
        .filter((record) => !invoicedInventoryIds.has(record.id)),
    [records, invoicedInventoryIds],
  );

  const prefillIdSet = useMemo(() => new Set(prefillIds), [prefillIds]);

  const baseRecords = useMemo(() => {
    if (prefillIds.length > 0) {
      return records.filter((record) => prefillIdSet.has(record.id));
    }
    return soldRecords;
  }, [prefillIds.length, prefillIdSet, records, soldRecords]);

  const unitCandidates = useMemo(() => buildSalesInvoiceUnitCandidates(records), [records]);

  const filteredRecords = useMemo(() => {
    const unitIdSet = new Set(unitCandidates.map((candidate) => candidate.inventoryItemId));
    const limited = baseRecords
      .filter((record) => record.id.toLowerCase().includes(filters.id.toLowerCase()))
      .filter((record) => (record.maker ?? "").toLowerCase().includes(filters.maker.toLowerCase()))
      .filter((record) => (record.model ?? record.machineName ?? "").toLowerCase().includes(filters.model.toLowerCase()))
      .filter((record) => (record.buyerStaff ?? record.staff ?? "").toLowerCase().includes(filters.salesStaff.toLowerCase()))
      .filter((record) => (record.supplier ?? record.supplierCorporate ?? "").toLowerCase().includes(filters.customer.toLowerCase()))
      .filter((record) => (!onlyWithUnit ? true : unitIdSet.has(record.id)))
      .filter((record) => {
        if (!filters.saleDate) return true;
        const saleDate = getSaleDate(record);
        if (!saleDate) return false;
        const formatted = new Date(saleDate).toISOString().slice(0, 10);
        return formatted === filters.saleDate;
      });

    const limit = prefillIds.length > 0 ? limited.length : Number(filters.displayCount) || limited.length;
    return limited.slice(0, limit);
  }, [baseRecords, filters, onlyWithUnit, prefillIds.length, unitCandidates]);
  const fallbackRecords = useMemo<InventoryRecord[]>(
    () =>
      filteredRecords.length > 0
        ? []
        : [
            {
              id: "INV-DEMO-PACHI-001",
              maker: "SANKYO",
              model: "フィーバーX",
              kind: "P",
              type: "既存",
              quantity: 1,
              saleUnitPrice: 138000,
              supplier: "パチマート経由 株式会社デモ商事",
              buyerStaff: "木村",
              status: "売却済",
              note: "パチマート成約デモ案件",
              createdAt: new Date().toISOString(),
            },
          ],
    [filteredRecords.length],
  );
  const displayRecords = filteredRecords.length > 0 ? filteredRecords : fallbackRecords;

  const handleInputChange = (
    key: keyof typeof filters,
    value: string,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      id: "",
      maker: "",
      model: "",
      salesStaff: "",
      customer: "",
      displayCount: "50",
      saleDate: "",
    });
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const navigateToVendorInvoice = () => {
    if (selectedIds.size === 0) {
      alert("販売伝票対象の在庫を選択してください");
      return;
    }
    const query = Array.from(selectedIds).join(",");
    router.push(`/sales/sales-invoice/vendor/create?ids=${encodeURIComponent(query)}`);
  };

  const navigateToHallInvoice = () => {
    if (selectedIds.size === 0) {
      alert("販売伝票対象の在庫を選択してください");
      return;
    }
    const query = Array.from(selectedIds).join(",");
    router.push(`/sales/sales-invoice/hall/create?ids=${encodeURIComponent(query)}`);
  };

  return (
    <div className="space-y-6 mx-[1cm]">
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-slate-600 px-3 py-2 text-white">
          <span className="h-3.5 w-3.5 rounded-full bg-white" aria-hidden />
          <h1 className="text-xl font-bold text-white">販売伝票作成</h1>
        </div>
        <div className="border-b border-dashed border-gray-300" />
      </div>

      <div className="overflow-hidden border border-gray-300 bg-white">
        <div className="bg-slate-600 px-4 py-2 text-sm font-bold text-white">検索条件</div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse text-sm text-neutral-800">
            <tbody>
              <tr className="divide-x divide-gray-300">
                <th className={`${labelCellClass} ${borderCell} w-32 px-3 py-2`}>ID</th>
                <td className={`${borderCell} px-3 py-2`}>
                  <input
                    type="text"
                    value={filters.id}
                    onChange={(e) => handleInputChange("id", e.target.value)}
                    className={inputCellStyles}
                    placeholder="在庫ID"
                  />
                </td>
                <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>メーカー</th>
                <td className={`${borderCell} px-3 py-2`}>
                  <input
                    type="text"
                    value={filters.maker}
                    onChange={(e) => handleInputChange("maker", e.target.value)}
                    className={inputCellStyles}
                    placeholder="メーカー名"
                  />
                </td>
                <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>機種名</th>
                <td className={`${borderCell} px-3 py-2`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={filters.model}
                      onChange={(e) => handleInputChange("model", e.target.value)}
                      className={inputCellStyles}
                      placeholder="機種名"
                    />
                    <span className="rounded-none border border-gray-300 bg-white px-2 py-1 text-xs text-slate-700">🔍</span>
                  </div>
                </td>
                <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>販売担当</th>
                <td className={`${borderCell} px-3 py-2`}>
                  <input
                    type="text"
                    value={filters.salesStaff}
                    onChange={(e) => handleInputChange("salesStaff", e.target.value)}
                    className={inputCellStyles}
                    placeholder="担当者"
                  />
                </td>
              </tr>
              <tr className="divide-x divide-gray-300">
                <th className={`${labelCellClass} ${borderCell} w-32 px-3 py-2`}>販売先</th>
                <td className={`${borderCell} px-3 py-2`}>
                  <input
                    type="text"
                    value={filters.customer}
                    onChange={(e) => handleInputChange("customer", e.target.value)}
                    className={inputCellStyles}
                    placeholder="販売先"
                  />
                </td>
                <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>Unit連携</th>
                <td className={`${borderCell} px-3 py-2`}><label className="inline-flex items-center gap-2"><input type="checkbox" checked={onlyWithUnit} onChange={(e)=>setOnlyWithUnit(e.target.checked)} />Unitありのみ</label></td>
                <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>表示数</th>
                <td className={`${borderCell} px-3 py-2`}>
                  <select
                    value={filters.displayCount}
                    onChange={(e) => handleInputChange("displayCount", e.target.value)}
                    className={inputCellStyles}
                  >
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                  </select>
                </td>
                <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>販売入力日</th>
                <td className={`${borderCell} px-3 py-2`}>
                  <input
                    type="date"
                    value={filters.saleDate}
                    onChange={(e) => handleInputChange("saleDate", e.target.value)}
                    className={inputCellStyles}
                  />
                </td>
                <th className={`${labelCellClass} ${borderCell} w-28 px-3 py-2`}>操作</th>
                <td className={`${borderCell} px-3 py-2`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="min-w-[96px] rounded-none border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] hover:bg-slate-100"
                    >
                      検索
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="min-w-[96px] rounded-none border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] hover:bg-slate-100"
                    >
                      リセット
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border border-gray-300 bg-slate-600 px-3 py-2 text-sm font-bold text-white">
            <span className="h-4 w-1 bg-white" aria-hidden />
            <span>販売物件リスト</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={navigateToVendorInvoice}
              className="inline-flex items-center rounded-none border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] hover:bg-slate-100"
            >
              業者伝票登録
            </button>
            <button
              type="button"
              onClick={navigateToHallInvoice}
              className="inline-flex items-center rounded-none border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] hover:bg-slate-100"
            >
              ホール伝票登録
            </button>
          </div>
        </div>
        <div className="overflow-x-auto border border-gray-300">
          <table className="min-w-full border-collapse text-xs text-slate-900">
            <thead>
              <tr className="bg-slate-600 text-center text-white font-bold">
                <th className="border border-gray-300 px-2 py-2">選択</th>
                <th className="border border-gray-300 px-2 py-2">在庫ID ▲▼</th>
                <th className="border border-gray-300 px-2 py-2">販売入力日 ▲▼</th>
                <th className="border border-gray-300 px-2 py-2">メーカー ▲▼</th>
                <th className="border border-gray-300 px-2 py-2">機種名 ▲▼</th>
                <th className="border border-gray-300 px-2 py-2">区分</th>
                <th className="border border-gray-300 px-2 py-2">タイプ</th>
                <th className="border border-gray-300 px-2 py-2">仕入数</th>
                <th className="border border-gray-300 px-2 py-2">販売単価</th>
                <th className="border border-gray-300 px-2 py-2">販売先</th>
                <th className="border border-gray-300 px-2 py-2">販売担当</th>
                <th className="border border-gray-300 px-2 py-2">備考</th>
              </tr>
            </thead>
            <tbody>
              {displayRecords.length === 0 && (
                <tr>
                  <td colSpan={12} className="border border-gray-300 px-4 py-6 text-center text-sm text-slate-700">
                    該当データがありません
                  </td>
                </tr>
              )}
              {displayRecords.map((record, index) => {
                const rowColor = index % 2 === 0 ? "bg-amber-50" : "bg-white";
                const saleDate = getSaleDate(record);
                const buyer = record.supplier ?? record.supplierCorporate ?? "-";
                const staff = record.buyerStaff ?? record.staff ?? "-";
                return (
                  <tr key={record.id} className={`${rowColor} text-center`}>
                    <td className="border border-gray-300 px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onChange={(e) => toggleSelect(record.id, e.target.checked)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-2 font-semibold text-slate-900">{record.id}</td>
                    <td className="border border-gray-300 px-2 py-2">{formatDate(saleDate)}</td>
                    <td className="border border-gray-300 px-2 py-2 text-left">{record.maker ?? "-"}</td>
                    <td className="border border-gray-300 px-2 py-2 text-left">
                      {record.model ?? record.machineName ?? "-"}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">{record.kind ?? "-"}</td>
                    <td className="border border-gray-300 px-2 py-2">{record.type ?? record.deviceType ?? "-"}</td>
                    <td className="border border-gray-300 px-2 py-2">{record.quantity ?? "-"}</td>
                    <td className="border border-gray-300 px-2 py-2 text-right">{formatCurrency(record.saleUnitPrice)}</td>
                    <td className="border border-gray-300 px-2 py-2 text-left">{buyer}</td>
                    <td className="border border-gray-300 px-2 py-2 text-left">{staff}</td>
                    <td className="border border-gray-300 px-2 py-2 text-left">{record.note ?? record.notes ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function SalesInvoiceCreatePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-neutral-600">読み込み中...</div>}>
      <SalesInvoiceCreateContent />
    </Suspense>
  );
}
