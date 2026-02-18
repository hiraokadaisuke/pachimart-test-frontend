"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { SalesInvoiceSerialModal } from "@/components/inventory/SalesInvoiceSerialModal";
import { addSalesInvoice, generateSalesInvoiceId, loadSalesInvoices } from "@/lib/demo-data/salesInvoices";
import { loadInventoryRecords, updateInventoryStatuses, type InventoryRecord } from "@/lib/demo-data/demoInventory";
import {
  DEFAULT_MASTER_DATA,
  loadMasterData,
  type CompanyProfile,
  type MasterData,
} from "@/lib/demo-data/demoMasterData";
import { splitInventoryForSales } from "@/lib/inventory/salesInvoiceSplit";
import { normalizeNumericInput } from "@/lib/inputNormalization";
import type { SerialInputRow } from "@/lib/serialInputStorage";
import type { SalesInvoiceItem } from "@/types/salesInvoices";

type BaseRow = {
  rowId: string;
  inventoryId?: string;
  maker?: string;
  productName?: string;
  type?: string;
  kind?: string;
  maxQuantity?: number;
  quantity: number;
  unitPrice: string;
  amount: number;
  remainingDebt?: string;
  applicationPrefecture?: string;
  applicationDate?: string;
  note?: string;
  selectedSerialIndexes?: number[];
  serialRows?: SerialInputRow[];
  serialSelectionError?: string;
};

type Props = {
  inventories?: InventoryRecord[];
  selectedIds?: string[];
};

const PAPER_WIDTH = 1200;
const PAPER_MIN_HEIGHT = 760;

const yellowInput =
  "w-full bg-amber-100 border border-black px-2 py-1 text-[12px] leading-tight focus:outline-none";
const orangeInput =
  "w-full bg-orange-200 border border-black px-2 py-1 text-[12px] leading-tight focus:outline-none";
const hallStyleYellowInput =
  "w-full bg-[#fff6cc] border border-[#333] px-2 py-[6px] text-[13px] leading-tight focus:outline-none";
const hallStyleGrayInput =
  "w-full bg-[#f4f0e6] border border-[#333] px-2 py-[6px] text-[13px] leading-tight focus:outline-none";

const toNumber = (value: string | number | undefined) => {
  const normalized = typeof value === "string" ? normalizeNumericInput(value) : value;
  const num = Number(normalized);
  return Number.isNaN(num) ? 0 : num;
};

const toInputNumber = (value?: number) => {
  if (value == null || value === 0) return "";
  return String(value);
};

