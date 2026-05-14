"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  deleteSalesInvoices,
  loadAllSalesInvoices,
  loadSalesInvoices,
  saveSalesInvoices,
} from "@/lib/demo-data/salesInvoices";
import { loadInventoryRecords } from "@/lib/demo-data/demoInventory";
import {
  addSalesInvoiceGroup,
  generateSalesInvoiceGroupId,
  loadSalesInvoiceGroups,
  saveSalesInvoiceGroups,
} from "@/lib/demo-data/salesInvoiceGroups";
import type { SalesInvoice, SalesInvoiceGroup } from "@/types/salesInvoices";
import { formatShortId } from "@/lib/inventory/idDisplay";
import type { InventoryRecord } from "@/lib/demo-data/demoInventory";

interface SalesInvoiceRow {
  id: string;
  rowType: "invoice" | "group";
  issueDate: string;
  maker: string;
  modelDisplay: string;
  modelSearch: string;
  modelTooltip?: string;
  warehouseDisplay: string;
  warehouseTooltip?: string;
  customer: string;
  staff: string;
  totalAmount: number;
  invoiceType: "vendor" | "hall" | "mixed";
  transferDate?: string;
  sourceType: "PACHIMART" | "MANUAL" | "INVENTORY";
  statusLabel: string;
  outboundStatus: string;
}

interface SalesInvoiceFilters {
  id: string;
  maker: string;
  model: string;
  issueDateFrom: string;
  issueDateTo: string;
  staff: string;
  customer: string;
  displayCount: string;
}

const inputCell =
  "w-full rounded-none border border-gray-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-600";

const toDateKey = (value?: string) => {
  if (!value) return "";
  const normalized = value.includes("T") ? value.slice(0, 10) : value;
  return normalized.replaceAll("/", "-");
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  return value.replaceAll("-", "/");
};

const formatCurrency = (value: number) => value.toLocaleString("ja-JP");

const toInputDate = (value: Date) => {
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
};

const createInitialFilters = (): SalesInvoiceFilters => {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return {
    id: "",
    maker: "",
    model: "",
    issueDateFrom: toInputDate(monthAgo),
    issueDateTo: toInputDate(today),
    staff: "",
    customer: "",
    displayCount: "50",
  };
};

const resolveInvoiceSubtotal = (invoice: SalesInvoice): number => {
  if (invoice.subtotal != null) return invoice.subtotal;
  return (invoice.items ?? []).reduce((sum, item) => {
    const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);
};

const resolveInvoiceTax = (invoice: SalesInvoice): number => {
  if (invoice.tax != null) return invoice.tax;
  const subtotal = resolveInvoiceSubtotal(invoice);
  const rate = invoice.invoiceType === "hall" ? 0.05 : 0.1;
  return Math.floor(subtotal * rate);
};

const resolveInvoiceTotal = (invoice: SalesInvoice): number => {
  if (invoice.totalAmount != null) return invoice.totalAmount;
  const subtotal = resolveInvoiceSubtotal(invoice);
  const tax = resolveInvoiceTax(invoice);
  const insurance = Number(invoice.insurance || 0);
  return subtotal + tax + insurance;
};

const buildModelSummary = (items: SalesInvoice["items"]) => {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const name = (item.productName ?? "").trim();
    if (!name) return;
    const quantity = Number(item.quantity) || 1;
    counts.set(name, (counts.get(name) ?? 0) + quantity);
  });
  const entries = Array.from(counts.entries());
  if (entries.length === 0) {
    return { display: "-", search: "", tooltip: undefined };
  }
  const [firstName] = entries[0];
  const tooltip = entries
    .map(([name, quantity]) => (quantity > 1 ? `${name} ×${quantity}` : name))
    .join("\n");
  const display = entries.length > 1 ? `${firstName} + 他` : firstName;
  const search = entries.map(([name]) => name).join(" ");
  return { display, search, tooltip };
};

