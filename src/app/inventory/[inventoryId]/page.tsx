"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import InventoryEditTable from "@/components/inventory/InventoryEditTable";
import SerialInputPanel, {
  type SerialSplitPayload,
} from "@/app/inventory/purchase-invoice/_components/SerialInputPanel";
import {
  generateInventoryId,
  loadInventoryRecords,
  saveInventoryRecords,
  updateInventoryRecord,
  type InventoryRecord,
} from "@/lib/demo-data/demoInventory";
import { loadPurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
import { loadSalesInvoices } from "@/lib/demo-data/salesInvoices";
import { buildEditForm, buildPayload } from "@/lib/inventory/editUtils";
import {
  clearSerialDraft,
  saveSerialInput,
  type SerialInputPayload,
  type SerialInputRow,
} from "@/lib/serialInputStorage";

type ToastState = {
  tone: "success" | "error";
  message: string;
};

const isRowComplete = (row: SerialInputRow) =>
  [row.board, row.frame, row.main, row.removalDate].every((value) => value.trim() !== "");

export default function InventoryDetailPage() {
  const params = useParams<{ inventoryId: string }>();
  const router = useRouter();
  const inventoryId = params?.inventoryId ?? "";

  const [record, setRecord] = useState<InventoryRecord | null>(() => {
    const all = loadInventoryRecords();
    return all.find((item) => item.id === inventoryId) ?? null;
  });
  const [activeTab, setActiveTab] = useState<"edit" | "serial">("edit");
  const [bulkEditForms, setBulkEditForms] = useState<Record<string, Partial<InventoryRecord>>>(() =>
    record ? { [record.id]: buildEditForm(record) } : {},
  );
  const [serialRefreshToken, setSerialRefreshToken] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const all = loadInventoryRecords();
    const nextRecord = all.find((item) => item.id === inventoryId) ?? null;
    setRecord(nextRecord);
    if (nextRecord) {
      setBulkEditForms((prev) => ({
        ...prev,
        [nextRecord.id]: buildEditForm(nextRecord),
      }));
    }
  }, [inventoryId]);

  const groups = useMemo(() => {
    if (!record) return [] as Array<[string, InventoryRecord[]]>;
    const supplier = record.supplier?.trim() || "未設定";
    return [[supplier, [record]]] as Array<[string, InventoryRecord[]]>;
  }, [record]);

  const showToast = (tone: ToastState["tone"], message: string) => {
    setToast({ tone, message });
    window.setTimeout(() => setToast(null), 3000);
  };

  const refreshRecord = () => {
    const all = loadInventoryRecords();
    const next = all.find((item) => item.id === inventoryId) ?? null;
    setRecord(next);
    if (next) {
      setBulkEditForms((prev) => ({
        ...prev,
        [next.id]: buildEditForm(next),
      }));
    }
  };

  const handleBulkFormChange = <K extends keyof InventoryRecord>(
    id: string,
    key: K,
    value: InventoryRecord[K],
  ) => {
    setBulkEditForms((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  };

  const handleEditSave = () => {
    if (!record) return;
    const form = bulkEditForms[record.id] ?? buildEditForm(record);
    const updated = updateInventoryRecord(record.id, buildPayload(form));
    const latest = updated.find((item) => item.id === record.id) ?? record;
    setRecord(latest);
    setBulkEditForms((prev) => ({
      ...prev,
      [latest.id]: buildEditForm(latest),
    }));
    showToast("success", "在庫情報を保存しました。");
  };

  const handleSerialUnitsChange = (nextUnits: number) => {
    if (!record) return;
    const updated = updateInventoryRecord(record.id, { quantity: nextUnits });
    const latest = updated.find((item) => item.id === record.id) ?? record;
    setRecord(latest);
  };

  const handleSerialRegister = async (payload: SerialInputPayload) => {
    if (!record) return;
    setRegistering(true);
    try {
      saveSerialInput(payload);
      clearSerialDraft(payload.inventoryId);
      setSerialRefreshToken((prev) => prev + 1);
      refreshRecord();
      showToast("success", "番号登録が完了しました。");
    } catch (error) {
      console.error("Failed to save serial input", error);
      showToast("error", "番号登録に失敗しました。もう一度お試しください。");
    } finally {
      setRegistering(false);
    }
  };

  const handleSerialSplit = (payload: SerialSplitPayload) => {
    if (!record) return null;
    const currentRecords = loadInventoryRecords();
    const target = currentRecords.find((item) => item.id === payload.inventoryId);
    if (!target) return null;

    const hasPurchaseInvoice =
      Boolean(target.purchaseInvoiceId) ||
      loadPurchaseInvoices().some((invoice) => invoice.inventoryIds.includes(target.id));
    const hasSalesInvoice = loadSalesInvoices().some((invoice) => {
      const inIds = invoice.inventoryIds?.includes(target.id) ?? false;
      const inItems = invoice.items?.some((item) => item.inventoryId === target.id) ?? false;
      return inIds || inItems;
    });

    if (hasPurchaseInvoice || hasSalesInvoice) {
      showToast("error", "購入/販売伝票が作成済みの在庫は分離できません。");
      return null;
    }

    const selectedRows = payload.selectedIndexes.map((index) => payload.rows[index]);
    if (selectedRows.some((row) => !isRowComplete(row))) {
      showToast("error", "番号未入力の行は分離できません。");
      return null;
    }

    const baseQuantity = Number(target.quantity ?? payload.units ?? 1);
    const splitCount = payload.selectedIndexes.length;
    if (baseQuantity < 2) {
      showToast("error", "仕入数が1台のため分離できません。");
      return null;
    }
    if (splitCount === 0) {
      showToast("error", "分離する台を選択してください。");
      return null;
    }
    if (splitCount >= baseQuantity) {
      showToast("error", "分離後の仕入数が0になります。分離台数を調整してください。");
      return null;
    }

    const selectedSet = new Set(payload.selectedIndexes);
    const remainingRows = payload.rows.filter((_, index) => !selectedSet.has(index));
    const movedRows = payload.rows.filter((_, index) => selectedSet.has(index));
    const nextRows = remainingRows.map((row, index) => ({ ...row, p: index + 1 }));
    const newRows = movedRows.map((row, index) => ({ ...row, p: index + 1 }));
    const now = new Date().toISOString();
    const newInventoryId = generateInventoryId();
    const updatedRecords = currentRecords.map((item) =>
      item.id === payload.inventoryId ? { ...item, quantity: baseQuantity - splitCount } : item,
    );
    const newInventory: InventoryRecord = {
      ...target,
      id: newInventoryId,
      createdAt: now,
      quantity: splitCount,
    };
    const nextRecords = [...updatedRecords, newInventory];
    saveInventoryRecords(nextRecords);
    setRecord(nextRecords.find((item) => item.id === payload.inventoryId) ?? target);

    saveSerialInput({
      inventoryId: payload.inventoryId,
      units: nextRows.length,
      rows: nextRows,
      updatedAt: now,
    });
    saveSerialInput({
      inventoryId: newInventoryId,
      units: newRows.length,
      rows: newRows,
      updatedAt: now,
    });
    clearSerialDraft(payload.inventoryId);
    clearSerialDraft(newInventoryId);
    setSerialRefreshToken((prev) => prev + 1);
    showToast("success", `分離しました（新在庫ID: ${newInventoryId}）`);
    return newInventoryId;
  };

  if (!record) {
    return (
      <div className="min-h-screen bg-white py-10">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="text-lg font-semibold text-neutral-900">在庫が見つかりませんでした</h1>
          <p className="mt-2 text-sm text-neutral-600">対象の在庫IDが存在しない可能性があります。</p>
          <button
            type="button"
            onClick={() => router.push("/inventory")}
            className="mt-4 border border-gray-300 bg-[#f7f3e9] px-4 py-2 text-sm font-semibold"
          >
            在庫一覧へ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 mx-[1cm]">
      <div className="mx-auto max-w-[1600px] px-[38px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">在庫編集 / 番号登録</h1>
            <p className="text-xs text-neutral-600">ID: {record.id}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/inventory")}
            className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold"
          >
            在庫一覧へ戻る
          </button>
        </div>

        {toast && (
          <div
            className={`mt-4 rounded border px-4 py-2 text-sm font-semibold ${
              toast.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="mt-4 border border-gray-300 bg-white">
          <div className="flex border-b border-gray-300 text-sm font-semibold">
            {[
              { key: "edit", label: "在庫編集" },
              { key: "serial", label: "個体番号" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as "edit" | "serial")}
                className={`border-r border-gray-300 px-4 py-2 ${
                  activeTab === tab.key ? "bg-[#f7f3e9] text-slate-800" : "bg-white text-neutral-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-4">
            {activeTab === "edit" ? (
              <div className="space-y-4">
                <InventoryEditTable
                  groups={groups}
                  bulkEditForms={bulkEditForms}
                  onChange={handleBulkFormChange}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => router.push("/inventory")}
                    className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleEditSave}
                    className="border border-gray-300 bg-[#f7f3e9] px-4 py-1 text-sm font-semibold"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <SerialInputPanel
                inventoryId={record.id}
                onRegister={handleSerialRegister}
                onUnitsChange={handleSerialUnitsChange}
                onSplit={handleSerialSplit}
                enableSplit
                refreshToken={serialRefreshToken}
                onBack={() => router.push("/inventory")}
                registering={registering}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
