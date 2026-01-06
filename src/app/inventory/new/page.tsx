"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { addInventoryRecords, generateInventoryId, type InventoryRecord } from "@/lib/demo-data/demoInventory";
import {
  DEFAULT_MASTER_DATA,
  loadMasterData,
  type MasterData,
  type SupplierCategory,
  type SupplierCorporate,
} from "@/lib/demo-data/demoMasterData";
import { MACHINE_CATALOG, getMakerOptions } from "@/lib/inventory/machineCatalog";

type SupplierInfo = {
  supplier: string;
  supplierBranch?: string;
  supplierCategory?: SupplierCategory;
  supplierPostalCode?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierFax?: string;
  inputDate: string;
  isVisible: boolean;
  taxType: "inclusive" | "exclusive";
  isConsignment: boolean;
  notes: string;
  buyerStaff: string;
};

type InventoryFormRow = {
  id?: string;
  maker: string;
  model: string;
  kind: "" | "P" | "S";
  type: "" | "本体" | "枠" | "セル";
  quantity: number | "";
  unitPrice: number | "";
  saleUnitPrice: number | "";
  hasRemainingDebt: boolean;
  stockInDate: string;
  removeDate: string;
  pattern: string;
  warehouse: string;
  note: string;
  isPublished: boolean;
  isPickupAvailable: boolean;
  hasNailSheet: boolean;
  hasManual: boolean;
  isShippingTwoPackages: boolean;
  isHandlingFeeTwoPackages: boolean;
  isSeparateSaleProhibited: boolean;
};

type PublishOptionsState = Pick<
  InventoryFormRow,
  | "isPickupAvailable"
  | "hasNailSheet"
  | "hasManual"
  | "isShippingTwoPackages"
  | "isHandlingFeeTwoPackages"
  | "isSeparateSaleProhibited"
>;

const DEVICE_TYPES: InventoryFormRow["type"][] = ["本体", "枠", "セル"];

const createBlankRow = (today: string): InventoryFormRow => ({
  maker: "",
  model: "",
  kind: "",
  type: "",
  quantity: "",
  unitPrice: "",
  saleUnitPrice: "",
  hasRemainingDebt: false,
  stockInDate: today,
  removeDate: "",
  pattern: "",
  warehouse: "",
  note: "",
  isPublished: false,
  isPickupAvailable: false,
  hasNailSheet: false,
  hasManual: false,
  isShippingTwoPackages: false,
  isHandlingFeeTwoPackages: false,
  isSeparateSaleProhibited: false,
});

const todayString = () => new Date().toISOString().slice(0, 10);

const parseNumberInput = (value: string) => (value === "" ? "" : Number(value));
const normalizeNumber = (value: number | "") => (value === "" || Number.isNaN(value) ? 0 : value);

const mapListingStatusToStockStatus = (status: "listing" | "not_listing") => {
  if (status === "listing") return "出品中";
  return "倉庫";
};

type MachineFieldOrder =
  | "kind"
  | "maker"
  | "model"
  | "type"
  | "quantity"
  | "unitPrice"
  | "saleUnitPrice"
  | "hasRemainingDebt"
  | "stockInDate"
  | "removeDate"
  | "pattern"
  | "warehouse"
  | "isPublished";

type SupplierFieldOrder = "supplier" | "inputDate" | "buyerStaff";

const PUBLISH_OPTIONS = [
  { key: "isPickupAvailable", label: "引取可" },
  { key: "hasNailSheet", label: "釘シートあり" },
  { key: "hasManual", label: "遊技機説明書あり" },
  { key: "isShippingTwoPackages", label: "送料2個口" },
  { key: "isHandlingFeeTwoPackages", label: "出庫手数料2個口" },
  { key: "isSeparateSaleProhibited", label: "ばら売り不可" },
] as const satisfies ReadonlyArray<{ key: keyof InventoryFormRow; label: string }>;

