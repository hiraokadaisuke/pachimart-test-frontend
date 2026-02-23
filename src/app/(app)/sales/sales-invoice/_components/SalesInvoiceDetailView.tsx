"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  formatCurrency,
  generateInventoryId,
  loadInventoryRecords,
  saveInventoryRecords,
} from "@/lib/demo-data/demoInventory";
import { BUYER_OPTIONS, findBuyerById, type BuyerInfo } from "@/lib/demo-data/buyers";
import { loadMasterData } from "@/lib/demo-data/demoMasterData";
import { loadAllSalesInvoices, upsertSalesInvoices } from "@/lib/demo-data/salesInvoices";
import { loadSalesInvoiceGroups } from "@/lib/demo-data/salesInvoiceGroups";
import {
  loadSerialDraft,
  loadSerialInput,
  saveSerialInput,
  saveSerialRows,
  type SerialInputRow,
} from "@/lib/serialInputStorage";
import type { InventoryRecord } from "@/lib/demo-data/demoInventory";
import type { SalesInvoice, SalesInvoiceGroup } from "@/types/salesInvoices";
import { PrintMenu } from "@/app/(app)/sales/_components/PrintMenu";

const COMPANY_INFO = {
  name: "p-kanriclub",
  address: "〒169-0075 東京都新宿区高田馬場4-4-17",
  tel: "TEL 03-5389-1955",
  fax: "FAX 03-5389-1956",
  postal: "〒169-0075",
  url: "https://p-kanriclub.jp/",
  mail: "info@p-kanriclub.jp",
};

const PRINT_ACTIONS = [
  { label: "売買契約書", path: "sales-contract", requiresSerial: false },
  { label: "請求書", path: "invoice", requiresSerial: false },
  { label: "発送依頼書", path: "shipping-request", requiresSerial: true },
  { label: "書類一括", path: "bundle", requiresSerial: true },
] as const;

const CONTRACT_COPY_OPTIONS = [
  { value: "both", label: "両方確認" },
  { value: "seller", label: "売主控え確認" },
  { value: "buyer", label: "買主控え確認" },
] as const;

type ContractCopyOption = (typeof CONTRACT_COPY_OPTIONS)[number]["value"];

const REQUIRED_SERIAL_FIELDS: Array<keyof SerialInputRow> = ["board", "frame", "main"];

type CancelUnitRow = {
  id: string;
  invoiceId: string;
  itemKey: string;
  inventoryId?: string;
  inventoryLabel: string;
  unitIndex: number;
  serialRow: SerialInputRow;
  maker?: string;
  productName?: string;
  type?: string;
  unitPrice?: number;
};

type Props = {
  invoiceId: string;
  title: string;
  expectedType?: SalesInvoice["invoiceType"];
};

const formatFullDate = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}年${month}月${day}日`;
};

const formatMonthDay = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${month}月${day}日`;
};

const formatNumber = (value?: number): string => {
  if (value == null || Number.isNaN(value)) return "―";
  return value.toLocaleString("ja-JP");
};