const buildRowId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function SalesInvoiceLegacyVendorForm({ inventories, selectedIds }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<BaseRow[]>([]);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [error, setError] = useState<string>("");
  const [masterData, setMasterData] = useState<MasterData>(DEFAULT_MASTER_DATA);
  const [sellerProfile, setSellerProfile] = useState<CompanyProfile | null>(null);
  const [vendorName, setVendorName] = useState("株式会社ピーコム");
  const [vendorTel, setVendorTel] = useState("03-1234-5678");
  const [vendorFax, setVendorFax] = useState("03-1234-5679");
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState("");
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().slice(0, 10));
  const [staff, setStaff] = useState("デモユーザー");
  const [manager, setManager] = useState("担当者A");
  const [insurance, setInsurance] = useState("");
  const [bankNote] = useState("三井住友銀行 渋谷支店 普通 1234567 株式会社ピーコム");
  const [paymentDate, setPaymentDate] = useState("");
  const [invoiceOriginal, setInvoiceOriginal] = useState("不要");
  const [deliveryMethod, setDeliveryMethod] = useState("持参");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("AM");
  const [tradeMethod, setTradeMethod] = useState("直送");
  const [tradeDate, setTradeDate] = useState("");
  const [tradeTime, setTradeTime] = useState("AM");
  const [deliveryAddress] = useState("東京都渋谷区桜丘町26-1 セルリアンタワー15F");
  const [tradeAddress] = useState("東京都渋谷区桜丘町26-1 セルリアンタワー15F");
  const [remarks, setRemarks] = useState("リアルタイムの在庫確認ができます");
  const [noteUrl] = useState("https://pachimart.jp");
  const [noteMail] = useState("info@pachimart.jp");
  const [serialModalState, setSerialModalState] = useState<{
    rowId: string;
    inventoryId: string;
    inventoryLabel: string;
    kind?: string;
    maxQuantity: number;
    requiredQuantity: number;
  } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const idsKey = useMemo(() => (selectedIds && selectedIds.length > 0 ? selectedIds.join("_") : ""), [selectedIds]);
  const sellerDisplay = useMemo(() => {
    const profile = sellerProfile;
    const address = [profile?.prefecture, profile?.city, profile?.addressLine2 ?? profile?.addressLine]
      .filter(Boolean)
      .join("");
    return {
      postalCode: profile?.postalCode || "150-8512",
      address: address || "東京都渋谷区桜丘町26-1 セルリアンタワー15F",
      companyName: profile?.corporateName || "株式会社ピーコム",
      representative: profile?.representative || "代表 太郎",
      tel: profile?.phone || "03-1234-5678",
      fax: profile?.fax || "03-1234-5679",
      invoiceNumber: profile?.invoiceNumber || "―",
    };
  }, [sellerProfile]);

  const resetForm = () => {
    setVendorName("株式会社ピーコム");
    setVendorTel("03-1234-5678");
    setVendorFax("03-1234-5679");
    setVendorInvoiceNumber("");
    setIssuedDate(new Date().toISOString().slice(0, 10));
    setStaff("デモユーザー");
    setManager("担当者A");
    setInsurance("");
    setPaymentDate("");
    setInvoiceOriginal("不要");
    setDeliveryMethod("持参");
    setDeliveryDate("");
    setDeliveryTime("AM");
    setTradeMethod("直送");
    setTradeDate("");
    setTradeTime("AM");
    setRemarks("リアルタイムの在庫確認ができます");
    setRows([]);
    setInventoryRecords([]);
    setError("");
  };

  useEffect(() => {
    const data = loadMasterData();
    setMasterData(data);
    const primaryProfile =
      data.companyProfiles?.find((profile) => profile.isPrimary) ?? data.companyProfiles?.[0] ?? data.companyProfile;
    setSellerProfile(primaryProfile ?? null);
  }, []);

  useEffect(() => {
    resetForm();
    const availableInventories = inventories && inventories.length > 0 ? inventories : loadInventoryRecords();
    if (!selectedIds || selectedIds.length === 0) {
      setError("在庫が選択されていません。前の画面で在庫を選択してください。");
      return;
    }

    const lookup = new Map(availableInventories.map((item) => [item.id, item]));
    const orderedRecords = selectedIds
      .map((id) => lookup.get(id))
      .filter((item): item is InventoryRecord => Boolean(item));

    setInventoryRecords(orderedRecords);

    if (orderedRecords.length === 0) {
      setError("指定された在庫が見つかりませんでした。");
      return;
    }

    const mapped = orderedRecords.map<BaseRow>((item) => {
      const quantity = item.quantity ?? 1;
      const unitPriceValue = item.saleUnitPrice ?? item.unitPrice ?? 0;
      return {
        rowId: buildRowId(),
        inventoryId: item.id,
        maker: item.maker ?? "",
        productName: item.model ?? item.machineName ?? "",
        type: item.type ?? item.deviceType ?? "",
        kind: item.kind ?? item.type ?? item.deviceType,
        maxQuantity: quantity,
        quantity,
        unitPrice: toInputNumber(unitPriceValue),
        amount: quantity * toNumber(unitPriceValue),
        remainingDebt: toInputNumber(item.remainingDebt),
        note: item.note ?? item.notes ?? "",
        selectedSerialIndexes: [],
        serialRows: [],
      };
    });

    setRows(mapped);
    const firstVendor = orderedRecords[0]?.supplierCorporate ?? orderedRecords[0]?.supplier ?? "";
    if (firstVendor) {
      setVendorName(firstVendor);
      const supplier = masterData.suppliers.find((entry) => entry.corporateName === firstVendor);
      if (supplier) {
        const branchName = orderedRecords[0]?.supplierBranch ?? "";
        const branch = supplier.branches.find((entry) => entry.name === branchName) ?? supplier.branches[0];
        setVendorTel(branch?.phone || supplier.phone || "");
        setVendorFax(branch?.fax || supplier.fax || "");
        setVendorInvoiceNumber(supplier.invoiceNumber ?? "");
      }
    }
  }, [idsKey, inventories]);

  const subtotal = useMemo(
    () => rows.reduce((sum, row) => sum + toNumber(row.quantity) * toNumber(row.unitPrice), 0),
    [rows],
  );
  const tax = useMemo(() => Math.floor(subtotal * 0.1), [subtotal]);
  const totalAmount = useMemo(() => subtotal + tax + toNumber(insurance), [subtotal, tax, insurance]);

  const invoiceInventoryIds = useMemo(
    () => (inventoryRecords.length > 0 ? inventoryRecords.map((item) => item.id) : selectedIds ?? []),
    [inventoryRecords, selectedIds],
  );
  const existingSalesInvoiceIds = useMemo(() => {
    if (invoiceInventoryIds.length === 0) return [] as string[];
    const targetIds = new Set(invoiceInventoryIds);
    const invoiceMap = new Map<string, string>();
    loadSalesInvoices().forEach((invoice) => {
      invoice.inventoryIds?.forEach((id) => invoiceMap.set(id, invoice.invoiceId));
      invoice.items?.forEach((item) => {
        if (item.inventoryId) {
          invoiceMap.set(item.inventoryId, invoice.invoiceId);
        }
      });
    });
    return Array.from(targetIds)
      .map((id) => invoiceMap.get(id))
      .filter((id): id is string => Boolean(id));
  }, [invoiceInventoryIds]);

  const handleChange = (rowId: string, key: keyof Omit<BaseRow, "rowId">, value: string) => {
    setRows((prev) => {
      const next = prev.map((row) => {
        if (row.rowId !== rowId) return row;
        const updated: BaseRow = { ...row } as BaseRow;
        if (key === "quantity") {
          const nextQuantity = Math.max(0, Number(value) || 0);
          updated.quantity = nextQuantity;
          if ((row.selectedSerialIndexes?.length ?? 0) > nextQuantity) {
            updated.selectedSerialIndexes = [];
            updated.serialSelectionError = "数量変更により番号選択をやり直してください。";
          } else {
            updated.serialSelectionError = "";
          }
          updated.amount = nextQuantity * toNumber(row.unitPrice);
          return updated;
        }
        if (key === "unitPrice") {
          updated.unitPrice = value;
          updated.amount = toNumber(row.quantity) * toNumber(value);
          return updated;
        }
        if (key === "remainingDebt") {
          updated.remainingDebt = value;
          return updated;
        }
        switch (key) {
          case "maker":
          case "productName":
          case "type":
          case "applicationPrefecture":
          case "applicationDate":
          case "note":
            updated[key] = value;
            return updated;
          default:
            return updated;
        }
      });
      return next;
    });
  };

  const commitNumericField = (rowId: string, key: "quantity" | "unitPrice" | "remainingDebt", value: string) => {
    handleChange(rowId, key, normalizeNumericInput(value));
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        rowId: buildRowId(),
        quantity: 1,
        unitPrice: "",
        amount: 0,
        remainingDebt: "",
      },
    ]);
  };

  const moneyDisplay = (value: number | string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return "0";
    return num.toLocaleString("ja-JP");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setRows((prev) => {
      const activeIndex = prev.findIndex((row) => row.rowId === active.id);
      const overIndex = prev.findIndex((row) => row.rowId === over.id);
      if (activeIndex === -1 || overIndex === -1) return prev;
      return arrayMove(prev, activeIndex, overIndex);
    });
  };

  // eslint-disable-next-line react/display-name
  const SortableRow = useMemo(() => ({ row }: { row: BaseRow }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: row.rowId,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <tr ref={setNodeRef} style={style} className={`bg-white ${isDragging ? "opacity-70" : ""}`}>
        <td className="border border-black px-1 py-1 text-center">
          <button
            type="button"
            className="cursor-grab text-lg leading-none text-neutral-700 active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="並び替え"
          >
            ≡
          </button>
        </td>
        <td className="border border-black px-1 py-1">
          <input
            type="text"
            value={row.maker ?? ""}
            onChange={(e) => handleChange(row.rowId, "maker", e.target.value)}
            className={yellowInput}
          />
        </td>
        <td className="border border-black px-1 py-1">
          <input
            type="text"
            value={row.productName ?? ""}
            onChange={(e) => handleChange(row.rowId, "productName", e.target.value)}
            className={yellowInput}
          />
        </td>
        <td className="border border-black px-1 py-1">
          <input
            type="text"
            value={row.type ?? ""}
            onChange={(e) => handleChange(row.rowId, "type", e.target.value)}
            className={yellowInput}
          />
        </td>
        <td className="border border-black px-1 py-1">
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (!row.inventoryId || !row.maxQuantity) return;
                setSerialModalState({
                  rowId: row.rowId,
                  inventoryId: row.inventoryId,
                  inventoryLabel: row.productName ?? row.maker ?? row.inventoryId,
                  kind: row.kind,
                  maxQuantity: row.maxQuantity,
                  requiredQuantity: row.quantity,
                });
              }}
              disabled={!row.inventoryId}
              className="border border-black bg-slate-100 px-2 py-0.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              選択
            </button>
            {row.inventoryId && (
              <div className="text-[10px] text-neutral-600">
                選択済 {row.selectedSerialIndexes?.length ?? 0}/{row.quantity}
              </div>
            )}
            {row.serialSelectionError && (
              <div className="text-[10px] text-red-600">{row.serialSelectionError}</div>
            )}
          </div>
        </td>
        <td className="border border-black px-1 py-1">
          {row.maxQuantity && row.maxQuantity > 1 ? (
            <select
              value={row.quantity}
              onChange={(e) => handleChange(row.rowId, "quantity", e.target.value)}
              onBlur={(e) => commitNumericField(row.rowId, "quantity", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitNumericField(row.rowId, "quantity", (e.target as HTMLInputElement).value); }}
              className={`${yellowInput} text-right`}
            >
              {Array.from({ length: row.maxQuantity }, (_, i) => i + 1).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              value={row.quantity}
              onChange={(e) => handleChange(row.rowId, "quantity", e.target.value)}
              onBlur={(e) => commitNumericField(row.rowId, "quantity", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitNumericField(row.rowId, "quantity", (e.target as HTMLInputElement).value); }}
              className={`${yellowInput} text-right`}
            />
          )}
        </td>
        <td className="border border-black px-1 py-1">
          <input
            type="text"
            inputMode="numeric"
            value={row.unitPrice}
            onChange={(e) => handleChange(row.rowId, "unitPrice", e.target.value)}
            onBlur={(e) => commitNumericField(row.rowId, "unitPrice", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitNumericField(row.rowId, "unitPrice", (e.target as HTMLInputElement).value); }}
            className={`${yellowInput} text-right`}
          />
        </td>
        <td className="border border-black px-1 py-1 bg-amber-50 text-right font-semibold">
          {moneyDisplay(row.amount)}
        </td>
        <td className="border border-black px-1 py-1">
          <input
            type="text"
            inputMode="numeric"
            value={row.remainingDebt ?? ""}
            onChange={(e) => handleChange(row.rowId, "remainingDebt", e.target.value)}
            onBlur={(e) => commitNumericField(row.rowId, "remainingDebt", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitNumericField(row.rowId, "remainingDebt", (e.target as HTMLInputElement).value); }}
            className={`${yellowInput} text-right`}
          />
        </td>
        <td className="border border-black px-1 py-1">
          <input
            type="text"
            value={row.applicationPrefecture ?? ""}
            onChange={(e) => handleChange(row.rowId, "applicationPrefecture", e.target.value)}
            className={orangeInput}
          />
        </td>
        <td className="border border-black px-1 py-1">
          <input
            type="date"
            value={row.applicationDate ?? ""}
            onChange={(e) => handleChange(row.rowId, "applicationDate", e.target.value)}
            className={`${yellowInput} text-center`}
          />
        </td>
        <td className="border border-black px-1 py-1">
          <input
            type="text"
            value={row.note ?? ""}
            onChange={(e) => handleChange(row.rowId, "note", e.target.value)}
            className={yellowInput}
          />
        </td>
      </tr>
    );
  }, []);

  const handleSubmit = () => {
    if (error) return;
    if (!vendorName) {
      alert("販売先を入力してください");
      return;
    }
    if (existingSalesInvoiceIds.length > 0) {
      alert("作成済みの販売伝票が含まれています。既存伝票を確認してください。");
      return;
    }
    if (rows.length === 0) {
      alert("明細を1行以上入力してください");
      return;
    }
    if (rows.some((row) => !row.quantity || String(row.unitPrice ?? "").trim() === "")) {
      alert("数量と単価を入力してください");
      return;
    }
    const missingSerial = rows.find((row) => row.inventoryId && (row.selectedSerialIndexes?.length ?? 0) !== row.quantity);
    if (missingSerial) {
      alert("番号選択が未完了です。明細の「番号」を確認してください。");
      return;
    }
    if (!window.confirm("よろしいですか？")) return;

    const { inventoryIdMap, soldInventoryIds } = splitInventoryForSales(rows);

    const items: SalesInvoiceItem[] = rows.map((row, index) => ({
      itemId: row.rowId,
      sortOrder: index,
      inventoryId: row.inventoryId ? inventoryIdMap.get(row.inventoryId) ?? row.inventoryId : row.inventoryId,
      maker: row.maker,
      productName: row.productName,
      type: row.type,
      quantity: Number(row.quantity) || 0,
      unitPrice: toNumber(row.unitPrice),
      amount: toNumber(row.quantity) * toNumber(row.unitPrice),
      remainingDebt: row.remainingDebt ? toNumber(row.remainingDebt) : undefined,
      applicationPrefecture: row.applicationPrefecture,
      applicationDate: row.applicationDate,
      note: row.note,
      selectedSerialIndexes: row.selectedSerialIndexes,
      selectedSerialRows:
        row.serialRows && row.selectedSerialIndexes
          ? row.selectedSerialIndexes
              .map((index) => row.serialRows?.[index])
              .filter((serialRow): serialRow is SerialInputRow => Boolean(serialRow))
          : undefined,
    }));

    const invoiceId = generateSalesInvoiceId("vendor");
    addSalesInvoice({
      invoiceId,
      invoiceType: "vendor",
      createdAt: new Date().toISOString(),
      issuedDate,
      vendorName,
      buyerName: vendorName,
      staff,
      manager,
      inventoryIds: soldInventoryIds.length > 0 ? soldInventoryIds : invoiceInventoryIds,
      items,
      subtotal,
      tax,
      insurance: toNumber(insurance),
      totalAmount,
      remarks,
      paymentDueDate: paymentDate,
      invoiceOriginalRequired: invoiceOriginal === "要",
    });
    if (soldInventoryIds.length > 0) {
      updateInventoryStatuses(soldInventoryIds, "sold");
    }

    alert("登録完了");
    router.push("/sales/sales-invoice/list");
  };

  return (
    <div
      className="flex w-full justify-center bg-[#dfe8f5] px-4 py-6 text-[12px] text-neutral-900"
      style={{
        minHeight: "100vh",
        height: "auto",
        overflowX: "auto",
        overflowY: "visible",
        paddingBottom: "80px",
        fontFamily: '"MS UI Gothic", "Yu Gothic", sans-serif',
      }}
    >
      <div className="flex justify-center">
        <div
          className="border-[6px] border-cyan-700 bg-white p-3 shadow-[4px_4px_0_rgba(0,0,0,0.35)]"
          style={{
            width: `${PAPER_WIDTH}px`,
            minHeight: `${PAPER_MIN_HEIGHT}px`,
          }}
        >
          <div className="flex items-center gap-2 text-lg font-bold text-emerald-900">
            <span className="text-green-600">●</span>
            <span>販売伝票登録（業者）</span>
          </div>
          <div className="my-2 border-b border-dashed border-slate-400" />

          {error ? (
            <div className="mb-2 border border-red-600 bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">
              {error} / <button onClick={() => router.back()}>戻る</button>
            </div>
          ) : null}
          {!error && existingSalesInvoiceIds.length > 0 && (
            <div className="mb-2 border-2 border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              作成済みの販売伝票が含まれています。二重作成はできません。
            </div>
          )}

          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 bg-emerald-800" aria-hidden />
            </div>
            <div className="flex flex-1 justify-center">
              <span className="bg-slate-100 px-4 py-1">新規登録</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="border border-amber-700 bg-amber-300 px-3 py-1 shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
              >
                確認
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="border border-neutral-600 bg-neutral-200 px-3 py-1 shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
              >
                戻る
              </button>
            </div>
          </div>

          <div
            className="border-[4px] border-cyan-700 bg-white p-2"
            style={{ minHeight: "696px" }}
          >
            <div className="grid grid-cols-2 gap-2 border-2 border-black bg-white p-2">
              <div className="col-span-2 grid grid-cols-[1.05fr_0.95fr] gap-2 border-b-2 border-black pb-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-end">
                    <div className="flex items-center gap-2 border border-black bg-white px-2 py-1 text-sm font-semibold">
                      <span>日付</span>
                      <input
                        type="date"
                        value={issuedDate}
                        onChange={(e) => setIssuedDate(e.target.value)}
                        className={`${yellowInput} w-36 text-center`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-[#333]">
                      <div className="border-b border-[#333] bg-[#f5f5f5] px-2 py-1 text-[13px] font-semibold">販売先（ホール）</div>
                      <div className="space-y-1 px-2 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-16">ホール名</span>
                          <input
                            type="text"
                            value={vendorName}
                            onChange={(e) => setVendorName(e.target.value)}
                            className={`${hallStyleYellowInput} flex-1`}
                          />
                          <button
                            type="button"
                            className="border border-[#333] bg-[#f3f3f3] px-3 py-1 text-[12px]"
                          >
                            売主検索
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-16">TEL</span>
                          <input
                            type="text"
                            value={vendorTel}
                            onChange={(e) => setVendorTel(e.target.value)}
                            className={`${hallStyleYellowInput} flex-1`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-16">FAX</span>
                          <input
                            type="text"
                            value={vendorFax}
                            onChange={(e) => setVendorFax(e.target.value)}
                            className={`${hallStyleYellowInput} flex-1`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-16">インボイス番号</span>
                          <input
                            type="text"
                            value={vendorInvoiceNumber}
                            onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                            className={`${hallStyleYellowInput} flex-1`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border border-[#333]">
                      <div className="border-b border-[#333] bg-[#f5f5f5] px-2 py-1 text-[13px] font-semibold">
                        【売主】 {sellerDisplay.companyName}
                      </div>
                      <div className="space-y-1 px-2 py-2 text-[12px]">
                        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                          <span className="text-right">郵便番号</span>
                          <input type="text" value={sellerDisplay.postalCode} readOnly className={`${hallStyleGrayInput} w-40`} />
                        </div>
                        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                          <span className="text-right">住所</span>
                          <input type="text" value={sellerDisplay.address} readOnly className={hallStyleGrayInput} />
                        </div>
                        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                          <span className="text-right">会社名</span>
                          <input type="text" value={sellerDisplay.companyName} readOnly className={hallStyleGrayInput} />
                        </div>
                        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                          <span className="text-right">代表者</span>
                          <input type="text" value={sellerDisplay.representative} readOnly className={`${hallStyleGrayInput} w-56`} />
                        </div>
                        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                          <span className="text-right">TEL</span>
                          <input type="text" value={sellerDisplay.tel} readOnly className={`${hallStyleGrayInput} w-44`} />
                          <span className="text-right">FAX</span>
                          <input type="text" value={sellerDisplay.fax} readOnly className={`${hallStyleGrayInput} w-44`} />
                        </div>
                        <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                          <span className="text-right">インボイス番号</span>
                          <input type="text" value={sellerDisplay.invoiceNumber} readOnly className={`${hallStyleGrayInput} w-44`} />
                        </div>
                        <div className="flex items-center justify-between pt-1 text-[13px]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">担当</span>
                            <select
                              value={staff}
                              onChange={(e) => setStaff(e.target.value)}
                              className={`${hallStyleYellowInput} w-28`}
                            >
                              {["デモユーザー", "担当A", "担当B"].map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-right">管理担当</span>
                            <input
                              type="text"
                              value={manager}
                              onChange={(e) => setManager(e.target.value)}
                              className={`${hallStyleYellowInput} w-32`}
                            />
                            <button type="button" className="border border-[#333] bg-[#f3f3f3] px-3 py-1 text-[12px] font-semibold">
                              印
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            <div className="col-span-2 pt-2">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-neutral-800">
                <span>行を追加します</span>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="border border-black bg-amber-200 px-3 py-1 text-sm font-semibold"
                >
                  行追加
                </button>
              </div>
              <div className="overflow-hidden rounded-sm border-2 border-black">
                <table
                  className="w-full table-fixed text-center text-[12px]"
                  style={{ borderCollapse: "collapse" }}
                >
                  <colgroup>
                    <col style={{ width: "4%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "9%" }} />
                  </colgroup>
                  <thead className="bg-slate-100 text-[12px] font-semibold">
                    <tr>
                      <th className="border border-black px-2 py-1" aria-label="並び替え" />
                      <th className="border border-black px-2 py-1">メーカー名</th>
                      <th className="border border-black px-2 py-1">商品名</th>
                      <th className="border border-black px-2 py-1">タイプ</th>
                      <th className="border border-black px-2 py-1">番号</th>
                      <th className="border border-black px-2 py-1">数量</th>
                      <th className="border border-black px-2 py-1">単価</th>
                      <th className="border border-black px-2 py-1">金額</th>
                      <th className="border border-black px-2 py-1">残債</th>
                      <th className="border border-black px-2 py-1">申請適用</th>
                      <th className="border border-black px-2 py-1">申請日</th>
                      <th className="border border-black px-2 py-1">商品補足</th>
                    </tr>
                  </thead>
                  <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                    <SortableContext items={rows.map((row) => row.rowId)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {rows.map((row) => (
                          <SortableRow key={row.rowId} row={row} />
                        ))}
                      </tbody>
                    </SortableContext>
                  </DndContext>
                </table>
              </div>
              <div className="mt-1 text-right text-[11px] text-neutral-600">商品補足（印刷料金で表示されます）</div>
            </div>

            <div className="col-span-2 mt-2 grid grid-cols-[1.05fr_0.95fr] gap-2 text-sm">
              <div className="space-y-2 border border-black p-2">
                <div className="border-b border-black bg-slate-100 px-2 py-1 text-sm font-semibold">
                  備考（印刷料金で表示されます）
                </div>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={`${yellowInput} h-[64px] w-full resize-none border-0 bg-amber-50`}
                />
              </div>

              <div className="space-y-2">
                <div className="border border-black">
                  <div className="border-b border-black bg-slate-100 px-2 py-1 text-sm font-semibold">金額集計</div>
                  <div className="space-y-2 px-3 py-2 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span>小計</span>
                      <span className="border border-black bg-white px-2 py-1 text-right font-semibold">{moneyDisplay(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>消費税（10%）</span>
                      <span className="border border-black bg-white px-2 py-1 text-right font-semibold">{moneyDisplay(tax)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>運送保険（税込）</span>
                      <input
                        type="number"
                        value={insurance}
                        onChange={(e) => setInsurance(e.target.value)}
                        className={`${yellowInput} w-28 text-right`}
                      />
                    </div>
                    <div className="flex items-center justify-between border-t border-black pt-2 text-base font-bold">
                      <span>合計金額</span>
                      <span className="border border-black bg-amber-50 px-2 py-1">{moneyDisplay(totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-black">
                  <div className="flex items-stretch divide-x divide-black border-b border-black bg-slate-100 text-sm font-semibold">
                    <div className="flex-1 px-2 py-1">お振込先</div>
                    <div className="w-[150px] px-2 py-1">支払期日</div>
                    <div className="w-[120px] px-2 py-1">請求書原本</div>
                  </div>
                  <div className="flex divide-x divide-black text-[12px] leading-tight">
                    <div className="flex-1 bg-white px-2 py-2">{bankNote}</div>
                    <div className="flex w-[150px] items-center justify-center px-2 py-2">
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className={`${yellowInput} w-full text-center`}
                      />
                    </div>
                    <div className="flex w-[120px] items-center justify-center px-2 py-2">
                      <select
                        value={invoiceOriginal}
                        onChange={(e) => setInvoiceOriginal(e.target.value)}
                        className={`${orangeInput} w-full`}
                      >
                        <option value="要">要</option>
                        <option value="不要">不要</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2 mt-2 grid grid-cols-2 gap-2">
              <div className="space-y-2 border-2 border-black bg-white p-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="border border-black bg-slate-100 px-2 py-1">配送 / 引渡し</span>
                </div>
                <div className="grid gap-1.5 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="w-24 border border-black bg-slate-100 px-2 py-1 text-left font-semibold">保管先</span>
                    <span className="flex-1 border border-black px-2 py-1">{deliveryAddress}</span>
                  </div>
                  <div className="rounded-sm border border-black bg-orange-100 px-2 py-1.5">
                    <div className="text-sm font-semibold">商品配送先</div>
                    <div className="mt-1 grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2">
                      <select
                        value={deliveryMethod}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className={`${orangeInput} w-full`}
                      >
                        <option value="持参">持参</option>
                        <option value="配送">配送</option>
                      </select>
                      <span className="text-right">直送日</span>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className={`${yellowInput} w-32 text-center`}
                      />
                      <select
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className={`${yellowInput} w-16`}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <span className="text-xs">&nbsp;</span>
                    </div>
                  </div>
                  <div className="rounded-sm border border-black bg-orange-100 px-2 py-1.5">
                    <div className="text-sm font-semibold">売契→先</div>
                    <div className="mt-1 grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2">
                      <select
                        value={tradeMethod}
                        onChange={(e) => setTradeMethod(e.target.value)}
                        className={`${orangeInput} w-full`}
                      >
                        <option value="直送">直送</option>
                        <option value="--">--</option>
                      </select>
                      <span className="text-right">直送日</span>
                      <input
                        type="date"
                        value={tradeDate}
                        onChange={(e) => setTradeDate(e.target.value)}
                        className={`${yellowInput} w-32 text-center`}
                      />
                      <select
                        value={tradeTime}
                        onChange={(e) => setTradeTime(e.target.value)}
                        className={`${yellowInput} w-16`}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                      <span className="text-xs">&nbsp;</span>
                    </div>
                  </div>
                  <div className="h-6 border border-dashed border-black bg-white" />
                </div>
              </div>

              <div className="border-2 border-black bg-white">
                <div className="flex items-center justify-between border-b-2 border-black bg-slate-100 px-3 py-1.5 text-sm font-semibold">
                  <span>買主様 捺印欄</span>
                  <span className="border border-black px-3 py-0.5">印</span>
                </div>
                <div className="space-y-1.5 px-3 py-2 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="w-20">住所</span>
                    <span className="flex-1 border border-black px-2 py-1">{tradeAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20">会社名</span>
                    <span className="flex-1 border border-black px-2 py-1">{vendorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20">電話番号</span>
                    <span className="flex-1 border border-black px-2 py-1">{vendorTel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20">FAX番号</span>
                    <span className="flex-1 border border-black px-2 py-1">{vendorFax}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20">インボイス番号</span>
                    <span className="flex-1 border border-black px-2 py-1">{vendorInvoiceNumber || "―"}</span>
                  </div>
                </div>
                <div className="border-t-2 border-black bg-white px-3 py-2 text-[12px] leading-snug">
                  <div className="font-semibold text-red-700">リアルタイムの在庫確認ができます</div>
                  <div>URL: {noteUrl}</div>
                  <div>Email: {noteMail}</div>
                  <div>FAX: {vendorFax}</div>
                  <div>インボイス番号: {vendorInvoiceNumber || "―"}</div>
                  <div className="mt-1 text-center text-lg text-slate-600">↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {serialModalState && (
        <SalesInvoiceSerialModal
          open={Boolean(serialModalState)}
          inventoryId={serialModalState.inventoryId}
          inventoryLabel={serialModalState.inventoryLabel}
          kind={serialModalState.kind}
          availableQuantity={serialModalState.maxQuantity}
          requiredQuantity={serialModalState.requiredQuantity}
          selectedIndexes={rows.find((row) => row.rowId === serialModalState.rowId)?.selectedSerialIndexes ?? []}
          onClose={() => setSerialModalState(null)}
          onConfirm={({ selectedIndexes, rows: serialRows }) => {
            setRows((prev) =>
              prev.map((row) =>
                row.rowId === serialModalState.rowId
                  ? {
                      ...row,
                      selectedSerialIndexes: selectedIndexes,
                      serialRows: serialRows,
                      serialSelectionError: "",
                    }
                  : row,
              ),
            );
            setSerialModalState(null);
          }}
        />
      )}
    </div>
  </div>
  );
}