export default function InventoryNewPage() {
  const router = useRouter();
  const [today, setToday] = useState<string>(todayString());
  const [rows, setRows] = useState<InventoryFormRow[]>([createBlankRow(todayString())]);
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo>({
    supplier: "",
    inputDate: todayString(),
    isVisible: true,
    taxType: "exclusive",
    isConsignment: false,
    notes: "",
    buyerStaff: "",
  });
  const [masterData, setMasterData] = useState<MasterData>(DEFAULT_MASTER_DATA);
  const [selectedCorporateId, setSelectedCorporateId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openModelIndex, setOpenModelIndex] = useState<number | null>(null);
  const [publishModalState, setPublishModalState] = useState<{
    open: boolean;
    rowIndex: number | null;
    mode: "publish" | "edit";
    draft: PublishOptionsState;
  }>({
    open: false,
    rowIndex: null,
    mode: "publish",
    draft: {
      isPickupAvailable: false,
      hasNailSheet: false,
      hasManual: false,
      isShippingTwoPackages: false,
      isHandlingFeeTwoPackages: false,
      isSeparateSaleProhibited: false,
    },
  });
  const makerOptions = useMemo(() => getMakerOptions(MACHINE_CATALOG), []);
  const makerOptionsByKind = useMemo(
    () => ({
      P: getMakerOptions(MACHINE_CATALOG.filter((item) => item.kind === "P")),
      S: getMakerOptions(MACHINE_CATALOG.filter((item) => item.kind === "S")),
    }),
    [],
  );
  const focusMap = useRef<Map<string, HTMLElement>>(new Map());
  const inputBase =
    "h-7 w-full rounded-none border border-slate-600 bg-amber-50 px-1 text-sm text-neutral-900 focus:border-slate-800 focus:ring-0 focus:outline-none";
  const selectBase = `${inputBase} bg-amber-50`;
  const excelTh =
    "border border-gray-300 bg-slate-600 px-2 py-1 text-xs font-bold text-white";
  const excelTd = "border border-gray-300 px-2 py-1 align-top";
  const excelBtn =
    "h-8 rounded-none border border-slate-600 bg-slate-200 px-4 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] transition hover:bg-slate-100";
  const machineTableColGroup =
    "40px 55px 120px 240px 80px 70px 90px 90px 70px 110px 110px 70px 100px 90px";
  const machineOrder: MachineFieldOrder[] = [
    "kind",
    "maker",
    "model",
    "type",
    "quantity",
    "unitPrice",
    "saleUnitPrice",
    "hasRemainingDebt",
    "stockInDate",
    "removeDate",
    "pattern",
    "warehouse",
    "isPublished",
  ];
  const supplierOrder: SupplierFieldOrder[] = ["supplier", "inputDate", "buyerStaff"];

  const applySupplierSelection = useCallback((corporate?: SupplierCorporate, branchId?: string) => {
    const branch = corporate?.branches.find((item) => item.id === branchId) ?? corporate?.branches[0];
    setSupplierInfo((prev) => ({
      ...prev,
      supplier: corporate?.corporateName ?? "",
      supplierBranch: branch?.name ?? "",
      supplierCategory: corporate?.category,
      supplierPostalCode: branch?.postalCode || corporate?.postalCode || "",
      supplierAddress: branch?.address || corporate?.address || "",
      supplierPhone: branch?.phone || corporate?.phone || "",
      supplierFax: branch?.fax || corporate?.fax || "",
    }));
  }, []);

  const selectedCorporate = useMemo(
    () => masterData.suppliers.find((supplier) => supplier.id === selectedCorporateId),
    [masterData.suppliers, selectedCorporateId],
  );

  const selectedBranch = useMemo(
    () => selectedCorporate?.branches.find((branch) => branch.id === selectedBranchId),
    [selectedCorporate?.branches, selectedBranchId],
  );

  useEffect(() => {
    const loaded = loadMasterData();
    setMasterData(loaded);
    const todayValue = todayString();
    setToday(todayValue);
    setSupplierInfo((prev) => ({ ...prev, inputDate: todayValue }));
    setRows([createBlankRow(todayValue)]);
    const firstCorporate = loaded.suppliers[0];
    const firstBranchId = firstCorporate?.branches[0]?.id ?? "";
    setSelectedCorporateId(firstCorporate?.id ?? "");
    setSelectedBranchId(firstBranchId);
    applySupplierSelection(firstCorporate, firstBranchId);
  }, [applySupplierSelection]);

  const focusKey = (rowIndex: number, field: MachineFieldOrder) => `row-${rowIndex}-${field}`;

  const registerFocus = (key: string) => (element: HTMLElement | null) => {
    if (!element) {
      focusMap.current.delete(key);
      return;
    }
    focusMap.current.set(key, element);
  };

  const focusTo = (key: string) => {
    const target = focusMap.current.get(key);
    if (target) {
      target.focus();
      if (target instanceof HTMLInputElement) {
        target.select();
      }
    }
  };

  const resetPublishOptions = (row: InventoryFormRow): InventoryFormRow => ({
    ...row,
    isPickupAvailable: false,
    hasNailSheet: false,
    hasManual: false,
    isShippingTwoPackages: false,
    isHandlingFeeTwoPackages: false,
    isSeparateSaleProhibited: false,
  });

  const extractPublishOptions = (row: InventoryFormRow): PublishOptionsState => ({
    isPickupAvailable: row.isPickupAvailable,
    hasNailSheet: row.hasNailSheet,
    hasManual: row.hasManual,
    isShippingTwoPackages: row.isShippingTwoPackages,
    isHandlingFeeTwoPackages: row.isHandlingFeeTwoPackages,
    isSeparateSaleProhibited: row.isSeparateSaleProhibited,
  });

  const openPublishModal = (index: number, mode: "publish" | "edit") => {
    const row = rows[index];
    if (!row) return;
    setPublishModalState({
      open: true,
      rowIndex: index,
      mode,
      draft: extractPublishOptions(row),
    });
  };

  const closePublishModal = () =>
    setPublishModalState((prev) => ({
      ...prev,
      open: false,
      rowIndex: null,
    }));

  const handleRowChange = <K extends keyof InventoryFormRow>(index: number, key: K, value: InventoryFormRow[K]) => {
    setRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        if (key === "isPublished") {
          const next = { ...row, isPublished: value as InventoryFormRow["isPublished"] };
          if (!value) {
            return resetPublishOptions(next);
          }
          return next;
        }
        return { ...row, [key]: value };
      }),
    );
  };

  const handlePublishToggle = (index: number, nextValue: boolean) => {
    if (nextValue) {
      setRows((prev) =>
        prev.map((row, idx) => (idx === index ? { ...row, isPublished: true } : row)),
      );
      openPublishModal(index, "publish");
      return;
    }
    handleRowChange(index, "isPublished", false);
  };

  const handlePublishConfirm = () => {
    if (publishModalState.rowIndex == null) {
      closePublishModal();
      return;
    }
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === publishModalState.rowIndex
          ? { ...row, isPublished: true, ...publishModalState.draft }
          : row,
      ),
    );
    closePublishModal();
  };

  const handlePublishCancel = () => {
    if (publishModalState.rowIndex == null) {
      closePublishModal();
      return;
    }
    if (publishModalState.mode === "publish") {
      setRows((prev) =>
        prev.map((row, idx) =>
          idx === publishModalState.rowIndex
            ? resetPublishOptions({ ...row, isPublished: false })
            : row,
        ),
      );
    }
    closePublishModal();
  };

  const handleSupplierChange = <K extends keyof SupplierInfo>(key: K, value: SupplierInfo[K]) => {
    setSupplierInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddRow = () => {
    setRows((prev) => {
      const next = [...prev, createBlankRow(today)];
      const key = focusKey(prev.length, machineOrder[0]);
      requestAnimationFrame(() => focusTo(key));
      return next;
    });
  };

  const handleDuplicateRow = () =>
    setRows((prev) => {
      if (prev.length === 0) return [createBlankRow(today)];
      const last = prev[prev.length - 1];
      const next = [...prev, resetPublishOptions({ ...last, id: undefined, isPublished: false })];
      const key = focusKey(prev.length, machineOrder[0]);
      requestAnimationFrame(() => focusTo(key));
      return next;
    });

  const handleDeleteRow = (index: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const handleAddRowWithFocus = () => {
    setRows((prev) => {
      const next = [...prev, createBlankRow(today)];
      const key = focusKey(prev.length, machineOrder[0]);
      requestAnimationFrame(() => focusTo(key));
      return next;
    });
  };

  const handleCorporateSelect = (value: string) => {
    setSelectedCorporateId(value);
    const corporate = masterData.suppliers.find((item) => item.id === value);
    const nextBranchId = corporate?.branches[0]?.id ?? "";
    setSelectedBranchId(nextBranchId);
    applySupplierSelection(corporate, nextBranchId);
  };

  const handleBranchSelect = (value: string) => {
    setSelectedBranchId(value);
    applySupplierSelection(selectedCorporate, value);
  };

  const handleSupplierEnter = (event: React.KeyboardEvent<HTMLElement>, field: SupplierFieldOrder) => {
    if (event.key !== "Enter" || event.nativeEvent?.isComposing) return;
    event.preventDefault();
    if (field === "supplier" && selectedCorporate?.category === "hall") {
      focusTo("supplier-branch");
      return;
    }
    const currentIndex = supplierOrder.indexOf(field);
    if (currentIndex < supplierOrder.length - 1) {
      const nextField = supplierOrder[currentIndex + 1];
      focusTo(`supplier-${nextField}`);
      return;
    }
    focusTo(focusKey(0, machineOrder[0]));
  };

  const handleMachineEnter = (event: React.KeyboardEvent<HTMLElement>, rowIndex: number, field: MachineFieldOrder) => {
    if (event.key !== "Enter" || event.nativeEvent?.isComposing) return;
    event.preventDefault();
    const currentIndex = machineOrder.indexOf(field);
    if (currentIndex < machineOrder.length - 1) {
      const nextField = machineOrder[currentIndex + 1];
      focusTo(focusKey(rowIndex, nextField));
      return;
    }

    if (rowIndex < rows.length - 1) {
      focusTo(focusKey(rowIndex + 1, machineOrder[0]));
      return;
    }

    handleAddRowWithFocus();
  };

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const qty = normalizeNumber(row.quantity);
        if (row.kind === "P") acc.pCount += qty;
        if (row.kind === "S") acc.sCount += qty;
        const unit = normalizeNumber(row.unitPrice);
        acc.totalAmount += unit * qty;
        return acc;
      },
      { pCount: 0, sCount: 0, totalAmount: 0 },
    );
  }, [rows]);

  const resetForm = () => {
    const todayValue = todayString();
    setToday(todayValue);
    setRows([createBlankRow(todayValue)]);
    setSupplierInfo((prev) => ({
      ...prev,
      inputDate: todayValue,
      isVisible: true,
      taxType: "exclusive",
      isConsignment: false,
      notes: "",
      buyerStaff: "",
    }));
    requestAnimationFrame(() => focusTo(focusKey(0, machineOrder[0])));
  };

  const handleSubmit = (mode: "single" | "continuous") => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const corporate = selectedCorporate;
    const branch = selectedBranch;
    const supplierName = supplierInfo.supplier || corporate?.corporateName || "";
    const branchName = supplierInfo.supplierBranch || branch?.name;
    const supplierAddress =
      supplierInfo.supplierAddress || branch?.address || corporate?.address || "";
    const supplierPostalCode =
      supplierInfo.supplierPostalCode || branch?.postalCode || corporate?.postalCode || "";
    const supplierPhone = supplierInfo.supplierPhone || branch?.phone || corporate?.phone || "";
    const supplierFax = supplierInfo.supplierFax || branch?.fax || corporate?.fax || "";
    const prepared: InventoryRecord[] = rows
      .filter((row) => row.maker || row.model)
      .map((row) => {
        const listingStatus = row.isPublished ? "listing" : "not_listing";
        const status = mapListingStatusToStockStatus(listingStatus);
        const stockInDate = row.stockInDate || supplierInfo.inputDate || today;
        return {
          id: row.id || generateInventoryId(),
          createdAt: supplierInfo.inputDate || today,
          status,
          stockStatus: status,
          listingStatus,
          isVisible: supplierInfo.isVisible,
          hasRemainingDebt: row.hasRemainingDebt,
          taxType: supplierInfo.taxType,
          isConsignment: supplierInfo.isConsignment,
          consignment: supplierInfo.isConsignment,
          maker: row.maker,
          model: row.model,
          machineName: row.model,
          kind: row.kind || undefined,
          type: row.type || undefined,
          quantity: normalizeNumber(row.quantity),
          unitPrice: normalizeNumber(row.unitPrice),
          saleUnitPrice: normalizeNumber(row.saleUnitPrice),
          stockInDate,
          arrivalDate: stockInDate,
          removeDate: row.removeDate || undefined,
          removalDate: row.removeDate || undefined,
          pattern: row.pattern || undefined,
          warehouse: row.warehouse || undefined,
          storageLocation: row.warehouse || undefined,
          supplier: supplierName || undefined,
          supplierCorporate: corporate?.corporateName || supplierName || undefined,
          supplierBranch: branchName || undefined,
          supplierCategory: corporate?.category,
          supplierAddress: supplierAddress || undefined,
          supplierPostalCode: supplierPostalCode || undefined,
          supplierPhone: supplierPhone || undefined,
          supplierFax: supplierFax || undefined,
          staff: supplierInfo.buyerStaff || undefined,
          buyerStaff: supplierInfo.buyerStaff || undefined,
          note: row.note || supplierInfo.notes || undefined,
          notes: row.note || supplierInfo.notes || undefined,
          isPickupAvailable: row.isPickupAvailable,
          hasNailSheet: row.hasNailSheet,
          hasManual: row.hasManual,
          isShippingTwoPackages: row.isShippingTwoPackages,
          isHandlingFeeTwoPackages: row.isHandlingFeeTwoPackages,
          isSeparateSaleProhibited: row.isSeparateSaleProhibited,
        } satisfies InventoryRecord;
      });

    if (prepared.length === 0) {
      alert("登録する行を入力してください");
      setIsSubmitting(false);
      return;
    }

    try {
      addInventoryRecords(prepared);
      if (mode === "continuous") {
        alert("在庫を登録しました。続けて入力してください。");
        resetForm();
      } else {
        alert("在庫を登録しました。");
        router.push("/inventory");
      }
    } catch (error) {
      console.error("在庫登録に失敗しました", error);
      alert("登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const machineMatches = (keyword: string, maker?: string, kind?: InventoryFormRow["kind"]) => {
    const normalized = keyword.trim();
    return MACHINE_CATALOG.filter((item) => {
      if (kind && item.kind !== kind) return false;
      if (maker && item.maker !== maker) return false;
      if (!normalized) return !!maker || !!kind;
      return item.title.includes(normalized);
    }).slice(0, 8);
  };

  const handleModelBlur = () => {
    window.setTimeout(() => setOpenModelIndex(null), 150);
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-2 px-2 pb-6 pt-2 mx-[1cm]">
      <div className="space-y-2 p-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">在庫登録</h1>
              <p className="text-xs text-neutral-600">仕入先情報を入力し、仕入機種を行ごとに追加してください。</p>
            </div>
            <div className="text-right text-xs text-neutral-700">
              <div>集計情報：P {summary.pCount}台 / S {summary.sCount}台</div>
              <div>購入金額 {summary.totalAmount.toLocaleString()}円</div>
              <div className="mt-1 text-[11px] text-neutral-500">Enterで次フィールドへ</div>
            </div>
          </div>

          <table className="w-full border-collapse table-auto text-sm">
            <colgroup>
              <col className="w-[70px]" />
              <col className="w-[130px]" />
              <col className="w-[300px]" />
              <col className="w-[210px]" />
              <col className="w-[80px]" />
              <col className="w-[130px]" />
              <col className="w-[80px]" />
            </colgroup>
            <thead>
              <tr>
                <th className={excelTh}>表示</th>
                <th className={excelTh}>在庫入力日</th>
                <th className={excelTh}>仕入先</th>
                <th className={excelTh}>備考</th>
                <th className={excelTh}>消費税</th>
                <th className={excelTh}>仕入担当</th>
                <th className={excelTh}>委託</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className={excelTd}>
                  <select
                    value={supplierInfo.isVisible ? "1" : "0"}
                    onChange={(event) => handleSupplierChange("isVisible", event.target.value === "1")}
                    className={`${selectBase} text-center`}
                  >
                    <option value="1">する</option>
                    <option value="0">しない</option>
                  </select>
                </td>
                <td className={excelTd}>
                  <input
                    type="date"
                    value={supplierInfo.inputDate}
                    onChange={(event) => handleSupplierChange("inputDate", event.target.value)}
                    onKeyDown={(event) => handleSupplierEnter(event, "inputDate")}
                    ref={registerFocus("supplier-inputDate")}
                    className={inputBase}
                  />
                </td>
                <td className={excelTd}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <select
                        value={selectedCorporateId}
                        onChange={(event) => handleCorporateSelect(event.target.value)}
                        onKeyDown={(event) => handleSupplierEnter(event, "supplier")}
                        ref={registerFocus("supplier-supplier")}
                        className={selectBase}
                      >
                        {masterData.suppliers.length === 0 && (
                          <option value="">仕入先を登録してください</option>
                        )}
                        {masterData.suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.corporateName}（{supplier.category === "hall" ? "ホール" : "業者"}）
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="h-7 rounded-none border border-slate-600 bg-slate-100 px-2 text-[11px] text-slate-700 shadow-[inset_1px_1px_0px_0px_#ffffff]"
                      >
                        仕入先検索
                      </button>
                    </div>
                    {selectedCorporate?.category === "hall" && (
                      <select
                        value={selectedBranchId}
                        onChange={(event) => handleBranchSelect(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                            event.preventDefault();
                            focusTo("supplier-inputDate");
                          }
                        }}
                        ref={registerFocus("supplier-branch")}
                        className={selectBase}
                      >
                        {(selectedCorporate?.branches ?? []).map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <div className="text-[10px] text-neutral-600">
                      {selectedCorporate?.corporateName || "法人未選択"}
                      {selectedBranch?.name ? ` / ${selectedBranch.name}` : ""}
                    </div>
                  </div>
                </td>
                <td className={excelTd}>
                  <textarea
                    value={supplierInfo.notes}
                    onChange={(event) => handleSupplierChange("notes", event.target.value)}
                    rows={3}
                    className="h-16 w-full rounded-none border border-slate-600 bg-amber-50 px-1 py-1 text-sm text-neutral-900 focus:border-slate-800 focus:ring-0 focus:outline-none"
                  />
                </td>
                <td className={excelTd}>
                  <select
                    value={supplierInfo.taxType}
                    onChange={(event) =>
                      handleSupplierChange("taxType", event.target.value as SupplierInfo["taxType"])
                    }
                    className={`${selectBase} text-center`}
                  >
                    <option value="exclusive">税別</option>
                    <option value="inclusive">税込</option>
                  </select>
                </td>
                <td className={excelTd}>
                  <select
                    value={supplierInfo.buyerStaff}
                    onChange={(event) => handleSupplierChange("buyerStaff", event.target.value)}
                    onKeyDown={(event) => handleSupplierEnter(event, "buyerStaff")}
                    ref={registerFocus("supplier-buyerStaff")}
                    className={selectBase}
                  >
                    <option value="">選択してください</option>
                    {masterData.buyerStaffs.map((staff) => (
                      <option key={staff} value={staff}>
                        {staff}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={`${excelTd} text-center`}>
                  <label className="flex items-center justify-center gap-1 text-[11px] text-neutral-700">
                    <input
                      type="checkbox"
                      checked={supplierInfo.isConsignment}
                      onChange={(event) => handleSupplierChange("isConsignment", event.target.checked)}
                      className="h-4 w-4 rounded-none border border-slate-600 text-emerald-700 focus:ring-0"
                    />
                    委託
                  </label>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse table-auto text-sm">
            <colgroup>
              {machineTableColGroup.split(" ").map((width, index) => (
                <col key={`machine-col-${index}`} style={{ width }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className={excelTh}>行</th>
                <th className={excelTh}>種別</th>
                <th className={excelTh}>メーカー名</th>
                <th className={excelTh}>機種名</th>
                <th className={excelTh}>タイプ</th>
                <th className={excelTh}>仕入数</th>
                <th className={excelTh}>仕入単価</th>
                <th className={excelTh}>販売単価</th>
                <th className={excelTh}>残債</th>
                <th className={excelTh}>入庫日</th>
                <th className={excelTh}>撤去日</th>
                <th className={excelTh}>柄</th>
                <th className={excelTh}>保管先</th>
                <th className={excelTh}>公開</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const makerList = row.kind ? makerOptionsByKind[row.kind] : makerOptions;
                const suggestions = machineMatches(row.model, row.maker, row.kind);
                return (
                  <tr key={`row-${index}`} className="bg-white">
                    <td className={`${excelTd} text-center text-[11px] text-neutral-700`}>
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-neutral-900">{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(index)}
                          className="rounded-none border border-slate-500 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 disabled:opacity-40"
                          disabled={rows.length <= 1}
                        >
                          削除
                        </button>
                      </div>
                    </td>
                    <td className={excelTd}>
                      <select
                        value={row.kind}
                        onChange={(event) =>
                          handleRowChange(index, "kind", event.target.value as InventoryFormRow["kind"])
                        }
                        onKeyDown={(event) => handleMachineEnter(event, index, "kind")}
                        ref={registerFocus(focusKey(index, "kind"))}
                        className={`${selectBase} text-center`}
                      >
                        <option value="">-</option>
                        <option value="P">P</option>
                        <option value="S">S</option>
                      </select>
                    </td>
                    <td className={excelTd}>
                      <select
                        value={row.maker}
                        onChange={(event) => handleRowChange(index, "maker", event.target.value)}
                        onKeyDown={(event) => handleMachineEnter(event, index, "maker")}
                        ref={registerFocus(focusKey(index, "maker"))}
                        className={selectBase}
                      >
                        <option value="">選択</option>
                        {makerList.map((maker) => (
                          <option key={maker} value={maker}>
                            {maker}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={`${excelTd} relative`}>
                      <input
                        value={row.model}
                        onChange={(event) => handleRowChange(index, "model", event.target.value)}
                        onKeyDown={(event) => handleMachineEnter(event, index, "model")}
                        onFocus={() => setOpenModelIndex(index)}
                        onBlur={handleModelBlur}
                        ref={registerFocus(focusKey(index, "model"))}
                        placeholder="機種名検索"
                        className={`${inputBase} min-w-[240px]`}
                      />
                      {openModelIndex === index && suggestions.length > 0 && (
                        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto border border-slate-400 bg-white">
                          {suggestions.map((machine) => (
                            <button
                              key={`${machine.maker}-${machine.title}`}
                              type="button"
                              onClick={() => {
                                handleRowChange(index, "model", machine.title);
                                handleRowChange(index, "maker", machine.maker);
                                handleRowChange(index, "kind", machine.kind);
                                setOpenModelIndex(null);
                              }}
                              className="flex w-full items-center justify-between px-2 py-1 text-left text-[12px] hover:bg-slate-100"
                            >
                              <span>{machine.title}</span>
                              <span className="text-[10px] text-neutral-500">{machine.maker}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className={excelTd}>
                      <select
                        value={row.type}
                        onChange={(event) =>
                          handleRowChange(index, "type", event.target.value as InventoryFormRow["type"])
                        }
                        onKeyDown={(event) => handleMachineEnter(event, index, "type")}
                        ref={registerFocus(focusKey(index, "type"))}
                        className={selectBase}
                      >
                        <option value="">選択</option>
                        {DEVICE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={excelTd}>
                      <input
                        type="number"
                        min={0}
                        value={row.quantity}
                        onChange={(event) => handleRowChange(index, "quantity", parseNumberInput(event.target.value))}
                        onKeyDown={(event) => handleMachineEnter(event, index, "quantity")}
                        ref={registerFocus(focusKey(index, "quantity"))}
                        className={`${inputBase} text-right`}
                      />
                    </td>
                    <td className={excelTd}>
                      <input
                        type="number"
                        min={0}
                        value={row.unitPrice}
                        onChange={(event) => handleRowChange(index, "unitPrice", parseNumberInput(event.target.value))}
                        onKeyDown={(event) => handleMachineEnter(event, index, "unitPrice")}
                        ref={registerFocus(focusKey(index, "unitPrice"))}
                        className={`${inputBase} text-right`}
                      />
                    </td>
                    <td className={excelTd}>
                      <input
                        type="number"
                        min={0}
                        value={row.saleUnitPrice}
                        onChange={(event) =>
                          handleRowChange(index, "saleUnitPrice", parseNumberInput(event.target.value))
                        }
                        onKeyDown={(event) => handleMachineEnter(event, index, "saleUnitPrice")}
                        ref={registerFocus(focusKey(index, "saleUnitPrice"))}
                        className={`${inputBase} text-right`}
                      />
                    </td>
                    <td className={excelTd}>
                      <select
                        value={row.hasRemainingDebt ? "1" : "0"}
                        onChange={(event) =>
                          handleRowChange(index, "hasRemainingDebt", event.target.value === "1")
                        }
                        onKeyDown={(event) => handleMachineEnter(event, index, "hasRemainingDebt")}
                        ref={registerFocus(focusKey(index, "hasRemainingDebt"))}
                        className={`${selectBase} text-center`}
                      >
                        <option value="0">無</option>
                        <option value="1">有</option>
                      </select>
                    </td>
                    <td className={excelTd}>
                      <input
                        type="date"
                        value={row.stockInDate}
                        onChange={(event) => handleRowChange(index, "stockInDate", event.target.value)}
                        onKeyDown={(event) => handleMachineEnter(event, index, "stockInDate")}
                        ref={registerFocus(focusKey(index, "stockInDate"))}
                        className={inputBase}
                      />
                    </td>
                    <td className={excelTd}>
                      <input
                        type="date"
                        value={row.removeDate}
                        onChange={(event) => handleRowChange(index, "removeDate", event.target.value)}
                        onClick={(event) => event.currentTarget.showPicker?.()}
                        onKeyDown={(event) => handleMachineEnter(event, index, "removeDate")}
                        ref={registerFocus(focusKey(index, "removeDate"))}
                        className={inputBase}
                      />
                    </td>
                    <td className={excelTd}>
                      <input
                        value={row.pattern}
                        onChange={(event) => handleRowChange(index, "pattern", event.target.value)}
                        onKeyDown={(event) => handleMachineEnter(event, index, "pattern")}
                        ref={registerFocus(focusKey(index, "pattern"))}
                        className={inputBase}
                      />
                    </td>
                    <td className={excelTd}>
                      <select
                        value={row.warehouse}
                        onChange={(event) => handleRowChange(index, "warehouse", event.target.value)}
                        onKeyDown={(event) => handleMachineEnter(event, index, "warehouse")}
                        ref={registerFocus(focusKey(index, "warehouse"))}
                        className={selectBase}
                      >
                        <option value="">選択</option>
                        {masterData.warehouses.map((warehouse) => (
                          <option key={warehouse} value={warehouse}>
                            {warehouse}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={`${excelTd} text-center`}>
                      <div className="flex flex-col items-center gap-1">
                        <label className="flex items-center justify-center gap-1 text-[11px] text-neutral-700">
                          <input
                            type="checkbox"
                            checked={row.isPublished}
                            onChange={(event) => handlePublishToggle(index, event.target.checked)}
                            onKeyDown={(event) => handleMachineEnter(event, index, "isPublished")}
                            ref={registerFocus(focusKey(index, "isPublished"))}
                            className="h-4 w-4 rounded-none border border-slate-600 text-emerald-700 focus:ring-0"
                          />
                          公開
                        </label>
                        {row.isPublished && (
                          <button
                            type="button"
                            onClick={() => openPublishModal(index, "edit")}
                            className="rounded-none border border-slate-500 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                          >
                            確認
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleAddRow} className={excelBtn}>
                空行追加
              </button>
              <button type="button" onClick={handleDuplicateRow} className={excelBtn}>
                同一行追加
              </button>
            </div>
            <div className="text-xs text-neutral-600">
              今日: <span className="font-semibold text-neutral-800">{today}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button type="button" onClick={() => router.back()} className={`${excelBtn} bg-slate-300`}>
              戻る
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("single")}
              disabled={isSubmitting}
              className={`${excelBtn} border-yellow-700 bg-yellow-300 text-yellow-900 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              登録
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("continuous")}
              disabled={isSubmitting}
              className={`${excelBtn} border-emerald-700 bg-emerald-200 text-emerald-900 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              連続登録
            </button>
          </div>
      </div>
      {publishModalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md border border-slate-600 bg-white">
            <div className="border-b border-slate-600 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
              出品オプション設定
            </div>
            <div className="space-y-3 px-4 py-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-800">
                {PUBLISH_OPTIONS.map((option) => (
                  <label key={option.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={publishModalState.draft[option.key]}
                      onChange={(event) =>
                        setPublishModalState((prev) => ({
                          ...prev,
                          draft: { ...prev.draft, [option.key]: event.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded-none border border-slate-600 text-emerald-700 focus:ring-0"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={handlePublishCancel}
                  className="h-8 rounded-none border border-slate-500 bg-slate-100 px-4 text-xs font-semibold text-slate-700"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handlePublishConfirm}
                  className="h-8 rounded-none border border-emerald-700 bg-emerald-200 px-4 text-xs font-semibold text-emerald-900"
                >
                  完了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
