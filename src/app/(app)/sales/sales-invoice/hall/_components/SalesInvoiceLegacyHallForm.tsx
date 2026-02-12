"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { updateInventoryStatuses, type InventoryRecord } from "@/lib/demo-data/demoInventory";
import { splitInventoryForSales } from "@/lib/inventory/salesInvoiceSplit";
import { loadSalesInvoices } from "@/lib/demo-data/salesInvoices";
import { addSalesInvoice, generateSalesInvoiceId } from "@/lib/demo-data/salesInvoices";
import { SalesInvoiceSerialModal } from "@/components/inventory/SalesInvoiceSerialModal";
import {
  DEFAULT_MASTER_DATA,
  loadMasterData,
  type CompanyProfile,
  type MasterData,
} from "@/lib/demo-data/demoMasterData";
import type { SerialInputRow } from "@/lib/serialInputStorage";
import type { SalesInvoiceItem } from "@/types/salesInvoices";

const yellowInput =
  "w-full bg-[#fff6cc] border border-[#333] px-2 py-[6px] text-[13px] leading-tight focus:outline-none";

const grayInput =
  "w-full bg-[#f4f0e6] border border-[#333] px-2 py-[6px] text-[13px] leading-tight focus:outline-none";

const toDateInputValue = (value?: string) => {
  if (value) return value;
  return new Date().toISOString().slice(0, 10);
};

const toNumber = (value: string | number | undefined) => {
  const normalized = typeof value === "string" ? value.replace(/,/g, "").trim() : value;
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
};