const formatYen = (value?: number): string => {
  if (value == null || Number.isNaN(value)) return "―";
  return `${value.toLocaleString("ja-JP")}円`;
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

const resolveCommonValue = (values: Array<string | undefined>): string | undefined => {
  const filtered = values.filter((value) => value && value.trim() !== "");
  if (filtered.length === 0) return undefined;
  const [first] = filtered;
  if (filtered.every((value) => value === first)) return first;
  return undefined;
};

const createEmptySerialRow = (index: number): SerialInputRow => ({
  p: index + 1,
  board: "",
  frame: "",
  main: "",
  removalDate: "",
});

const appendCancelMemo = (memo: string | undefined, invoiceId: string) => {
  const base = memo?.trim() ?? "";
  const tag = `売却取り消し台（伝票ID: ${invoiceId}）`;
  return base ? `${base}\n${tag}` : tag;
};

const buildMergedInvoice = (invoices: SalesInvoice[], groupName: string, groupId: string, groupTransferDate?: string) => {
  if (invoices.length === 0) return null;
  const items = invoices.flatMap((entry) => entry.items ?? []);
  const subtotal = invoices.reduce((sum, entry) => sum + resolveInvoiceSubtotal(entry), 0);
  const tax = invoices.reduce((sum, entry) => sum + resolveInvoiceTax(entry), 0);
  const insurance = invoices.reduce((sum, entry) => sum + Number(entry.insurance || 0), 0);
  const totalAmount = invoices.reduce((sum, entry) => sum + resolveInvoiceTotal(entry), 0);
  const issuedDates = invoices.map((entry) => entry.issuedDate || entry.createdAt).filter(Boolean);
  const issuedDate = issuedDates.sort()[0];
  const invoiceTypes = Array.from(new Set(invoices.map((entry) => entry.invoiceType)));
  const invoiceType = invoiceTypes[0] ?? "vendor";

  return {
    invoiceId: groupId,
    invoiceType,
    createdAt: invoices[0]?.createdAt ?? new Date().toISOString(),
    issuedDate,
    vendorName: groupName,
    staff: resolveCommonValue(invoices.map((entry) => entry.staff)) ?? "―",
    manager: resolveCommonValue(invoices.map((entry) => entry.manager)) ?? "―",
    transferDate: groupTransferDate ?? resolveCommonValue(invoices.map((entry) => entry.transferDate)),
    items,
    subtotal,
    tax,
    insurance,
    totalAmount,
    remarks: resolveCommonValue(invoices.map((entry) => entry.remarks)) ?? "",
  };
};

export function SalesInvoiceDetailView({ invoiceId, title, expectedType }: Props) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [invoiceGroup, setInvoiceGroup] = useState<SalesInvoiceGroup | null>(null);
  const [inventories, setInventories] = useState<Map<string, InventoryRecord>>(new Map());
  const [attemptedLoad, setAttemptedLoad] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedCancelRows, setSelectedCancelRows] = useState<Set<string>>(new Set());
  const [selectedPrintLabel, setSelectedPrintLabel] = useState<string | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string>(BUYER_OPTIONS[0].id);
  const [selectedContractCopy, setSelectedContractCopy] = useState<ContractCopyOption>("both");
  const [refreshToken, setRefreshToken] = useState(0);
  const masterData = useMemo(() => loadMasterData(), []);

  useEffect(() => {
    const invoices = loadAllSalesInvoices();
    const groups = loadSalesInvoiceGroups();
    const group = groups.find((entry) => entry.id === invoiceId);
    if (group) {
      const grouped = group.invoiceIds
        .map((id) => invoices.find((entry) => entry.invoiceId === id))
        .filter((entry): entry is SalesInvoice => Boolean(entry));
      const merged = buildMergedInvoice(grouped, group.salesToName, group.id, group.transferDate);
      setInvoice(merged);
      setInvoiceGroup(group);
      setAttemptedLoad(true);
      return;
    }
    const target = invoices.find((entry) => entry.invoiceId === invoiceId);
    setInvoice(target ?? null);
    setInvoiceGroup(null);
    setAttemptedLoad(true);
  }, [invoiceId, refreshToken]);

  useEffect(() => {
    setIsPrintModalOpen(false);
    setSelectedPrintLabel(null);
    setSelectedSellerId(BUYER_OPTIONS[0].id);
    setSelectedContractCopy("both");
  }, [invoiceId]);

  useEffect(() => {
    if (!isCancelModalOpen) return;
    setSelectedCancelRows(new Set());
  }, [isCancelModalOpen]);

  useEffect(() => {
    const records = loadInventoryRecords();
    setInventories(new Map(records.map((record) => [record.id, record])));
  }, []);

  const items = useMemo(() => invoice?.items ?? [], [invoice]);
  const invoiceInventoryIds = useMemo(() => {
    if (!invoice) return [] as string[];
    if (invoice.inventoryIds && invoice.inventoryIds.length > 0) return invoice.inventoryIds;
    const ids = (invoice.items ?? [])
      .map((item) => item.inventoryId)
      .filter((id): id is string => Boolean(id));
    return ids;
  }, [invoice]);

  const serialStatus = useMemo(() => {
    void refreshToken;
    if (invoiceInventoryIds.length === 0) {
      return { allComplete: true, filledCount: 0, totalCount: 0 };
    }
    let filledCount = 0;
    let totalCount = 0;
    let allComplete = true;
    invoiceInventoryIds.forEach((id) => {
      const inventory = inventories.get(id);
      const targetQuantity = Number(inventory?.quantity ?? 1) || 1;
      totalCount += targetQuantity;
      const stored = loadSerialInput(id) ?? loadSerialDraft(id);
      const rows = stored?.rows ?? [];
      const slice = rows.slice(0, targetQuantity);
      const completeCount = slice.filter((row) =>
        REQUIRED_SERIAL_FIELDS.every((key) => String(row[key] ?? "").trim() !== ""),
      ).length;
      filledCount += completeCount;
      if (completeCount < targetQuantity) {
        allComplete = false;
      }
    });
    return { allComplete, filledCount, totalCount };
  }, [invoiceInventoryIds, inventories, refreshToken]);

  const sourceInvoices = useMemo(() => {
    void refreshToken;
    const all = loadAllSalesInvoices();
    if (invoiceGroup) {
      return invoiceGroup.invoiceIds
        .map((id) => all.find((entry) => entry.invoiceId === id))
        .filter((entry): entry is SalesInvoice => Boolean(entry));
    }
    const target = all.find((entry) => entry.invoiceId === invoiceId);
    if (target) return [target];
    return invoice ? [invoice] : [];
  }, [invoiceGroup, invoiceId, invoice, refreshToken]);

  const { cancelRows, serialRowsMap } = useMemo(() => {
    void refreshToken;
    const rows: CancelUnitRow[] = [];
    const serialMap = new Map<string, SerialInputRow[]>();
    sourceInvoices.forEach((source) => {
      (source.items ?? []).forEach((item, itemIndex) => {
        const quantity = Number(item.quantity) || 0;
        if (quantity <= 0) return;
        const inventoryId = item.inventoryId;
        const itemKey = inventoryId ?? `${source.invoiceId}-item-${itemIndex}`;
        const inventoryLabel = item.productName || item.maker || "―";
        let resolvedRows: SerialInputRow[] = [];
        if (inventoryId) {
          const stored = loadSerialInput(inventoryId) ?? loadSerialDraft(inventoryId);
          const storedRows = stored?.rows ?? [];
          resolvedRows = Array.from({ length: quantity }, (_, index) => {
            const existing = storedRows[index];
            return existing ? { ...existing, p: index + 1 } : createEmptySerialRow(index);
          });
          serialMap.set(inventoryId, resolvedRows);
        } else {
          resolvedRows = Array.from({ length: quantity }, (_, index) => createEmptySerialRow(index));
        }
        resolvedRows.forEach((serialRow, unitIndex) => {
          rows.push({
            id: `${source.invoiceId}-${itemKey}-${unitIndex}`,
            invoiceId: source.invoiceId,
            itemKey,
            inventoryId,
            inventoryLabel,
            unitIndex,
            serialRow,
            maker: item.maker,
            productName: item.productName,
            type: item.type,
            unitPrice: item.unitPrice,
          });
        });
      });
    });
    return { cancelRows: rows, serialRowsMap: serialMap };
  }, [sourceInvoices, refreshToken]);

  const primaryInventory = useMemo(() => {
    if (!invoice) return null;
    return invoice.inventoryIds?.map((id) => inventories.get(id)).find((entry) => Boolean(entry)) ?? null;
  }, [invoice, inventories]);

  const sellerInvoiceNumber = masterData.companyProfile.invoiceNumber || "―";
  const buyerInvoiceNumber = useMemo(() => {
    const supplierName =
      invoice?.vendorName ||
      invoice?.buyerName ||
      primaryInventory?.supplierCorporate ||
      primaryInventory?.supplier;
    const supplier = masterData.suppliers.find((entry) => entry.corporateName === supplierName);
    return supplier?.invoiceNumber || "―";
  }, [invoice?.buyerName, invoice?.vendorName, masterData.suppliers, primaryInventory]);

  const recipientName = useMemo(() => {
    const fromInvoice = invoice?.vendorName || invoice?.buyerName;
    const fromInventory =
      primaryInventory?.supplierCorporate || primaryInventory?.supplierBranch || primaryInventory?.supplier;
    return (fromInvoice || fromInventory || "〇〇商事").trim();
  }, [invoice?.buyerName, invoice?.vendorName, primaryInventory]);

  const staffName = invoice?.staff || "―";
  const manager = invoice?.manager || "―";
  const remarks = invoice?.remarks || "";
  const shippingInsurance = Number(invoice?.insurance || 0);

  const subtotal = useMemo(
    () =>
      invoice?.subtotal ??
      items.reduce((sum, item) => {
        const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        return sum + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [invoice?.subtotal, items],
  );

  const taxRate = invoice?.invoiceType === "hall" ? 0.05 : 0.1;
  const tax = invoice?.tax ?? Math.floor(subtotal * taxRate);
  const grandTotal = invoice?.totalAmount ?? subtotal + tax + shippingInsurance;

  const issuedDateLabel = formatFullDate(invoice?.issuedDate || invoice?.createdAt);
  const paymentDueDateLabel = formatMonthDay(invoice?.paymentDueDate || invoice?.issuedDate || invoice?.createdAt);
  const invoiceOriginalRequiredLabel = invoice?.invoiceOriginalRequired === false ? "不要" : "要";
  const paymentDateLabel = formatMonthDay(invoice?.issuedDate || invoice?.createdAt);
  const warehousingDateLabel = formatMonthDay(invoice?.issuedDate || invoice?.createdAt);
  const transferDateLabel = formatFullDate(invoice?.transferDate);
  const cancelSelectionCount = selectedCancelRows.size;

  const handlePrintMenu = (label: string) => {
    const action = PRINT_ACTIONS.find((entry) => entry.label === label);
    if (!action) return;
    if (action.requiresSerial && !serialStatus.allComplete) {
      alert(
        `番号が揃っていないため印刷できません（${serialStatus.filledCount}/${serialStatus.totalCount}台入力済み）`,
      );
      return;
    }
    setSelectedPrintLabel(label);
    if (action.path === "sales-contract") {
      setSelectedContractCopy("both");
    }
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => {
    if (!invoice || !selectedPrintLabel) return;
    const seller = findBuyerById(selectedSellerId);
    const action = PRINT_ACTIONS.find((entry) => entry.label === selectedPrintLabel);
    if (!action) return;
    if (action.requiresSerial && !serialStatus.allComplete) {
      alert(
        `番号が揃っていないため印刷できません（${serialStatus.filledCount}/${serialStatus.totalCount}台入力済み）`,
      );
      return;
    }
    const path = action.path;
    const params = new URLSearchParams({ sellerId: seller.id });
    if (path === "sales-contract") {
      params.set("copy", selectedContractCopy);
    }
    const url = `/sales/sales-invoice/print/vendor/${path}/${invoice.invoiceId}?${params.toString()}`;
    router.push(url);
    setIsPrintModalOpen(false);
  };

  const handleMachineDetail = () => {
    alert("販売機械番号明細は準備中です");
  };

  const handleEdit = () => {
    if (!invoice) return;
    if (invoiceGroup) {
      router.push(`/sales/sales-invoice/group/${invoiceId}/reorder`);
      return;
    }
    router.push(`/sales/sales-invoice/${invoice.invoiceType}/${invoice.invoiceId}/reorder`);
  };

  const handleDelete = () => {
    alert("削除機能はデモでは無効です");
  };

  const handleCancelToggle = (rowId: string, checked: boolean) => {
    setSelectedCancelRows((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }
      return next;
    });
  };

  const handleCancelConfirm = async () => {
    if (isCancelling) return;
    if (selectedCancelRows.size === 0) return;
    const selectedRows = cancelRows.filter((row) => selectedCancelRows.has(row.id));
    const totalPerInvoice = new Map<string, number>();
    cancelRows.forEach((row) => {
      totalPerInvoice.set(row.invoiceId, (totalPerInvoice.get(row.invoiceId) ?? 0) + 1);
    });
    const selectedPerInvoice = new Map<string, number>();
    selectedRows.forEach((row) => {
      selectedPerInvoice.set(row.invoiceId, (selectedPerInvoice.get(row.invoiceId) ?? 0) + 1);
    });
    const invalidInvoice = Array.from(totalPerInvoice.entries()).find(([invoiceId, total]) => {
      const remaining = total - (selectedPerInvoice.get(invoiceId) ?? 0);
      return remaining <= 0;
    });
    if (invalidInvoice) {
      alert("減台後の台数が0台になるため実行できません。1台以上残るように調整してください。");
      return;
    }

    setIsCancelling(true);
    try {
      const now = new Date().toISOString();
      const currentInventories = loadInventoryRecords();
      const inventoryMap = new Map(currentInventories.map((record) => [record.id, record]));
      const newInventories: InventoryRecord[] = [];

      const selectedByInventory = new Map<string, CancelUnitRow[]>();
      const selectedByItemKey = new Map<string, CancelUnitRow[]>();
      selectedRows.forEach((row) => {
        if (row.inventoryId) {
          const list = selectedByInventory.get(row.inventoryId) ?? [];
          list.push(row);
          selectedByInventory.set(row.inventoryId, list);
        }
        const itemList = selectedByItemKey.get(row.itemKey) ?? [];
        itemList.push(row);
        selectedByItemKey.set(row.itemKey, itemList);
      });

      selectedByInventory.forEach((rows, inventoryId) => {
        const source = inventoryMap.get(inventoryId);
        const baseQuantity = Number(source?.quantity ?? rows.length);
        const reduceCount = rows.length;
        const remaining = baseQuantity - reduceCount;
        if (remaining <= 0) {
          throw new Error("減台後の台数が0台になります。");
        }
        if (source) {
          inventoryMap.set(inventoryId, { ...source, quantity: remaining });
        }

        const selectedIndexes = new Set(rows.map((row) => row.unitIndex));
        const allRows = serialRowsMap.get(inventoryId) ?? [];
        const remainingRows = allRows.filter((_, index) => !selectedIndexes.has(index));
        const nextRows = remainingRows.map((row, index) => ({ ...row, p: index + 1 }));
        saveSerialInput({
          inventoryId,
          units: nextRows.length,
          rows: nextRows,
          updatedAt: now,
        });
        void saveSerialRows(inventoryId, nextRows);

        const newRows = rows.map((row, index) => ({ ...row.serialRow, p: index + 1 }));
        const newInventoryId = generateInventoryId();
        const baseMemo = source?.note ?? source?.notes;
        const memo = appendCancelMemo(baseMemo, rows[0]?.invoiceId ?? "");
        const baseRecord: InventoryRecord = source
          ? { ...source }
          : {
              id: newInventoryId,
              createdAt: now,
              status: "倉庫",
              stockStatus: "倉庫",
              listingStatus: "not_listing",
              quantity: reduceCount,
            };
        const recovered: InventoryRecord = {
          ...baseRecord,
          id: newInventoryId,
          createdAt: now,
          quantity: reduceCount,
          status: "倉庫",
          stockStatus: "倉庫",
          listingStatus: "not_listing",
          isVisible: true,
          note: memo,
          notes: memo,
        };
        newInventories.push(recovered);
        saveSerialInput({
          inventoryId: newInventoryId,
          units: newRows.length,
          rows: newRows,
          updatedAt: now,
        });
        void saveSerialRows(newInventoryId, newRows);
      });

      selectedByItemKey.forEach((rows) => {
        if (rows.every((row) => row.inventoryId)) return;
        const baseRow = rows[0];
        const newRows = rows.map((row, index) => ({ ...row.serialRow, p: index + 1 }));
        const newInventoryId = generateInventoryId();
        const memo = appendCancelMemo(undefined, baseRow.invoiceId);
        const recovered: InventoryRecord = {
          id: newInventoryId,
          createdAt: now,
          status: "倉庫",
          stockStatus: "倉庫",
          listingStatus: "not_listing",
          quantity: rows.length,
          maker: baseRow.maker,
          model: baseRow.productName,
          machineName: baseRow.productName,
          type: baseRow.type,
          unitPrice: baseRow.unitPrice,
          note: memo,
          notes: memo,
          isVisible: true,
        };
        newInventories.push(recovered);
        saveSerialInput({
          inventoryId: newInventoryId,
          units: newRows.length,
          rows: newRows,
          updatedAt: now,
        });
        void saveSerialRows(newInventoryId, newRows);
      });

      const updatedInventories = [...inventoryMap.values(), ...newInventories];
      saveInventoryRecords(updatedInventories);
      setInventories(new Map(updatedInventories.map((record) => [record.id, record])));

      const updatedInvoices = sourceInvoices.map((source) => {
        const updatedItems = (source.items ?? [])
          .map((item, itemIndex) => {
            const itemKey = item.inventoryId ?? `${source.invoiceId}-item-${itemIndex}`;
            const selectedCount = selectedByItemKey.get(itemKey)?.length ?? 0;
            if (selectedCount === 0) return item;
            const nextQuantity = (Number(item.quantity) || 0) - selectedCount;
            if (nextQuantity <= 0) return null;
            return {
              ...item,
              quantity: nextQuantity,
              amount: nextQuantity * (Number(item.unitPrice) || 0),
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item));
        const nextSubtotal = updatedItems.reduce((sum, item) => {
          const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
          return sum + (Number.isNaN(amount) ? 0 : amount);
        }, 0);
        const rate = source.invoiceType === "hall" ? 0.05 : 0.1;
        const nextTax = Math.floor(nextSubtotal * rate);
        const nextTotal = nextSubtotal + nextTax + Number(source.insurance || 0);
        return {
          ...source,
          items: updatedItems,
          inventoryIds: updatedItems
            .map((item) => item.inventoryId)
            .filter((id): id is string => Boolean(id)),
          subtotal: nextSubtotal,
          tax: nextTax,
          totalAmount: nextTotal,
        };
      });
      upsertSalesInvoices(updatedInvoices);

      setIsCancelModalOpen(false);
      setSelectedCancelRows(new Set());
      setRefreshToken((prev) => prev + 1);
      alert("減台が完了しました。在庫へ復帰しています。");
    } catch (error) {
      console.error("Failed to cancel sale units", error);
      alert("減台処理に失敗しました。もう一度お試しください。");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!invoice && attemptedLoad) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded border border-slate-300 bg-white p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-neutral-800">対象の販売伝票が見つかりませんでした。</div>
          <div className="mt-3 text-sm text-neutral-600">一覧に戻って別の伝票を選択してください。</div>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded border border-slate-400 bg-slate-200 px-6 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-slate-300"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  if (expectedType && invoice.invoiceType !== expectedType) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded border border-amber-300 bg-amber-50 p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-amber-800">別種別の販売伝票が選択されました。</div>
          <div className="mt-3 text-sm text-amber-700">正しい種別の伝票を一覧から選択してください。</div>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded border border-slate-400 bg-slate-200 px-6 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-slate-300"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={() => router.push(`/sales/sales-invoice/list`)}
              className="rounded border border-emerald-500 bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500"
            >
              一覧へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-[13px] text-neutral-800">
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[360px] border border-neutral-500 bg-white px-6 py-5 text-neutral-900 shadow-md">
            <div className="mb-4 text-base font-semibold">・売主表示</div>
            <div className="space-y-2 text-sm">
              <label className="block text-xs text-neutral-700">売主選択</label>
              <select
                value={selectedSellerId}
                onChange={(event) => setSelectedSellerId(event.target.value)}
                className="w-full border border-neutral-500 bg-white px-2 py-2 text-sm"
              >
                {BUYER_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {selectedPrintLabel === "売買契約書" && (
              <div className="mt-4 space-y-2 text-sm">
                <label className="block text-xs text-neutral-700">控え種別</label>
                <div className="space-y-2">
                  {CONTRACT_COPY_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="contract-copy"
                        value={option.value}
                        checked={selectedContractCopy === option.value}
                        onChange={() => setSelectedContractCopy(option.value)}
                        className="h-4 w-4"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="border border-neutral-500 bg-slate-200 px-5 py-2 text-neutral-800"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="border border-yellow-600 bg-yellow-300 px-5 py-2 text-neutral-900"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl border-2 border-neutral-700 bg-white text-neutral-900">
            <div className="border-b-2 border-neutral-700 bg-slate-200 px-4 py-2 text-sm font-semibold">
              減台（売却取り消し）
            </div>
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between text-sm font-semibold">
                <span>選択 {cancelSelectionCount}台</span>
                <span className="text-xs text-neutral-600">伝票対象台の一覧です。外したい台を選択してください。</span>
              </div>
              <div className="max-h-[50vh] overflow-auto border border-neutral-600">
                <table className="w-full table-fixed text-[12px]" style={{ borderCollapse: "collapse" }}>
                  <colgroup>
                    <col style={{ width: "6%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "19%" }} />
                    <col style={{ width: "19%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
                  <thead className="bg-slate-100 text-[12px] font-semibold">
                    <tr>
                      <th className="border border-neutral-600 px-2 py-1">選択</th>
                      <th className="border border-neutral-600 px-2 py-1">元伝票</th>
                      <th className="border border-neutral-600 px-2 py-1">機種</th>
                      <th className="border border-neutral-600 px-2 py-1">遊技盤番号等</th>
                      <th className="border border-neutral-600 px-2 py-1">枠番号等</th>
                      <th className="border border-neutral-600 px-2 py-1">主基板番号等</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancelRows.map((row) => (
                      <tr key={row.id} className="bg-white">
                        <td className="border border-neutral-600 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCancelRows.has(row.id)}
                            onChange={(event) => handleCancelToggle(row.id, event.target.checked)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="border border-neutral-600 px-2 py-1">{row.invoiceId}</td>
                        <td className="border border-neutral-600 px-2 py-1">{row.inventoryLabel}</td>
                        <td className="border border-neutral-600 px-2 py-1">
                          {row.serialRow.board.trim() ? row.serialRow.board : "未入力"}
                        </td>
                        <td className="border border-neutral-600 px-2 py-1">
                          {row.serialRow.frame.trim() ? row.serialRow.frame : "未入力"}
                        </td>
                        <td className="border border-neutral-600 px-2 py-1">
                          {row.serialRow.main.trim() ? row.serialRow.main : "未入力"}
                        </td>
                      </tr>
                    ))}
                    {cancelRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="border border-neutral-600 px-3 py-6 text-center text-sm">
                          対象となる個体がありません。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCancelling}
                  className="border border-neutral-600 bg-slate-200 px-5 py-2 text-neutral-800"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  disabled={isCancelling || cancelSelectionCount === 0}
                  className="border border-emerald-700 bg-emerald-100 px-5 py-2 text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  減台確定（在庫へ戻す）
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-4">
        <div className="border-b border-slate-400 pb-2">
          <div className="flex items-center gap-2 text-xl font-semibold text-neutral-900">
            <span className="text-emerald-700">●</span>
            <span>{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded border border-slate-300 bg-slate-200 px-3 py-2 text-sm font-semibold text-neutral-800">
          <span className="h-5 w-1.5 rounded bg-emerald-700" aria-hidden />
          <span>詳細情報</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-neutral-700">入金日：</span>
            <span>{transferDateLabel}</span>
          </div>
        </div>

        <PrintMenu
          menuLabel="メニュー："
          actions={PRINT_ACTIONS.map((action) => ({
            label: action.label,
            onClick: () => handlePrintMenu(action.label),
            disabled: action.requiresSerial && !serialStatus.allComplete,
          }))}
          sideLabel="機械番号明細："
          sideAction={{ label: "販売機械番号明細", onClick: handleMachineDetail }}
        />
        {!serialStatus.allComplete && serialStatus.totalCount > 0 && (
          <div className="text-[11px] font-medium text-amber-700">
            番号が揃っていないため印刷できません（{serialStatus.filledCount}/{serialStatus.totalCount}
            台入力済み）
          </div>
        )}

        <div className="flex justify-center">
          <div className="w-full max-w-5xl border border-black bg-white p-6 shadow-sm">
            {invoice.invoiceType === "vendor"
              ? renderVendorSheet({
                  recipientName,
                  staffName,
                  manager,
                  items,
                  subtotal,
                  tax,
                  shippingInsurance,
                  grandTotal,
                  issuedDateLabel,
                  paymentDueDateLabel,
                  invoiceOriginalRequiredLabel,
                  sellerInvoiceNumber,
                  buyerInvoiceNumber,
                })
              : renderHallSheet({
                  recipientName,
                  staffName,
                  manager,
                  items,
                  subtotal,
                  tax,
                  shippingInsurance,
                  grandTotal,
                  issuedDateLabel,
                  paymentDueDateLabel,
                  invoiceOriginalRequiredLabel,
                  paymentDateLabel,
                  warehousingDateLabel,
                  sellerInvoiceNumber,
                  buyerInvoiceNumber,
                })}

            <div className="mb-4 mt-6 min-h-[120px] border border-black p-3 text-[13px]">
              <div className="mb-2 text-sm font-semibold text-neutral-900">備考</div>
              <div className="whitespace-pre-wrap text-neutral-800">{remarks || "―"}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pb-6">
          <button
            type="button"
            onClick={() => setIsCancelModalOpen(true)}
            className="rounded border border-red-600 bg-red-100 px-6 py-2 text-sm font-bold text-red-900 shadow hover:bg-red-200"
          >
            減台（売却取り消し）
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="rounded border border-amber-500 bg-amber-300 px-6 py-2 text-sm font-bold text-neutral-900 shadow hover:bg-amber-200"
          >
            編集
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded border border-amber-500 bg-amber-300 px-6 py-2 text-sm font-bold text-neutral-900 shadow hover:bg-amber-200"
          >
            削除
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border border-slate-400 bg-slate-200 px-6 py-2 text-sm font-semibold text-neutral-900 shadow hover:bg-slate-300"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}

type VendorSheetProps = {
  recipientName: string;
  staffName: string;
  manager: string;
  items: SalesInvoice["items"];
  subtotal: number;
  tax: number;
  shippingInsurance: number;
  grandTotal: number;
  issuedDateLabel: string;
  paymentDueDateLabel: string;
  invoiceOriginalRequiredLabel: string;
  sellerInfo?: BuyerInfo;
  sellerInvoiceNumber?: string;
  buyerInvoiceNumber?: string;
};

type HallSheetProps = VendorSheetProps & {
  paymentDateLabel: string;
  warehousingDateLabel: string;
};

export const renderVendorSheet = ({
  recipientName,
  staffName,
  manager,
  items,
  subtotal,
  tax,
  shippingInsurance,
  grandTotal,
  issuedDateLabel,
  paymentDueDateLabel,
  invoiceOriginalRequiredLabel,
  sellerInfo,
  sellerInvoiceNumber,
  buyerInvoiceNumber,
}: VendorSheetProps) => {
  const sellerDisplay = sellerInfo
    ? {
        ...COMPANY_INFO,
        name: sellerInfo.corporate,
        address: sellerInfo.address,
        postal: sellerInfo.postalCode,
        tel: sellerInfo.tel,
        fax: sellerInfo.fax,
      }
    : COMPANY_INFO;

  return (
    <div className="space-y-4 text-[12px] text-neutral-900">
      <div className="space-y-3 border border-black p-4">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="min-w-[280px] flex-1 space-y-2">
            <div className="text-lg font-bold text-neutral-900">販売伝票発行（業者）</div>
            <div className="text-lg font-semibold text-neutral-900">{recipientName} 御中</div>
            <div className="flex gap-6 text-sm text-neutral-800">
              <span>FAX ―</span>
              <span>TEL ―</span>
            </div>
            <div className="text-xs text-neutral-700">インボイス番号 {buyerInvoiceNumber || "―"}</div>
            <div className="text-sm font-semibold text-neutral-900">当社の規約に基づき下記の通り売却いたします</div>
            <div className="text-xs leading-relaxed text-neutral-800">
              <div>＊キャンセルは理由の如何にかかわらず承りません。</div>
              <div>＊商品の引き渡し後の故障・損傷・破損などについて弊社は一切の責任を負いません。</div>
              <div>＊同意の上お取引くださいますようお願い申し上げます。</div>
            </div>
          </div>

          <div className="min-w-[260px] space-y-2 text-sm text-neutral-800">
            <div className="flex items-center justify-between border border-black px-3 py-2 text-[13px] font-semibold text-neutral-900">
              <span>日付</span>
              <span>{issuedDateLabel}</span>
            </div>
            <div className="border border-black px-3 py-3 text-neutral-800">
              <div className="text-right text-sm font-semibold text-neutral-900">売主</div>
              <div className="space-y-1 text-left">
                <div>{sellerDisplay.postal}</div>
                <div>{sellerDisplay.address}</div>
                <div>{sellerDisplay.name}</div>
                <div className="flex items-center justify-between text-xs">
                  <span>{sellerDisplay.tel}</span>
                  <span>{sellerDisplay.fax}</span>
                </div>
                <div className="text-xs">インボイス番号 {sellerInvoiceNumber || "―"}</div>
                <div className="flex items-center justify-between text-xs">
                  <span>担当 {staffName}</span>
                  <span>経理担当 {manager}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[2.3fr_1fr]">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed border border-black text-[12px]">
              <thead className="bg-slate-100 text-center font-semibold">
                <tr>
                  <th className="border border-black px-2 py-2">メーカー名</th>
                  <th className="border border-black px-2 py-2">商品名</th>
                  <th className="border border-black px-2 py-2">タイプ</th>
                  <th className="border border-black px-2 py-2 text-right">数量</th>
                  <th className="border border-black px-2 py-2 text-right">単価</th>
                  <th className="border border-black px-2 py-2 text-right">金額</th>
                  <th className="border border-black px-2 py-2">発信</th>
                  <th className="border border-black px-2 py-2">申請適用</th>
                  <th className="border border-black px-2 py-2">申請日</th>
                  <th className="border border-black px-2 py-2">商品補足</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="border border-black px-3 py-6 text-center text-sm text-neutral-600">
                      明細が登録されていません。
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.itemId ?? `${item.productName}-${index}`} className="align-middle text-center">
                      <td className="border border-black px-2 py-2 text-left">{item.maker || ""}</td>
                      <td className="border border-black px-2 py-2 text-left font-semibold">{item.productName || ""}</td>
                      <td className="border border-black px-2 py-2 text-left">{item.type || ""}</td>
                      <td className="border border-black px-2 py-2 text-right">{formatNumber(item.quantity)}</td>
                      <td className="border border-black px-2 py-2 text-right">{formatNumber(item.unitPrice)}</td>
                      <td className="border border-black px-2 py-2 text-right font-semibold">{formatNumber(item.amount)}</td>
                      <td className="border border-black px-2 py-2">―</td>
                      <td className="border border-black px-2 py-2">―</td>
                      <td className="border border-black px-2 py-2">―</td>
                      <td className="border border-black px-2 py-2 text-left">{item.note || ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <div className="border border-black">
              <div className="bg-slate-100 px-3 py-2 text-center text-sm font-semibold">金額集計</div>
              <div className="space-y-1 px-3 py-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span>小計</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>消費税（10%）</span>
                  <span className="font-semibold">{formatCurrency(tax)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>運送保険（税込）</span>
                  <span className="font-semibold">{formatCurrency(shippingInsurance)}</span>
                </div>
                <div className="border-t border-black pt-2 text-right text-sm font-bold">
                  合計金額 {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>

            <div className="border border-black p-3 text-[12px]">
              <div className="text-sm font-semibold text-neutral-900">お振込先</div>
              <div className="mt-2 space-y-1 text-neutral-800">
                <div>三菱東京UFJ銀行 高田馬場支店</div>
                <div>普通 0131849 カ)ピーカンクラブ</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between border border-black px-2 py-1 text-[11px]">
                  <span>支払期日</span>
                  <span className="text-[12px] font-semibold">{paymentDueDateLabel}</span>
                </div>
                <div className="flex items-center justify-between border border-black px-2 py-1 text-[11px]">
                  <span>請求書原本</span>
                  <span className="text-[12px] font-semibold">{invoiceOriginalRequiredLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-[12px]">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border border-black border-collapse text-[12px]">
              <colgroup>
                <col className="w-[140px]" />
                <col />
                <col className="w-[140px]" />
                <col className="w-[180px]" />
              </colgroup>
              <tbody>
                <tr>
                  <td className="border border-black bg-slate-50 px-3 py-2 font-semibold">保管先</td>
                  <td className="border border-black px-3 py-2">○○倉庫</td>
                  <td className="border border-black bg-slate-50 px-3 py-2 font-semibold text-right">合計金額</td>
                  <td className="border border-black px-3 py-2 text-right font-bold">{formatCurrency(grandTotal)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="border border-black bg-slate-100 px-3 py-2 text-center font-semibold">
                    商品配送先
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-3 py-2 font-semibold">商品引き渡し方法</td>
                  <td className="border border-black px-3 py-2">直送</td>
                  <td className="border border-black px-3 py-2 font-semibold">直送日</td>
                  <td className="border border-black px-3 py-2">
                    <span className="inline-block min-w-[140px] border border-black px-2 py-1">月 日 ( )</span>
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="border border-black px-3 py-10" />
                </tr>
                <tr>
                  <td colSpan={4} className="border border-black bg-slate-100 px-3 py-2 text-center font-semibold">
                    売契→先
                  </td>
                </tr>
                <tr>
                  <td className="border border-black px-3 py-2 font-semibold">売契引き渡し方法</td>
                  <td className="border border-black px-3 py-2">--</td>
                  <td className="border border-black px-3 py-2 font-semibold">--日</td>
                  <td className="border border-black px-3 py-2">
                    <span className="inline-block min-w-[140px] border border-black px-2 py-1">月 日 ( )</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3 space-y-3">
              <div className="border border-black p-3">
                <div className="text-sm font-semibold text-neutral-900">機械番号明細</div>
                <div className="mt-2 h-16 border border-black bg-white" />
              </div>
              <div className="border border-black p-3">
                <div className="text-sm font-semibold text-neutral-900">案内</div>
                <div className="mt-2 space-y-1 text-center text-[13px] font-bold leading-relaxed">
                  <div>URL：{sellerDisplay.url}</div>
                  <div>Email：{sellerDisplay.mail}</div>
                  <div>FAX：{sellerDisplay.fax}</div>
                </div>
              </div>
            </div>
            <div className="col-span-2 grid grid-cols-[1fr_2.5fr] gap-2">
              <div className="flex flex-col items-center justify-between border border-black px-2 py-3 text-[11px] font-semibold text-neutral-900">
                <div>住所</div>
                <div>会社名</div>
                <div>電話番号</div>
                <div className="mt-6">印</div>
              </div>
              <div className="space-y-2">
                <div className="h-7 border border-black" />
                <div className="h-7 border border-black" />
                <div className="h-7 border border-black" />
                <div className="h-16 border border-black" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type SalesContractInvoiceSheetProps = {
  title: string;
  copyLabel?: string;
  issuedDateLabel: string;
  recipientName: string;
  staffName: string;
  items: SalesInvoice["items"];
  subtotal: number;
  tax: number;
  grandTotal: number;
  paymentDueDateLabel: string;
  sellerInfo?: BuyerInfo;
  sellerInvoiceNumber?: string;
  buyerInvoiceNumber?: string;
};

export const renderSalesContractInvoiceSheet = ({
  title,
  copyLabel,
  issuedDateLabel,
  recipientName,
  staffName,
  items,
  subtotal,
  tax,
  grandTotal,
  paymentDueDateLabel,
  sellerInfo,
  sellerInvoiceNumber,
  buyerInvoiceNumber,
}: SalesContractInvoiceSheetProps) => {
  const sellerDisplay = sellerInfo
    ? {
        ...COMPANY_INFO,
        name: sellerInfo.corporate,
        address: sellerInfo.address,
        postal: sellerInfo.postalCode,
        tel: sellerInfo.tel,
        fax: sellerInfo.fax,
        representative: sellerInfo.representative,
      }
    : { ...COMPANY_INFO, representative: undefined };

  return (
    <div className="space-y-4 text-[12px] text-neutral-900">
      <div className="grid grid-cols-[1fr_1.5fr_1fr] items-start">
        <div />
        <div className="text-center text-lg font-semibold">{title}</div>
        <div className="flex flex-col items-end gap-0.5 text-right leading-tight">
          {copyLabel && <div className="text-[10px] font-semibold text-neutral-700 print:text-[10px]">（{copyLabel}）</div>}
          <div className="text-[12px]">{issuedDateLabel}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-2">
          <div className="text-[13px] font-semibold">{recipientName} 御中</div>
          <div className="text-[11px] text-neutral-700">インボイス番号 {buyerInvoiceNumber || "―"}</div>
        </div>
        <div className="border border-black p-3 text-[11px]">
          <div className="mb-1 text-right text-sm font-semibold">【売主】</div>
          <div className="space-y-0.5">
            <div>{sellerDisplay.postal}</div>
            <div>{sellerDisplay.address}</div>
            <div>{sellerDisplay.name}</div>
            {sellerDisplay.representative && <div>{sellerDisplay.representative}</div>}
            <div className="flex items-center justify-between">
              <span>{sellerDisplay.tel}</span>
              <span>{sellerDisplay.fax}</span>
            </div>
            <div>担当 {staffName}</div>
            <div>インボイス番号 {sellerInvoiceNumber || "―"}</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border border-black text-[11px]">
          <thead className="bg-slate-100 text-center font-semibold">
            <tr>
              <th className="border border-black px-2 py-1">メーカー名</th>
              <th className="border border-black px-2 py-1">商品名</th>
              <th className="border border-black px-2 py-1">タイプ</th>
              <th className="border border-black px-2 py-1 text-right">数量</th>
              <th className="border border-black px-2 py-1 text-right">単価</th>
              <th className="border border-black px-2 py-1 text-right">金額</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-black px-3 py-4 text-center text-[11px] text-neutral-600">
                  明細が登録されていません。
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.itemId ?? `${item.productName}-${index}`} className="align-middle text-center">
                  <td className="border border-black px-2 py-1 text-left">{item.maker || ""}</td>
                  <td className="border border-black px-2 py-1 text-left font-semibold">{item.productName || ""}</td>
                  <td className="border border-black px-2 py-1 text-left">{item.type || ""}</td>
                  <td className="border border-black px-2 py-1 text-right">{formatNumber(item.quantity)}</td>
                  <td className="border border-black px-2 py-1 text-right">{formatNumber(item.unitPrice)}</td>
                  <td className="border border-black px-2 py-1 text-right">{formatNumber(item.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="w-full max-w-sm border border-black p-3 text-[11px]">
          <div className="mb-2 text-sm font-semibold">金額集計</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span>小計</span>
              <span className="font-semibold">{formatYen(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>消費税（10%）</span>
              <span className="font-semibold">{formatYen(tax)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-black pt-1 text-right font-bold">
              <span>合計金額</span>
              <span>{formatYen(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm border border-black p-3 text-[11px]">
          <div className="text-sm font-semibold">お振込先</div>
          <div className="mt-2 space-y-1">
            <div>三菱東京UFJ銀行 高田馬場支店</div>
            <div>普通 0131849 カ)ピーカンクラブ</div>
          </div>
          <div className="mt-3 border-t border-black pt-2">
            <div className="mb-1 text-sm font-semibold">お支払方法 / お支払日 / 金額</div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="border border-black px-2 py-1 text-center">振込</div>
              <div className="border border-black px-2 py-1 text-center">{paymentDueDateLabel || " "}</div>
              <div className="border border-black px-2 py-1 text-center font-semibold">{formatYen(grandTotal)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[120px_1fr] gap-2 text-[11px]">
        <div className="flex flex-col justify-between border border-black px-2 py-3 text-center font-semibold">
          <div>住所</div>
          <div>会社名</div>
          <div>電話番号</div>
          <div className="mt-4">印</div>
        </div>
        <div className="space-y-2">
          <div className="h-7 border border-black" />
          <div className="h-7 border border-black" />
          <div className="h-7 border border-black" />
          <div className="h-16 border border-black" />
        </div>
      </div>
    </div>
  );
};

const renderHallSheet = ({
  recipientName,
  staffName,
  manager,
  items,
  subtotal,
  tax,
  shippingInsurance,
  grandTotal,
  issuedDateLabel,
  paymentDateLabel,
  warehousingDateLabel,
  sellerInvoiceNumber,
  buyerInvoiceNumber,
}: HallSheetProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 text-[13px]">
        <div className="min-w-[280px] flex-1 space-y-1">
          <div className="text-lg font-semibold text-neutral-900">{recipientName} 御中</div>
          <div className="text-sm font-semibold text-neutral-900">
            ＊ p-kanriclubの規約に基づき（別紙参照）下記の通り契約をいたします。
          </div>
          <div className="text-xs text-neutral-700">インボイス番号 {buyerInvoiceNumber || "―"}</div>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm font-semibold text-neutral-900">
          <div>{issuedDateLabel}</div>
          <div className="w-[260px] border border-black px-3 py-2 text-[12px]">
            <div className="mb-1 text-base font-bold">【売主】</div>
            <div className="space-y-1 text-left">
              <div>{COMPANY_INFO.address}</div>
              <div>{COMPANY_INFO.name}</div>
              <div className="flex items-center justify-between text-xs">
                <span>TEL 03-5389-1955</span>
                <span>FAX 03-5389-1956</span>
              </div>
              <div className="text-xs">インボイス番号 {sellerInvoiceNumber || "―"}</div>
              <div className="flex items-center justify-between text-xs">
                <span>担当 {staffName}</span>
                <span>経理担当 {manager}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border border-black text-[12px]">
          <thead className="bg-slate-100 text-center font-semibold">
            <tr>
              <th className="border border-black px-2 py-2">メーカー名</th>
              <th className="border border-black px-2 py-2">商品名</th>
              <th className="border border-black px-2 py-2">タイプ</th>
              <th className="border border-black px-2 py-2 text-right">数量</th>
              <th className="border border-black px-2 py-2 text-right">単価</th>
              <th className="border border-black px-2 py-2 text-right">金額</th>
              <th className="border border-black px-2 py-2">商品補足</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-black px-3 py-6 text-center text-sm text-neutral-600">
                  明細が登録されていません。
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.itemId ?? `${item.productName}-${index}`} className="align-middle text-center">
                  <td className="border border-black px-2 py-2 text-left">{item.maker || ""}</td>
                  <td className="border border-black px-2 py-2 text-left font-semibold">{item.productName || ""}</td>
                  <td className="border border-black px-2 py-2 text-left">{item.type || ""}</td>
                  <td className="border border-black px-2 py-2 text-right">{formatNumber(item.quantity)}</td>
                  <td className="border border-black px-2 py-2 text-right">{formatNumber(item.unitPrice)}</td>
                  <td className="border border-black px-2 py-2 text-right font-semibold">{formatNumber(item.amount)}</td>
                  <td className="border border-black px-2 py-2 text-left">{item.note || ""}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="text-sm font-semibold">
            <tr>
              <td colSpan={4} className="border border-black px-3 py-2 text-right">
                小計
              </td>
              <td colSpan={3} className="border border-black px-3 py-2 text-right">
                {formatCurrency(subtotal)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="border border-black px-3 py-2 text-right">
                消費税（5%）
              </td>
              <td colSpan={3} className="border border-black px-3 py-2 text-right">
                {formatCurrency(tax)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="border border-black px-3 py-2 text-right">
                運送保険（税込）
              </td>
              <td colSpan={3} className="border border-black px-3 py-2 text-right">
                {formatCurrency(shippingInsurance)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="border border-black px-3 py-2 text-right">
                合計金額
              </td>
              <td colSpan={3} className="border border-black px-3 py-2 text-right font-bold">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-5 gap-3 text-[12px]">
        <div className="col-span-3 border border-black p-3">
          <div className="text-sm font-semibold text-neutral-900">お振込先</div>
          <div className="mt-2 space-y-1 text-neutral-800">
            <div>三菱東京UFJ銀行 高田馬場支店</div>
            <div>普通 0131849 カ)ピーカンクラブ</div>
          </div>
          <div className="mt-4 text-sm font-semibold text-neutral-900">お支払方法（振込）</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-neutral-800">
            <div className="h-7 border border-black" />
            <div className="h-7 border border-black" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-neutral-800">
            <div>
              <div className="text-sm font-semibold text-neutral-900">お支払日</div>
              <div className="mt-1 h-7 border border-black" />
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-900">金額</div>
              <div className="mt-1 h-7 border border-black" />
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-900">合計金額</div>
              <div className="mt-1 h-7 border border-black font-bold text-right leading-[28px]">
                {formatCurrency(grandTotal)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-[1fr_2.5fr] gap-2">
          <div className="flex flex-col items-center justify-between border border-black px-2 py-3 text-[11px] font-semibold text-neutral-900">
            <div>住所</div>
            <div>会社名</div>
            <div>電話番号</div>
            <div className="mt-6">印</div>
          </div>
          <div className="space-y-2">
            <div className="h-7 border border-black" />
            <div className="h-7 border border-black" />
            <div className="h-7 border border-black" />
            <div className="h-16 border border-black" />
          </div>
        </div>
      </div>

      <div className="space-y-3 text-[12px]">
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">導入店舗名</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">機械納品日</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">設置日</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">書類着日</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">納店日</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">書類お届け先</div>
            <div className="mt-2 h-7 border border-black" />
          </div>
        </div>
        <div className="border border-black p-3">
          <div className="text-sm font-semibold text-neutral-900">備考</div>
          <div className="mt-2 h-24 border border-black" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-black p-3">
            <div className="text-sm font-semibold text-neutral-900">保管先</div>
            <div className="mt-2 h-10 border border-black" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-black p-3">
              <div className="text-sm font-semibold text-neutral-900">入庫日</div>
              <div className="mt-2 h-7 border border-black text-right leading-[26px]">{warehousingDateLabel}</div>
            </div>
            <div className="border border-black p-3">
              <div className="text-sm font-semibold text-neutral-900">支払日</div>
              <div className="mt-2 h-7 border border-black text-right leading-[26px]">{paymentDateLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceDetailView;