const buildWarehouseSummary = (inventoryIds: string[], inventoryMap: Map<string, InventoryRecord>) => {
  const names = inventoryIds
    .map((id) => inventoryMap.get(id))
    .map((inventory) => (inventory?.warehouse ?? inventory?.storageLocation ?? "").trim())
    .filter((name) => name !== "");
  if (names.length === 0) {
    return { display: "-", tooltip: undefined };
  }
  const uniqueNames = Array.from(new Set(names));
  const display = uniqueNames.length > 1 ? `${uniqueNames[0]} + 他` : uniqueNames[0];
  const tooltip = uniqueNames.join("\n");
  return { display, tooltip };
};

const resolveSalesToKey = (invoice: SalesInvoice) => {
  const salesToId = invoice.salesToId?.trim();
  const name = (invoice.vendorName || invoice.buyerName || "").trim();
  return salesToId ? `id:${salesToId}` : name ? `name:${name}` : "";
};

const resolveCommonValue = (values: Array<string | undefined>) => {
  const filtered = values.filter((value) => value && value.trim() !== "");
  if (filtered.length === 0) return "";
  const [first] = filtered;
  if (filtered.every((value) => value === first)) return first;
  return "";
};

export default function SalesInvoiceListPage() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [groups, setGroups] = useState<SalesInvoiceGroup[]>([]);
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);
  const [formValues, setFormValues] = useState<SalesInvoiceFilters>(() => createInitialFilters());
  const [appliedFilters, setAppliedFilters] = useState<SalesInvoiceFilters>(() => createInitialFilters());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setInvoices(loadAllSalesInvoices());
    setGroups(loadSalesInvoiceGroups());
    setInventories(loadInventoryRecords());
  }, []);

  const mergedInvoiceIds = useMemo(() => {
    const ids = new Set<string>();
    groups.forEach((group) => {
      group.invoiceIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [groups]);

  const inventoryMap = useMemo(
    () => new Map(inventories.map((inventory) => [inventory.id, inventory])),
    [inventories],
  );

  const invoiceRows = useMemo<SalesInvoiceRow[]>(() => {
    return invoices
      .filter((invoice) => !mergedInvoiceIds.has(invoice.invoiceId))
      .map((invoice) => {
        const modelSummary = buildModelSummary(invoice.items ?? []);
        const inventoryIds = Array.from(
          new Set([
            ...(invoice.inventoryIds ?? []),
            ...(invoice.items ?? [])
              .map((item) => item.inventoryId)
              .filter((id): id is string => Boolean(id)),
          ]),
        );
        const warehouseSummary = buildWarehouseSummary(inventoryIds, inventoryMap);
        return {
          id: invoice.invoiceId,
          rowType: "invoice",
          issueDate: toDateKey(invoice.issuedDate || invoice.createdAt),
          maker: invoice.items?.[0]?.maker ?? "",
          modelDisplay: modelSummary.display,
          modelSearch: modelSummary.search,
          modelTooltip: modelSummary.tooltip,
          warehouseDisplay: warehouseSummary.display,
          warehouseTooltip: warehouseSummary.tooltip,
          customer: (invoice.vendorName || invoice.buyerName || "").trim(),
          staff: invoice.staff ?? "",
          totalAmount: resolveInvoiceTotal(invoice),
          invoiceType: invoice.invoiceType,
          transferDate: invoice.transferDate,
          sourceType: (invoice.remarks ?? "").includes("パチマート") ? "PACHIMART" : "INVENTORY",
          statusLabel: invoice.isReceived ? "入金済" : invoice.transferDate ? "請求済" : "販売入力済",
          outboundStatus: invoice.paymentDate ? "出庫完了" : "出庫待ち",
        };
      });
  }, [invoices, inventoryMap, mergedInvoiceIds]);

  const groupRows = useMemo(() => {
    const invoiceMap = new Map(invoices.map((invoice) => [invoice.invoiceId, invoice]));
    return groups.reduce<SalesInvoiceRow[]>((acc, group) => {
      const groupedInvoices = group.invoiceIds
        .map((id) => invoiceMap.get(id))
        .filter((entry): entry is SalesInvoice => Boolean(entry));
      if (groupedInvoices.length === 0) return acc;
      const items = groupedInvoices.flatMap((entry) => entry.items ?? []);
      const modelSummary = buildModelSummary(items);
      const invoiceTypes = Array.from(new Set(groupedInvoices.map((entry) => entry.invoiceType)));
      const issueDateCandidates = groupedInvoices
        .map((entry) => toDateKey(entry.issuedDate || entry.createdAt))
        .filter(Boolean)
        .sort();
      const issueDate = issueDateCandidates[0] ?? "";
      const staff = resolveCommonValue(groupedInvoices.map((entry) => entry.staff)) || "-";
      const maker = items[0]?.maker ?? "";
      const totalAmount = groupedInvoices.reduce((sum, entry) => sum + resolveInvoiceTotal(entry), 0);
      const transferDate =
        group.transferDate || resolveCommonValue(groupedInvoices.map((entry) => entry.transferDate)) || "";
      const inventoryIds = Array.from(
        new Set(
          groupedInvoices.flatMap((entry) => [
            ...(entry.inventoryIds ?? []),
            ...(entry.items ?? [])
              .map((item) => item.inventoryId)
              .filter((id): id is string => Boolean(id)),
          ]),
        ),
      );
      const warehouseSummary = buildWarehouseSummary(inventoryIds, inventoryMap);

      acc.push({
        id: group.id,
        rowType: "group",
        issueDate,
        maker,
        modelDisplay: modelSummary.display,
        modelSearch: modelSummary.search,
        modelTooltip: modelSummary.tooltip,
        warehouseDisplay: warehouseSummary.display,
        warehouseTooltip: warehouseSummary.tooltip,
        customer: group.salesToName,
        staff,
        totalAmount,
        invoiceType: invoiceTypes.length === 1 ? invoiceTypes[0] : "mixed",
        transferDate,
        sourceType: groupedInvoices.some((entry) => (entry.remarks ?? "").includes("パチマート")) ? "PACHIMART" : "INVENTORY",
        statusLabel: groupedInvoices.every((entry) => entry.isReceived) ? "入金済" : "請求済",
        outboundStatus: groupedInvoices.some((entry) => entry.paymentDate) ? "出庫完了" : "出庫待ち",
      });
      return acc;
    }, []);
  }, [groups, inventoryMap, invoices]);

  const rows = useMemo(() => [...groupRows, ...invoiceRows], [groupRows, invoiceRows]);

  const groupInvoiceIdMap = useMemo(() => new Map(groups.map((group) => [group.id, group.invoiceIds])), [groups]);

  const resolveRowInvoiceIds = (rowId: string) => {
    if (groupInvoiceIdMap.has(rowId)) return groupInvoiceIdMap.get(rowId) ?? [];
    return [rowId];
  };

  const resolveSelectedInvoiceIds = (selected: Set<string>) =>
    Array.from(new Set(Array.from(selected).flatMap((rowId) => resolveRowInvoiceIds(rowId))));

  const filteredInvoices = useMemo(() => {
    const filtered = rows
      .filter((invoice) => invoice.id.toLowerCase().includes(appliedFilters.id.toLowerCase()))
      .filter((invoice) => invoice.maker.toLowerCase().includes(appliedFilters.maker.toLowerCase()))
      .filter((invoice) => invoice.modelSearch.toLowerCase().includes(appliedFilters.model.toLowerCase()))
      .filter((invoice) => invoice.customer.toLowerCase().includes(appliedFilters.customer.toLowerCase()))
      .filter((invoice) => invoice.staff.toLowerCase().includes(appliedFilters.staff.toLowerCase()))
      .filter((invoice) => {
        if (!appliedFilters.issueDateFrom) return true;
        return invoice.issueDate >= appliedFilters.issueDateFrom;
      })
      .filter((invoice) => {
        if (!appliedFilters.issueDateTo) return true;
        return invoice.issueDate <= appliedFilters.issueDateTo;
      });

    filtered.sort((left, right) => {
      const issueDateCompare = right.issueDate.localeCompare(left.issueDate);
      if (issueDateCompare !== 0) return issueDateCompare;
      return right.id.localeCompare(left.id);
    });

    const limit = Number(appliedFilters.displayCount) || filtered.length;
    return filtered.slice(0, limit);
  }, [appliedFilters, rows]);

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

  const handleSelectPage = () => {
    setSelectedIds(new Set(filteredInvoices.map((row) => row.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    const targetInvoiceIds = new Set(resolveSelectedInvoiceIds(selectedIds));
    deleteSalesInvoices(Array.from(targetInvoiceIds));
    setInvoices((prev) => prev.filter((invoice) => !targetInvoiceIds.has(invoice.invoiceId)));

    const selectedGroupIds = new Set(Array.from(selectedIds).filter((id) => groupInvoiceIdMap.has(id)));
    if (selectedGroupIds.size > 0) {
      const remainingGroups = groups.filter((group) => !selectedGroupIds.has(group.id));
      saveSalesInvoiceGroups(remainingGroups);
      setGroups(remainingGroups);
    }

    setSelectedIds(new Set());
  };

  const handleMerge = () => {
    if (selectedIds.size < 2) return;
    const selectedInvoiceIds = new Set(resolveSelectedInvoiceIds(selectedIds));
    const selectedInvoices = invoices.filter((invoice) => selectedInvoiceIds.has(invoice.invoiceId));
    if (selectedInvoices.length < 2) return;
    const salesToKey = resolveSalesToKey(selectedInvoices[0]);
    if (!salesToKey || selectedInvoices.some((invoice) => resolveSalesToKey(invoice) !== salesToKey)) {
      alert("販売先が同一の伝票のみ結合できます");
      return;
    }

    const salesToName = (selectedInvoices[0].vendorName || selectedInvoices[0].buyerName || "").trim();
    const transferDate = resolveCommonValue(selectedInvoices.map((invoice) => invoice.transferDate)) || undefined;
    const groupId = generateSalesInvoiceGroupId();
    const now = new Date().toISOString();
    const group: SalesInvoiceGroup = {
      id: groupId,
      salesToId: selectedInvoices[0].salesToId,
      salesToName,
      invoiceIds: selectedInvoices.map((invoice) => invoice.invoiceId),
      transferDate,
      createdAt: now,
      updatedAt: now,
    };

    const updatedGroups = addSalesInvoiceGroup(group);
    const storedInvoices = loadSalesInvoices();
    if (storedInvoices.length > 0) {
      const updatedStored = storedInvoices.map((invoice) =>
        selectedInvoiceIds.has(invoice.invoiceId) ? { ...invoice, mergedGroupId: groupId } : invoice,
      );
      saveSalesInvoices(updatedStored);
    }

    setGroups(updatedGroups);
    setInvoices(loadAllSalesInvoices());
    setSelectedIds(new Set());
  };

  const handleSearch = () => {
    setAppliedFilters(formValues);
  };

  const handleReset = () => {
    const resetValues = {
      id: "",
      maker: "",
      model: "",
      issueDateFrom: "",
      issueDateTo: "",
      staff: "",
      customer: "",
      displayCount: "50",
    };
    setFormValues(resetValues);
    setAppliedFilters(resetValues);
    setSelectedIds(new Set());
  };

  const searchRowClass = "border border-gray-300";
  const headerCellClass = "border border-gray-300 px-3 py-2 text-sm";

  return (
    <div className="space-y-5 py-3 text-slate-900 mx-[1cm]">
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-slate-600 px-3 py-2 text-white">
          <span className="h-3.5 w-3.5 rounded-full bg-white" aria-hidden />
          <h1 className="text-xl font-bold text-white">販売伝票一覧</h1>
        </div>
        <div className="border-b border-dashed border-gray-300" />
      </div>

      <div className="overflow-hidden border border-gray-300 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-600 text-white font-bold">
              <th className={`${headerCellClass} w-32`}>ID</th>
              <th className={`${headerCellClass} w-64`}>メーカー</th>
              <th className={`${headerCellClass} w-64`}>機種名</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-amber-50">
              <td className={searchRowClass}>
                <input
                  type="text"
                  value={formValues.id}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                  className={inputCell}
                />
              </td>
              <td className={searchRowClass}>
                <select
                  value={formValues.maker}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, maker: e.target.value }))}
                  className={inputCell}
                >
                  <option value="">指定なし</option>
                  <option value="サミー">サミー</option>
                  <option value="SANKYO">SANKYO</option>
                  <option value="京楽">京楽</option>
                  <option value="三洋">三洋</option>
                  <option value="北電子">北電子</option>
                  <option value="大都技研">大都技研</option>
                </select>
              </td>
              <td className={searchRowClass}>
                <div className="flex items-center gap-2">
                  <select
                    value={formValues.model}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, model: e.target.value }))}
                    className={`${inputCell} w-full`}
                  >
                    <option value="">指定なし</option>
                    <option value="パチスロ炎舞">パチスロ炎舞</option>
                    <option value="ぱちんこ銀河伝説">ぱちんこ銀河伝説</option>
                    <option value="海物語ライト">海物語ライト</option>
                    <option value="ルパン三世MAX">ルパン三世MAX</option>
                    <option value="ジャグラーSP">ジャグラーSP</option>
                    <option value="番長ZERO">番長ZERO</option>
                    <option value="フィーバーX">フィーバーX</option>
                  </select>
                  <button
                    type="button"
                    className="min-w-[32px] border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800"
                  >
                    🔍
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-600 text-white font-bold">
              <th className={`${headerCellClass} w-32`}>表示数</th>
              <th className={`${headerCellClass} w-56`}>伝票発行日</th>
              <th className={`${headerCellClass} w-56`}>販売担当</th>
              <th className={`${headerCellClass}`}>販売先</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-amber-50">
              <td className={searchRowClass}>
                <select
                  value={formValues.displayCount}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, displayCount: e.target.value }))}
                  className={inputCell}
                >
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </td>
              <td className={searchRowClass}>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input
                    type="date"
                    value={formValues.issueDateFrom}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, issueDateFrom: e.target.value }))}
                    className={inputCell}
                    aria-label="伝票発行日From"
                  />
                  <span className="text-xs text-slate-700">〜</span>
                  <input
                    type="date"
                    value={formValues.issueDateTo}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, issueDateTo: e.target.value }))}
                    className={inputCell}
                    aria-label="伝票発行日To"
                  />
                </div>
              </td>
              <td className={searchRowClass}>
                <select
                  value={formValues.staff}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, staff: e.target.value }))}
                  className={inputCell}
                >
                  <option value="">指定なし</option>
                  <option value="木村">木村</option>
                  <option value="佐々木">佐々木</option>
                  <option value="高橋">高橋</option>
                  <option value="鈴木">鈴木</option>
                  <option value="田中">田中</option>
                  <option value="山本">山本</option>
                  <option value="加藤">加藤</option>
                  <option value="斎藤">斎藤</option>
                </select>
              </td>
              <td className={searchRowClass}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formValues.customer}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, customer: e.target.value }))}
                    className={`${inputCell} w-full`}
                  />
                  <button
                    type="button"
                    className="min-w-[96px] border border-gray-300 bg-white px-4 py-1 text-xs font-semibold text-slate-800"
                  >
                    販売先検索
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-center gap-6 border-t border-gray-300 bg-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={handleSearch}
            className="min-w-[120px] border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff]"
          >
            検索する
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="min-w-[120px] border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff]"
          >
            リセット
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 border border-gray-300 bg-slate-600 px-3 py-2 text-sm font-bold text-white">
        <span className="h-4 w-1 bg-white" aria-hidden />
        <span>販売伝票リスト</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-900">
        <span className="border border-gray-300 bg-white px-3 py-1">PAGE:[ 1 ] 1-7番目表示</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
        <button type="button" onClick={handleDelete} className="border border-gray-300 bg-white px-3 py-1">
          削除
        </button>
        <button type="button" onClick={handleMerge} className="border border-gray-300 bg-white px-3 py-1">
          結合
        </button>
        <button type="button" onClick={handleSelectPage} className="border border-gray-300 bg-white px-3 py-1">
          ページ内全選択
        </button>
        <button type="button" onClick={handleClearSelection} className="border border-gray-300 bg-white px-3 py-1">
          全解除
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-300 bg-white">
        <table className="min-w-full border-collapse text-sm text-slate-900">
          <thead>
            <tr className="bg-slate-600 text-white font-bold">
              <th className="border border-gray-300 px-3 py-2 text-left">販売伝票ID</th>
              <th className="border border-gray-300 px-3 py-2 text-left">伝票発行日</th>
              <th className="border border-gray-300 px-3 py-2 text-left">メーカー名</th>
              <th className="border border-gray-300 px-3 py-2 text-left">機種名</th>
              <th className="border border-gray-300 px-3 py-2 text-left">保管倉庫</th>
              <th className="border border-gray-300 px-3 py-2 text-left">販売先</th>
              <th className="border border-gray-300 px-3 py-2 text-left">区分</th>
              <th className="border border-gray-300 px-3 py-2 text-left">担当</th>
              <th className="border border-gray-300 px-3 py-2 text-left">入金予定日</th>
              <th className="border border-gray-300 px-3 py-2 text-left">取引元</th>
              <th className="border border-gray-300 px-3 py-2 text-left">ステータス</th>
              <th className="border border-gray-300 px-3 py-2 text-left">出庫状況</th>
              <th className="border border-gray-300 px-3 py-2 text-right">合計金額</th>
              <th className="border border-gray-300 px-3 py-2 text-center">選択</th>
              <th className="border border-gray-300 px-3 py-2 text-center">詳細</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={15} className="border border-gray-300 px-4 py-8 text-center text-sm text-slate-700">
                  該当データがありません。
                </td>
              </tr>
            )}
            {filteredInvoices.map((invoice, index) => {
              const rowColor = index % 2 === 0 ? "bg-amber-50" : "bg-white";
              const detailHref =
                invoice.rowType === "group"
                  ? `/sales/sales-invoice/group/${invoice.id}`
                  : invoice.invoiceType === "vendor"
                    ? `/sales/sales-invoice/vendor/${invoice.id}`
                    : `/sales/sales-invoice/hall/${invoice.id}`;
              const typeLabel =
                invoice.invoiceType === "vendor" ? "業者" : invoice.invoiceType === "hall" ? "ホール" : "混在";
              return (
                <tr key={invoice.id} className={`${rowColor}`}>
              <td className="border border-gray-300 px-3 py-2 font-semibold" title={invoice.id}>
                {formatShortId(invoice.id)}
              </td>
              <td className="border border-gray-300 px-3 py-2">{formatDate(invoice.issueDate)}</td>
              <td className="border border-gray-300 px-3 py-2">{invoice.maker}</td>
              <td className="border border-gray-300 px-3 py-2" title={invoice.modelTooltip}>
                {invoice.modelDisplay}
              </td>
              <td className="border border-gray-300 px-3 py-2" title={invoice.warehouseTooltip}>
                {invoice.warehouseDisplay}
              </td>
              <td className="border border-gray-300 px-3 py-2">{invoice.customer}</td>
              <td className="border border-gray-300 px-3 py-2">{typeLabel}</td>
                  <td className="border border-gray-300 px-3 py-2">{invoice.staff}</td>
                  <td className="border border-gray-300 px-3 py-2">{formatDate(invoice.transferDate)}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    {invoice.sourceType === "PACHIMART" ? "パチマート" : invoice.sourceType === "MANUAL" ? "手入力" : "既存在庫"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{invoice.statusLabel}</td>
                  <td className="border border-gray-300 px-3 py-2">{invoice.outboundStatus}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(invoice.id)}
                      onChange={(e) => toggleSelect(invoice.id, e.target.checked)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <Link
                      href={detailHref}
                      className="inline-flex h-7 w-7 items-center justify-center border border-gray-300 bg-slate-200 text-base font-bold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff]"
                    >
                      ＋
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-900">
        <span className="border border-gray-300 bg-white px-3 py-1">PAGE:[ 1 ] 1-7番目表示</span>
      </div>
    </div>
  );
}