export function SalesInvoiceLegacyHallForm({ inventories }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<BaseRow[]>([]);
  const [masterData, setMasterData] = useState<MasterData>(DEFAULT_MASTER_DATA);
  const [sellerProfile, setSellerProfile] = useState<CompanyProfile | null>(null);
  const [hallName, setHallName] = useState("ダミーホール");
  const [hallTel, setHallTel] = useState("03-0000-0000");
  const [hallFax, setHallFax] = useState("03-0000-0001");
  const [hallInvoiceNumber, setHallInvoiceNumber] = useState("");
  const [issuedDate, setIssuedDate] = useState(toDateInputValue());
  const [staff, setStaff] = useState("デモユーザー");
  const [manager, setManager] = useState("担当者A");
  const [subtotal, setSubtotal] = useState(0);
  const [insurance, setInsurance] = useState("");
  const [bankNote, setBankNote] = useState("三井住友銀行 渋谷支店 普通 1234567 株式会社ピーコム");
  const [paymentMethod, setPaymentMethod] = useState("口座振込");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [introductionStore, setIntroductionStore] = useState("-");
  const [installationDate, setInstallationDate] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [documentArrivalDate, setDocumentArrivalDate] = useState("");
  const [storageLocation, setStorageLocation] = useState("倉庫A");
  const [remarks, setRemarks] = useState("特記事項があれば入力してください");
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

  useEffect(() => {
    const data = loadMasterData();
    setMasterData(data);
    const primaryProfile =
      data.companyProfiles?.find((profile) => profile.isPrimary) ?? data.companyProfiles?.[0] ?? data.companyProfile;
    setSellerProfile(primaryProfile ?? null);
  }, []);

  const buildRowsFromInventory = useCallback((items: InventoryRecord[] | undefined) => {
    if (!items || items.length === 0) return [] as BaseRow[];
    return items.map<BaseRow>((item) => {
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
        applicationPrefecture: item.customFields?.applicationPrefecture ?? "",
        applicationDate: item.customFields?.applicationDate ?? "",
        note: item.note ?? item.notes ?? item.customFields?.note ?? "",
        selectedSerialIndexes: [],
        serialRows: [],
      };
    });
  }, []);

  const resetForm = useCallback(() => {
    const mapped = buildRowsFromInventory(inventories);
    setRows(
      mapped.length > 0
        ? mapped
        : [{ rowId: buildRowId(), quantity: 1, unitPrice: "", amount: 0, remainingDebt: "" }],
    );
    const defaultHallName =
      inventories?.[0]?.supplierCorporate ?? inventories?.[0]?.supplier ?? "ダミーホール";
    setHallName(defaultHallName);
    const supplier = masterData.suppliers.find((entry) => entry.corporateName === defaultHallName);
    const branchName = inventories?.[0]?.supplierBranch ?? "";
    const branch = supplier?.branches.find((entry) => entry.name === branchName) ?? supplier?.branches[0];
    setHallTel(branch?.phone || supplier?.phone || "03-0000-0000");
    setHallFax(branch?.fax || supplier?.fax || "03-0000-0001");
    setHallInvoiceNumber(supplier?.invoiceNumber ?? "");
    setIssuedDate(toDateInputValue());
    setStaff("デモユーザー");
    setManager("担当者A");
    setSubtotal(0);
    setInsurance("");
    setBankNote("三井住友銀行 渋谷支店 普通 1234567 株式会社ピーコム");
    setPaymentMethod("口座振込");
    setPaymentDate("");
    setPaymentAmount("");
    setStartDate("");
    setIntroductionStore("-");
    setInstallationDate("");
    setOpeningDate("");
    setDocumentArrivalDate("");
    setStorageLocation("倉庫A");
    setRemarks("特記事項があれば入力してください");
  }, [buildRowsFromInventory, inventories, masterData.suppliers]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    const total = rows.reduce((sum, row) => sum + toNumber(row.quantity) * toNumber(row.unitPrice), 0);
    setSubtotal(total);
  }, [rows]);

  const sellerDisplay = useMemo(() => {
    const profile = sellerProfile;
    const address = [profile?.prefecture, profile?.city, profile?.addressLine2 ?? profile?.addressLine]
      .filter(Boolean)
      .join("");
    return {
      postalCode: profile?.postalCode || "150-0031",
      address: address || "東京都渋谷区桜丘町26-1 セルリアンタワー15F",
      companyName: profile?.corporateName || "株式会社ピーコム",
      representative: profile?.representative || "代表取締役 A",
      tel: profile?.phone || "03-1234-5678",
      fax: profile?.fax || "03-1234-5679",
      invoiceNumber: profile?.invoiceNumber || "―",
    };
  }, [sellerProfile]);

  const tax = useMemo(() => Math.floor(subtotal * 0.1), [subtotal]);
  const totalAmount = useMemo(() => subtotal + tax + toNumber(insurance), [subtotal, tax, insurance]);
  const existingSalesInvoiceIds = useMemo(() => {
    if (!inventories || inventories.length === 0) return [] as string[];
    const targetIds = new Set(inventories.map((item) => item.id));
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
  }, [inventories]);

  const handleChange = (rowId: string, key: keyof Omit<BaseRow, "rowId">, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
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
      }),
    );
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

  const handleSubmit = () => {
    if (!hallName) {
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

    const memoLines = [
      remarks,
      paymentMethod ? `支払方法: ${paymentMethod}` : undefined,
      paymentDate ? `支払日: ${paymentDate}` : undefined,
      paymentAmount ? `支払金額: ${toNumber(paymentAmount).toLocaleString("ja-JP")}` : undefined,
      startDate ? `開始日: ${startDate}` : undefined,
      introductionStore ? `導入店舗: ${introductionStore}` : undefined,
      installationDate ? `設置日: ${installationDate}` : undefined,
      openingDate ? `開店日: ${openingDate}` : undefined,
      documentArrivalDate ? `書類着日: ${documentArrivalDate}` : undefined,
      storageLocation ? `保管先: ${storageLocation}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    const invoiceId = generateSalesInvoiceId("hall");
    addSalesInvoice({
      invoiceId,
      invoiceType: "hall",
      createdAt: new Date().toISOString(),
      issuedDate,
      vendorName: hallName,
      buyerName: "株式会社ピーコム",
      staff,
      manager,
      inventoryIds: soldInventoryIds.length > 0 ? soldInventoryIds : inventories?.map((item) => item.id) ?? [],
      items,
      subtotal,
      tax,
      insurance: toNumber(insurance),
      totalAmount,
      paymentMethod,
      paymentDate,
      paymentAmount: paymentAmount ? toNumber(paymentAmount) : undefined,
      introductionStore,
      installationDate,
      openingDate,
      documentArrivalDate,
      storageLocation,
      remarks: memoLines,
    });
    const invoiceInventoryIds = rows
      .map((row) => row.inventoryId)
      .filter((id): id is string => Boolean(id));
    if (soldInventoryIds.length > 0) {
      updateInventoryStatuses(soldInventoryIds, "sold");
    }

    alert("登録完了");
    router.push("/sales/sales-invoice/list");
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

  const SortableRow = ({ row }: { row: BaseRow }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: row.rowId,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <tr ref={setNodeRef} style={style} className={`bg-white ${isDragging ? "opacity-70" : ""}`}>
        <td className="border border-[#333] px-1 py-1 text-center">
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
        <td className="border border-[#333] px-1 py-1">
          <input
            type="text"
            value={row.maker ?? ""}
            onChange={(e) => handleChange(row.rowId, "maker", e.target.value)}
            className={yellowInput}
          />
        </td>
        <td className="border border-[#333] px-1 py-1">
          <div className="flex items-center">
            <input
              type="text"
              value={row.productName ?? ""}
              onChange={(e) => handleChange(row.rowId, "productName", e.target.value)}
              className={`${yellowInput} flex-1`}
            />
            <span className="border border-[#333] bg-[#f3f3f3] px-2 py-1 text-xs">▼</span>
          </div>
        </td>
        <td className="border border-[#333] px-1 py-1">
          <input
            type="text"
            value={row.type ?? ""}
            onChange={(e) => handleChange(row.rowId, "type", e.target.value)}
            className={yellowInput}
          />
        </td>
        <td className="border border-[#333] px-1 py-1">
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
              className="border border-[#333] bg-[#f3f3f3] px-3 py-1 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
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
        <td className="border border-[#333] px-1 py-1">
          {row.maxQuantity && row.maxQuantity > 1 ? (
            <select
              value={row.quantity}
              onChange={(e) => handleChange(row.rowId, "quantity", e.target.value)}
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
              className={`${yellowInput} text-right`}
            />
          )}
        </td>
        <td className="border border-[#333] px-1 py-1">
          <input
            type="number"
            value={row.unitPrice}
            onChange={(e) => handleChange(row.rowId, "unitPrice", e.target.value)}
            className={`${yellowInput} text-right`}
          />
        </td>
        <td className="border border-[#333] px-1 py-1 bg-[#fff6cc] text-right font-semibold">
          {moneyDisplay(row.amount)}
        </td>
        <td className="border border-[#333] px-1 py-1">
          <input
            type="number"
            value={row.remainingDebt ?? ""}
            onChange={(e) => handleChange(row.rowId, "remainingDebt", e.target.value)}
            className={`${yellowInput} text-right`}
          />
        </td>
        <td className="border border-[#333] px-1 py-1">
          <input
            type="text"
            value={row.applicationPrefecture ?? ""}
            onChange={(e) => handleChange(row.rowId, "applicationPrefecture", e.target.value)}
            className={yellowInput}
          />
        </td>
        <td className="border border-[#333] px-1 py-1">
          <input
            type="date"
            value={row.applicationDate ?? ""}
            onChange={(e) => handleChange(row.rowId, "applicationDate", e.target.value)}
            className={`${yellowInput} text-center`}
          />
        </td>
        <td className="border border-[#333] px-1 py-1">
          <input
            type="text"
            value={row.note ?? ""}
            onChange={(e) => handleChange(row.rowId, "note", e.target.value)}
            className={yellowInput}
          />
        </td>
      </tr>
    );
  };

  return (
    <div className="flex justify-center bg-[#e5e5e5] py-4 text-[13px] text-[#222]">
      <div className="w-[1200px] border-[1.5px] border-[#333] bg-white px-4 py-3">
        {existingSalesInvoiceIds.length > 0 && (
          <div className="mb-3 border-2 border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            作成済みの販売伝票が含まれています。二重作成はできません。
          </div>
        )}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[14px] font-bold text-[#0f5132]">
            <span className="inline-block h-3.5 w-3.5 rounded-full bg-green-600" aria-hidden />
            <span>販売伝票登録（ホール）</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <span>日付</span>
            <input
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
              className={`${yellowInput} w-[140px] text-center`}
            />
          </div>
        </div>

        <div className="border border-[#333] px-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#333]">
              <div className="border-b border-[#333] bg-[#f5f5f5] px-2 py-1 text-[13px] font-semibold">販売先（ホール）</div>
              <div className="space-y-1 px-2 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-16">ホール名</span>
                  <input
                    type="text"
                    value={hallName}
                    onChange={(e) => setHallName(e.target.value)}
                    className={`${yellowInput} flex-1`}
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
                    value={hallTel}
                    onChange={(e) => setHallTel(e.target.value)}
                    className={`${yellowInput} flex-1`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16">FAX</span>
                  <input
                    type="text"
                    value={hallFax}
                    onChange={(e) => setHallFax(e.target.value)}
                    className={`${yellowInput} flex-1`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16">インボイス番号</span>
                  <input
                    type="text"
                    value={hallInvoiceNumber}
                    onChange={(e) => setHallInvoiceNumber(e.target.value)}
                    className={`${yellowInput} flex-1`}
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
                  <input type="text" value={sellerDisplay.postalCode} readOnly className={`${grayInput} w-40`} />
                </div>
                <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                  <span className="text-right">住所</span>
                  <input type="text" value={sellerDisplay.address} readOnly className={grayInput} />
                </div>
                <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                  <span className="text-right">会社名</span>
                  <input type="text" value={sellerDisplay.companyName} readOnly className={grayInput} />
                </div>
                <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                  <span className="text-right">代表者</span>
                  <input type="text" value={sellerDisplay.representative} readOnly className={`${grayInput} w-56`} />
                </div>
                <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                  <span className="text-right">TEL</span>
                  <input type="text" value={sellerDisplay.tel} readOnly className={`${grayInput} w-44`} />
                  <span className="text-right">FAX</span>
                  <input type="text" value={sellerDisplay.fax} readOnly className={`${grayInput} w-44`} />
                </div>
                <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                  <span className="text-right">インボイス番号</span>
                  <input type="text" value={sellerDisplay.invoiceNumber} readOnly className={`${grayInput} w-44`} />
                </div>
                <div className="flex items-center justify-between pt-1 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">担当</span>
                    <select
                      value={staff}
                      onChange={(e) => setStaff(e.target.value)}
                      className={`${yellowInput} w-28`}
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
                      className={`${yellowInput} w-32`}
                    />
                    <button type="button" className="border border-[#333] bg-[#f3f3f3] px-3 py-1 text-[12px] font-semibold">
                      印
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-right text-[12px] text-neutral-700">行を追加します →</div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-[#333] text-center text-[12px]">
              <thead className="bg-[#efefef] text-[12px] font-semibold">
                <tr>
                  <th className="border border-[#333] px-2 py-2" aria-label="並び替え" />
                  <th className="border border-[#333] px-2 py-2">メーカー名</th>
                  <th className="border border-[#333] px-2 py-2">商品名</th>
                  <th className="border border-[#333] px-2 py-2">タイプ</th>
                  <th className="border border-[#333] px-2 py-2">番号</th>
                  <th className="border border-[#333] px-2 py-2">数量</th>
                  <th className="border border-[#333] px-2 py-2">単価</th>
                  <th className="border border-[#333] px-2 py-2">金額</th>
                  <th className="border border-[#333] px-2 py-2">残債</th>
                  <th className="border border-[#333] px-2 py-2">申請適用</th>
                  <th className="border border-[#333] px-2 py-2">申請日</th>
                  <th className="border border-[#333] px-2 py-2">商品補足</th>
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
            <div className="mt-1 flex justify-end">
              <button
                type="button"
                onClick={handleAddRow}
                className="border border-[#333] bg-[#f7e6a3] px-3 py-1 text-[12px] font-semibold"
              >
                行追加
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[7fr_5fr] gap-3 text-[13px]">
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_200px] gap-2 border border-[#333] p-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-24 font-semibold">小計</span>
                    <span className="border border-[#333] bg-white px-2 py-1 text-right font-bold">{moneyDisplay(subtotal)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-24 font-semibold">消費税(10%)</span>
                    <span className="border border-[#333] bg-white px-2 py-1 text-right font-bold">{moneyDisplay(tax)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-24 font-semibold">運送保険(税込)</span>
                    <input
                      type="number"
                      value={insurance}
                      onChange={(e) => setInsurance(e.target.value)}
                      className={`${yellowInput} w-36 text-right`}
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center border border-[#333] bg-[#fff6cc] px-3 py-2 text-center text-lg font-bold">
                  <div>合計金額</div>
                  <div>{moneyDisplay(totalAmount)}</div>
                </div>
              </div>

              <div className="border border-[#333] p-2">
                <div className="font-semibold">お振込先</div>
                <textarea
                  value={bankNote}
                  onChange={(e) => setBankNote(e.target.value)}
                  className={`${yellowInput} mt-1 h-16 resize-none`}
                />
                <div className="mt-2 grid grid-cols-[1fr_1fr] gap-2 text-[12px]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-24">支払方法</span>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={`${yellowInput} w-36`}
                      >
                        <option value="口座振込">口座振込</option>
                        <option value="現金">現金</option>
                        <option value="小切手">小切手</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-24">支払日</span>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className={`${yellowInput} w-36 text-center`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-24">支払金額</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className={`${yellowInput} w-40 text-right`}
                    />
                    <span className="border border-[#333] px-3 py-1">円</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="border border-[#333] bg-[#fff6cc] p-2">
                <div className="mb-2 text-sm font-semibold">導入・設置情報</div>
                <div className="space-y-2 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="w-24">導入店舗名</span>
                    <input
                      type="text"
                      value={introductionStore}
                      onChange={(e) => setIntroductionStore(e.target.value)}
                      className={`${yellowInput} flex-1`}
                    />
                    <button type="button" className="border border-[#333] bg-[#f3f3f3] px-3 py-1 text-[12px]">
                      導入店舗検索
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-24">機械納品日</span>
                    <input
                      type="date"
                      value={installationDate}
                      onChange={(e) => setInstallationDate(e.target.value)}
                      className={`${yellowInput} w-36 text-center`}
                    />
                    <span className="w-20 text-right">設置日</span>
                    <input
                      type="date"
                      value={openingDate}
                      onChange={(e) => setOpeningDate(e.target.value)}
                      className={`${yellowInput} w-36 text-center`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-24">請求書発行日</span>
                    <input
                      type="date"
                      value={documentArrivalDate}
                      onChange={(e) => setDocumentArrivalDate(e.target.value)}
                      className={`${yellowInput} w-36 text-center`}
                    />
                    <span className="w-20 text-right">開始日</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`${yellowInput} w-36 text-center`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-24">残債</span>
                    <span className="border border-[#333] bg-white px-2 py-1 text-right font-semibold">
                      {moneyDisplay(toNumber(rows[0]?.remainingDebt))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-[#333] bg-white p-2 text-[12px] leading-relaxed">
                <div className="mb-1 text-sm font-semibold">社内メモ</div>
                <div className="space-y-1">
                  <div>・販売管理台帳に貼付</div>
                  <div>・社内FAX配信済み</div>
                  <div>・控えは担当者が保管</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[9fr_3fr] gap-3">
            <div className="border border-[#333]">
              <div className="bg-[#f5f5f5] px-2 py-1 text-[13px] font-semibold">備考</div>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={`${yellowInput} h-24 w-full resize-none border-0 bg-[#fff6cc] px-3 py-2`}
              />
            </div>
            <div className="border border-[#333] p-2 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="w-16">保管先</span>
                <input
                  type="text"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className={`${yellowInput} w-full`}
                />
              </div>
              <div className="mt-2 rounded border border-dashed border-gray-500 bg-[#f5f5f5] px-2 py-3 text-center text-[12px] text-gray-700">
                ホール控え・社内控えを所定の場所へ保管してください。
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="border border-[#b58500] bg-[#f2d14b] px-8 py-2 text-sm font-bold"
            >
              確認
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="border border-[#555] bg-[#ddd] px-8 py-2 text-sm font-semibold"
            >
              戻る
            </button>
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
  );
}
