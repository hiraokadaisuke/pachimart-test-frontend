"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  loadInventoryRecords,
  updateInventoryRecord,
  type InventoryRecord,
} from "@/lib/demo-data/demoInventory";
import {
  loadSerialDraft,
  loadSerialInput,
  loadSerialRows,
  type SerialInputPayload,
  type SerialInputRow,
} from "@/lib/serialInputStorage";
import {
  createAttachmentId,
  deleteAttachment,
  getAttachment,
  openAttachmentInNewTab,
  saveAttachment,
  type AttachmentKind,
} from "@/lib/attachments/attachmentStore";

const COLUMN_KEYS = ["board", "frame", "main", "removalDate"] as const;
type ColumnKey = (typeof COLUMN_KEYS)[number];
const BULK_INPUT_KEYS = ["board", "frame", "main"] as const;
type BulkInputKey = (typeof BULK_INPUT_KEYS)[number];
type BulkInputValue = { first: string; second: string };
type BulkInputs = Record<BulkInputKey, BulkInputValue> & { removalDate: string };

const getColumnLabels = (type: string) => ({
  board: type === "S" ? "回胴部" : "遊技盤番号等",
  frame: type === "S" ? "筐体部" : "枠番号等",
  main: "主基板番号等",
  removalDate: "撤去日",
});

const createEmptyRow = (index: number): SerialInputRow => ({
  p: index + 1,
  board: "",
  frame: "",
  main: "",
  removalDate: "",
});

const showNativePicker = (input: HTMLInputElement) => {
  const withPicker = input as HTMLInputElement & { showPicker?: () => void };
  if (typeof withPicker.showPicker === "function") {
    withPicker.showPicker();
  } else {
    input.focus();
  }
};

// NOTE: Place the following files under public/print-dummy/ to show real images:
// - union-move-consent.<ext>
// - used-machine-check.<ext>
const PRINT_MENU_ITEMS = [
  {
    key: "union-contract",
    label: "組合売買契約書",
    image: "/print-samples/kumiai-baibai-keiyakusho.svg",
  },
  {
    key: "union-move-consent",
    label: "組合移動同意書",
    image: "/print-dummy/union-move-consent.png",
  },
  {
    key: "used-machine-check",
    label: "中古遊技機確認書",
    image: "/print-dummy/used-machine-check.png",
  },
] as const;

type SerialInputPanelProps = {
  inventoryId: string;
  onRegister?: (payload: SerialInputPayload) => void;
  onPrev?: (payload: SerialInputPayload) => void;
  onNext?: (payload: SerialInputPayload) => void;
  onBack?: () => void;
  onUnitsChange?: (nextUnits: number) => void;
  onSplit?: (payload: SerialSplitPayload) => string | null;
  enableSplit?: boolean;
  onSell?: (payload: SerialSplitPayload) => void;
  enableSale?: boolean;
  refreshToken?: number;
  registering?: boolean;
  splitting?: boolean;
  selling?: boolean;
};

export type SerialSplitPayload = {
  inventoryId: string;
  units: number;
  rows: SerialInputRow[];
  selectedIndexes: number[];
};

export default function SerialInputPanel({
  inventoryId,
  onRegister,
  onPrev,
  onNext,
  onBack,
  onUnitsChange,
  onSplit,
  enableSplit = false,
  onSell,
  enableSale = false,
  refreshToken,
  registering = false,
  splitting = false,
  selling = false,
}: SerialInputPanelProps) {
  const [inventory, setInventory] = useState<InventoryRecord | null>(null);
  const [units, setUnits] = useState<number>(1);
  const [rows, setRows] = useState<SerialInputRow[]>([]);
  const [inputs, setInputs] = useState<BulkInputs>({
    board: { first: "", second: "" },
    frame: { first: "", second: "" },
    main: { first: "", second: "" },
    removalDate: "",
  });
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [uploadingKind, setUploadingKind] = useState<AttachmentKind | null>(null);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrCandidates, setOcrCandidates] = useState<Array<{ id: string; value: string }>>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [printPreview, setPrintPreview] = useState<{
    label: string;
    image: string;
  } | null>(null);
  const [printPreviewError, setPrintPreviewError] = useState(false);
  const bulkInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const kentuuInputRef = useRef<HTMLInputElement | null>(null);
  const tekkyoInputRef = useRef<HTMLInputElement | null>(null);

  const machineName = inventory?.machineName ?? "";
  const machineKind = useMemo(() => {
    const rawKind = (inventory?.kind ?? inventory?.type ?? "P").toString().toUpperCase();
    return rawKind === "S" ? "S" : "P";
  }, [inventory?.kind, inventory?.type]);
  const columnLabels = useMemo(() => getColumnLabels(machineKind), [machineKind]);
  const bulkInputCount = BULK_INPUT_KEYS.length * 2;
  const attachments = inventory?.attachments ?? {};
  const hasKentuu = Boolean(attachments.kentuuAttachmentId);
  const hasTekkyo = Boolean(attachments.tekkyoAttachmentId);
  const selectedCandidateCount = selectedCandidateIds.size;

  useEffect(() => {
    if (!inventoryId) return;
    let active = true;
    const loadData = async () => {
      const all = loadInventoryRecords();
      const target = all.find((record) => record.id === inventoryId) ?? null;
      const resolvedKind = ((target?.kind ?? target?.type ?? "P").toString().toUpperCase() === "S" ? "S" : "P") as
        | "P"
        | "S";
      const savedRows = await loadSerialRows(inventoryId);
      const savedPayload = loadSerialInput(inventoryId) ?? loadSerialDraft(inventoryId);
      const fallbackRows = savedPayload?.rows ?? [];
      const resolvedRows = savedRows.length > 0 ? savedRows : fallbackRows;
      const resolvedUnits = Number(target?.quantity ?? 1) || 1;
      const adjustedRows = resolvedRows.slice(0, resolvedUnits);
      if (!active) return;
      setInventory(target);
      setUnits(resolvedUnits);
      const initialRows = Array.from({ length: resolvedUnits }, (_, index) => {
        const existing = adjustedRows[index];
        if (existing) return { ...existing, p: index + 1 };
        return createEmptyRow(index);
      });
      setRows(initialRows);
      if (adjustedRows.length > 0) {
        const splitCombinedValue = (value: string, kind: "P" | "S") => {
          const trimmed = value.trim();
          if (!trimmed) return { first: "", second: "" };
          const delimiter = kind === "S" ? "/" : "　";
          const parts = trimmed.split(delimiter);
          if (parts.length < 2) return { first: trimmed, second: "" };
          return {
            first: parts[0]?.trim() ?? "",
            second: parts.slice(1).join(delimiter).trim(),
          };
        };
        setInputs({
          board: splitCombinedValue(adjustedRows[0]?.board ?? "", resolvedKind),
          frame: splitCombinedValue(adjustedRows[0]?.frame ?? "", resolvedKind),
          main: splitCombinedValue(adjustedRows[0]?.main ?? "", resolvedKind),
          removalDate: adjustedRows[0]?.removalDate ?? "",
        });
      }
      setSelectedRows(new Set());
      setSelectedCandidateIds(new Set());
      setOcrCandidates([]);
      setOcrMessage(null);
      setOcrModalOpen(false);
      setOcrLoading(false);
    };
    void loadData();
    return () => {
      active = false;
    };
  }, [inventoryId, refreshToken]);

  useEffect(() => {
    if (!printPreview) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPrintPreview(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [printPreview]);

  useEffect(() => {
    setRows((prev) =>
      Array.from({ length: units }, (_, index) => {
        const existing = prev[index];
        if (existing) return { ...existing, p: index + 1 };
        return createEmptyRow(index);
      }),
    );
  }, [units]);

  const allowIncompleteSelection = enableSale;

  useEffect(() => {
    setSelectedRows((prev) => {
      const next = new Set<number>();
      prev.forEach((index) => {
        const row = rows[index];
        if (!row) return;
        if (allowIncompleteSelection || isRowComplete(row)) {
          next.add(index);
        }
      });
      return next;
    });
  }, [rows, allowIncompleteSelection]);

  const handleInputChange = (key: BulkInputKey, part: keyof BulkInputValue, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: { ...prev[key], [part]: value } }));
  };

  const handleRemovalDateChange = (value: string) => {
    setInputs((prev) => ({ ...prev, removalDate: value }));
  };

  const handleCopy = (key: BulkInputKey) => {
    const currentIndex = BULK_INPUT_KEYS.indexOf(key);
    const nextKey = BULK_INPUT_KEYS[currentIndex + 1];
    if (!nextKey) return;
    setInputs((prev) => ({ ...prev, [nextKey]: { ...prev[key] } }));
  };

  const resolveRange = () => {
    const parsedStart = Number.parseInt(rangeStart, 10);
    const parsedEnd = Number.parseInt(rangeEnd, 10);
    let start = Number.isNaN(parsedStart) ? 1 : parsedStart;
    let end = Number.isNaN(parsedEnd) ? units : parsedEnd;
    if (start < 1) start = 1;
    if (end < 1) end = 1;
    if (start > units) start = units;
    if (end > units) end = units;
    if (start > end) [start, end] = [end, start];
    return { startIndex: start - 1, endIndex: end - 1, start, end };
  };

  const buildSequentialValue = (baseValue: string, offset: number) => {
    if (baseValue.trim() === "") return "";
    const match = baseValue.match(/(\d+)$/);
    if (!match) {
      return `${baseValue}${offset + 1}`;
    }
    const digits = match[1];
    const prefix = baseValue.slice(0, -digits.length);
    const baseNumber = Number.parseInt(digits, 10);
    if (Number.isNaN(baseNumber)) return baseValue;
    const nextNumber = baseNumber + offset;
    return `${prefix}${String(nextNumber).padStart(digits.length, "0")}`;
  };

  const buildCombinedValue = (firstValue: string, secondValue: string, kind: "P" | "S") => {
    const firstTrimmed = firstValue.trim();
    const secondTrimmed = secondValue.trim();
    if (!firstTrimmed && !secondTrimmed) return "";
    if (!firstTrimmed) return secondTrimmed;
    if (!secondTrimmed) return firstTrimmed;
    const delimiter = kind === "S" ? "/" : "　";
    return `${firstTrimmed}${delimiter}${secondTrimmed}`;
  };

  const handleApply = (key: ColumnKey) => {
    const { startIndex, endIndex } = resolveRange();
    const shouldSequence = key !== "removalDate";
    setRows((prev) =>
      prev.map((row, index) => {
        if (index < startIndex || index > endIndex) return row;
        if (key === "removalDate") {
          return { ...row, [key]: inputs.removalDate };
        }
        const bulkKey = key as BulkInputKey;
        const baseValue = inputs[bulkKey];
        const secondValue = shouldSequence ? buildSequentialValue(baseValue.second, index - startIndex) : baseValue.second;
        const combinedValue = buildCombinedValue(baseValue.first, secondValue, machineKind);
        return { ...row, [key]: combinedValue };
      }),
    );
  };

  const updateRowValue = (index: number, key: ColumnKey, value: string) => {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  };

  const handleBulkInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, inputIndex: number) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (bulkInputCount === 0) return;
    const nextIndex = (inputIndex + 1) % bulkInputCount;
    bulkInputRefs.current[nextIndex]?.focus();
  };

  const handleUnitsChange = (nextUnits: number) => {
    setUnits(nextUnits);
    onUnitsChange?.(nextUnits);
  };

  const hasRowInput = (row: SerialInputRow) =>
    [row.board, row.frame, row.main, row.removalDate].some((value) => value.trim() !== "");

  const isRowComplete = (row: SerialInputRow) =>
    [row.board, row.frame, row.main, row.removalDate].every((value) => value.trim() !== "");

  const handleUnitsInputChange = (value: string) => {
    const nextUnits = Math.max(1, Number(value) || 1);
    if (nextUnits < units) {
      const removedRows = rows.slice(nextUnits);
      if (removedRows.some(hasRowInput)) {
        const confirmed = window.confirm("台数を減らすと末尾の番号データが削除されます。よろしいですか？");
        if (!confirmed) return;
      }
    }
    handleUnitsChange(nextUnits);
  };

  const buildPayload = (): SerialInputPayload => ({
    inventoryId: inventoryId ?? "",
    units,
    rows,
    updatedAt: new Date().toISOString(),
  });

  const handleSplit = () => {
    if (!onSplit) return;
    if (splitting) return;
    if (units < 2) {
      alert("仕入数が1台のため分離できません。");
      return;
    }
    if (selectedRows.size === 0) {
      alert("分離する台を選択してください。");
      return;
    }
    const confirmed = window.confirm(
      `選択した${selectedRows.size}台を別在庫として分離します。仕入先等の情報はコピーされます。よろしいですか？`,
    );
    if (!confirmed) return;
    const newInventoryId = onSplit({
      inventoryId,
      units,
      rows,
      selectedIndexes: Array.from(selectedRows).sort((a, b) => a - b),
    });
    if (newInventoryId) {
      alert(`分離しました（新在庫ID: ${newInventoryId}）`);
      setSelectedRows(new Set());
    }
  };

  const handleRegister = () => {
    if (!inventoryId) return;
    if (registering) return;
    onRegister?.(buildPayload());
  };

  const handlePrev = () => {
    if (!inventoryId) return;
    onPrev?.(buildPayload());
  };

  const handleNext = () => {
    if (!inventoryId) return;
    onNext?.(buildPayload());
  };

  const handleAttachmentUpload = async (kind: AttachmentKind, file: File) => {
    if (!inventoryId) return;
    setUploadingKind(kind);
    try {
      const attachmentId = createAttachmentId();
      await saveAttachment({
        attachmentId,
        inventoryId,
        kind,
        filename: file.name,
        mimeType: file.type || "application/pdf",
        blob: file,
        createdAt: new Date().toISOString(),
      });
      const updated = updateInventoryRecord(inventoryId, {
        attachments: {
          ...(inventory?.attachments ?? {}),
          ...(kind === "kentuu" ? { kentuuAttachmentId: attachmentId } : { tekkyoAttachmentId: attachmentId }),
        },
      });
      const nextRecord = updated.find((item) => item.id === inventoryId) ?? inventory;
      setInventory(nextRecord ?? null);
    } catch (error) {
      console.error("Failed to save attachment", error);
      alert("PDFの保存に失敗しました。もう一度お試しください。");
    } finally {
      setUploadingKind(null);
    }
  };

  const handleAttachmentFileChange = (kind: AttachmentKind, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void handleAttachmentUpload(kind, file);
    event.target.value = "";
  };

  const handleOpenAttachment = async (attachmentId?: string) => {
    try {
      await openAttachmentInNewTab(attachmentId);
    } catch (error) {
      console.error("Failed to open attachment", error);
      alert("PDFが見つかりません。再アップロードしてください。");
    }
  };

  const handleDeleteAttachment = async (kind: AttachmentKind) => {
    if (!inventoryId) return;
    const attachmentId = kind === "kentuu" ? attachments.kentuuAttachmentId : attachments.tekkyoAttachmentId;
    if (!attachmentId) return;
    const label = kind === "kentuu" ? "検通" : "撤明";
    if (!confirm(`${label}PDFを削除します。よろしいですか？`)) return;
    try {
      await deleteAttachment(attachmentId);
      const nextAttachments = { ...(inventory?.attachments ?? {}) };
      if (kind === "kentuu") {
        delete nextAttachments.kentuuAttachmentId;
      } else {
        delete nextAttachments.tekkyoAttachmentId;
      }
      const updated = updateInventoryRecord(inventoryId, {
        attachments: Object.keys(nextAttachments).length > 0 ? nextAttachments : undefined,
      });
      const nextRecord = updated.find((item) => item.id === inventoryId) ?? inventory;
      setInventory(nextRecord ?? null);
    } catch (error) {
      console.error("Failed to delete attachment", error);
      alert("PDFの削除に失敗しました。もう一度お試しください。");
    }
  };

  const applyParsedNumbers = (numbers: string[]) => {
    if (numbers.length === 0) return;
    setRows((prev) =>
      prev.map((row, index) => {
        if (index >= units) return row;
        const value = numbers[index];
        if (!value) return row;
        return { ...row, board: value };
      }),
    );
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return window.btoa(binary);
  };

  const handleStartOcr = async () => {
    if (!attachments.kentuuAttachmentId || ocrLoading) return;
    setOcrModalOpen(true);
    setOcrLoading(true);
    setOcrMessage(null);
    setOcrCandidates([]);
    setSelectedCandidateIds(new Set());
    try {
      const attachment = await getAttachment(attachments.kentuuAttachmentId);
      if (!attachment?.blob) {
        throw new Error("PDFが見つかりません。");
      }
      const buffer = await attachment.blob.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      const response = await fetch("/api/attachments/kentuu/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64,
          fileName: attachment.filename,
        }),
      });
      const payload = (await response.json()) as
        | { numbers: string[] }
        | { errorCode: string; message?: string };
      if (!response.ok || "errorCode" in payload) {
        const errorCode = "errorCode" in payload ? payload.errorCode : "UNKNOWN";
        if (errorCode === "NO_TEXT_LAYER") {
          setOcrMessage("PDFに文字情報が無く、番号を抽出できませんでした。手入力してください。");
        } else if (errorCode === "PARSE_FAILED") {
          setOcrMessage("解析に失敗しました。別のPDFでお試しください。");
        } else {
          setOcrMessage("番号の抽出に失敗しました。手入力してください。");
        }
        return;
      }
      const numbers = payload.numbers ?? [];
      if (numbers.length === 0) {
        setOcrMessage("番号を検出できませんでした。手入力してください。");
        return;
      }
      if (numbers.length <= units) {
        applyParsedNumbers(numbers);
        setOcrModalOpen(false);
        return;
      }
      const candidates = numbers.map((value, index) => ({
        id: `${index}-${value}`,
        value,
      }));
      setOcrCandidates(candidates);
      setSelectedCandidateIds(new Set());
      setOcrMessage(null);
    } catch (error) {
      console.error("Failed to parse kentuu PDF", error);
      setOcrMessage("番号の抽出に失敗しました。手入力してください。");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleToggleCandidate = (candidateId: string) => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) {
        next.delete(candidateId);
        return next;
      }
      if (next.size >= units) return next;
      next.add(candidateId);
      return next;
    });
  };

  const handleCandidateChange = (candidateId: string, value: string) => {
    setOcrCandidates((prev) =>
      prev.map((candidate) => (candidate.id === candidateId ? { ...candidate, value } : candidate)),
    );
  };

  const handleApplyOcr = () => {
    if (selectedCandidateIds.size !== units) return;
    const selected = ocrCandidates.filter((candidate) => selectedCandidateIds.has(candidate.id));
    if (selected.length === 0) return;
    applyParsedNumbers(selected.map((candidate) => candidate.value));
    setOcrModalOpen(false);
  };

  const rangeInfo = resolveRange();
  const hasRangeInput = rangeStart.trim() !== "" || rangeEnd.trim() !== "";
  const rangeLabel = hasRangeInput ? `${rangeInfo.start} ～ ${rangeInfo.end}` : `1 ～ ${units}`;
  const canSplit = enableSplit && units > 1 && !splitting && !selling;
  const canSelect = (enableSplit || enableSale) && !splitting && !selling;
  const selectedCount = selectedRows.size;
  const canSell = enableSale && !splitting && !selling && selectedCount > 0;

  const handleSell = () => {
    if (!onSell) return;
    if (selling) return;
    if (selectedRows.size === 0) {
      alert("売却する台を選択してください。");
      return;
    }
    onSell({
      inventoryId,
      units,
      rows,
      selectedIndexes: Array.from(selectedRows).sort((a, b) => a - b),
    });
  };

  const handleOpenPrintPreview = (item: (typeof PRINT_MENU_ITEMS)[number]) => {
    setPrintPreview({ label: item.label, image: item.image });
    setPrintPreviewError(false);
  };

  const handleClosePrintPreview = () => {
    setPrintPreview(null);
  };

  return (
    <div className="flex justify-center bg-neutral-100 py-4 text-[13px] text-neutral-900">
      <div className="w-full max-w-5xl space-y-3">
        {printPreview && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                handleClosePrintPreview();
              }
            }}
          >
            <div className="max-h-full w-full max-w-4xl overflow-auto rounded bg-white p-4 shadow-lg">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-neutral-900">{printPreview.label}</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClosePrintPreview}
                    className="border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    戻る
                  </button>
                  <button
                    type="button"
                    onClick={handleClosePrintPreview}
                    aria-label="閉じる"
                    className="flex h-8 w-8 items-center justify-center border border-neutral-300 bg-white text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                {printPreviewError ? (
                  <div className="flex h-[60vh] w-full items-center justify-center border border-dashed border-neutral-300 text-sm text-neutral-500">
                    画像未設定（ファイルを配置してください）
                  </div>
                ) : (
                  <img
                    src={printPreview.image}
                    alt={printPreview.label}
                    className="w-full max-h-[80vh] object-contain border border-neutral-200"
                    onError={() => setPrintPreviewError(true)}
                  />
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleClosePrintPreview}
                  className="border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  戻る
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-base font-semibold">
            <span className="text-lg leading-none text-emerald-600">●</span>
            <span>購入機械番号入力</span>
          </div>
          <div className="border-b border-black" />
          <p className="text-[12px] text-neutral-800">「＊」が表示されているものは分解した商品です。</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border border-black bg-neutral-200 text-[13px] font-semibold">
          <div className="flex items-center gap-2">
            <div className="h-7 w-1 bg-emerald-600" />
            <div className="px-3">購入機械番号入力</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-3 py-1 text-[11px] font-semibold">
            <div className="flex items-center gap-2 text-neutral-700">
              <span>検通</span>
              {hasKentuu ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="PDFを開く"
                    onClick={() => handleOpenAttachment(attachments.kentuuAttachmentId)}
                    className="cursor-pointer text-[12px] font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    ●
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAttachment("kentuu")}
                    className="border border-black bg-white px-1 py-0.5 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    削除
                  </button>
                </div>
              ) : (
                <span className="text-neutral-500">-</span>
              )}
              <span className="ml-2">撤明</span>
              {hasTekkyo ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="PDFを開く"
                    onClick={() => handleOpenAttachment(attachments.tekkyoAttachmentId)}
                    className="cursor-pointer text-[12px] font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    ●
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAttachment("tekkyo")}
                    className="border border-black bg-white px-1 py-0.5 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    削除
                  </button>
                </div>
              ) : (
                <span className="text-neutral-500">-</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => kentuuInputRef.current?.click()}
              disabled={uploadingKind === "kentuu"}
              className="border border-black bg-white px-2 py-1 text-[11px] font-semibold hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingKind === "kentuu" ? "検通アップ中" : "検通 ⬆"}
            </button>
            <button
              type="button"
              onClick={() => tekkyoInputRef.current?.click()}
              disabled={uploadingKind === "tekkyo"}
              className="border border-black bg-white px-2 py-1 text-[11px] font-semibold hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadingKind === "tekkyo" ? "撤明アップ中" : "撤明 ⬆"}
            </button>
            <button
              type="button"
              onClick={handleStartOcr}
              disabled={!hasKentuu || ocrLoading}
              className="border border-black bg-neutral-100 px-2 py-1 text-[11px] font-semibold hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ocrLoading ? "解析中..." : "番号反映"}
            </button>
          </div>
        </div>
        <input
          ref={kentuuInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => handleAttachmentFileChange("kentuu", event)}
        />
        <input
          ref={tekkyoInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => handleAttachmentFileChange("tekkyo", event)}
        />

        <div className="border border-black bg-white">
          <div className="flex flex-wrap items-center justify-between border-b border-black bg-[#d7e4f2] px-3 py-2 text-[12px] font-semibold">
            <div className="flex items-center gap-2">
              <span>印刷メニュー</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PRINT_MENU_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleOpenPrintPreview(item)}
                  className="border border-black bg-white px-3 py-1 text-[12px] font-semibold text-neutral-900 hover:bg-neutral-100"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-stretch text-[12px]">
            <div className="flex min-w-[110px] items-center justify-center border-r border-black bg-neutral-100 px-3 py-2 font-semibold">
              機種名
            </div>
            <div className="flex-1 px-3 py-2 text-[13px] font-bold">{machineName || "機種名未設定"}</div>
          </div>
        </div>

        <div className="border border-black bg-white">
          <div className="grid grid-cols-[90px_repeat(4,1fr)] text-[12px]">
            <div className="flex flex-col items-center justify-center gap-2 border-r border-black bg-neutral-100 px-2 py-3 font-semibold">
              <span>全反映</span>
              <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-700">
                <input
                  type="number"
                  min={1}
                  max={units}
                  value={rangeStart}
                  onChange={(event) => setRangeStart(event.target.value)}
                  placeholder="開始"
                  className="w-12 border border-black bg-white px-1 py-0.5 text-right"
                />
                <span>〜</span>
                <input
                  type="number"
                  min={1}
                  max={units}
                  value={rangeEnd}
                  onChange={(event) => setRangeEnd(event.target.value)}
                  placeholder="終了"
                  className="w-12 border border-black bg-white px-1 py-0.5 text-right"
                />
              </div>
              <span className="text-[10px] font-medium text-neutral-600">範囲指定</span>
            </div>
            {COLUMN_KEYS.map((key) => {
              const isRemovalDate = key === "removalDate";
              const isBulkKey = key !== "removalDate";
              const bulkIndex = isBulkKey ? BULK_INPUT_KEYS.indexOf(key as BulkInputKey) : -1;
              return (
                <div key={key} className="border-l border-black px-3 py-2">
                  <div className="flex items-center justify-between border-b border-black pb-1 text-[12px] font-semibold">
                    <span>{columnLabels[key]}</span>
                    <span className="text-[11px] font-medium">No</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="min-w-[76px] border border-black bg-neutral-50 px-2 py-1 text-center text-[12px] font-semibold">
                      {rangeLabel}
                    </span>
                    {isRemovalDate ? (
                      <input
                        type="date"
                        value={inputs.removalDate}
                        onChange={(event) => handleRemovalDateChange(event.target.value)}
                        onClick={(event) => showNativePicker(event.currentTarget)}
                        onFocus={(event) => showNativePicker(event.currentTarget)}
                        className="h-8 w-28 border border-black px-2 text-[12px] focus:border-emerald-600 focus:outline-none sm:w-32"
                      />
                    ) : (
                      <>
                        <input
                          type="text"
                          value={inputs[key as BulkInputKey].first}
                          onChange={(event) => handleInputChange(key as BulkInputKey, "first", event.target.value)}
                          onKeyDown={(event) => handleBulkInputKeyDown(event, bulkIndex * 2)}
                          ref={(element) => {
                            bulkInputRefs.current[bulkIndex * 2] = element;
                          }}
                          className="h-8 w-28 border border-black px-2 text-[12px] focus:border-emerald-600 focus:outline-none sm:w-32"
                        />
                        <input
                          type="text"
                          value={inputs[key as BulkInputKey].second}
                          onChange={(event) => handleInputChange(key as BulkInputKey, "second", event.target.value)}
                          onKeyDown={(event) => handleBulkInputKeyDown(event, bulkIndex * 2 + 1)}
                          ref={(element) => {
                            bulkInputRefs.current[bulkIndex * 2 + 1] = element;
                          }}
                          className="h-8 w-28 border border-black px-2 text-[12px] focus:border-emerald-600 focus:outline-none sm:w-32"
                        />
                      </>
                    )}
                    {!isRemovalDate && (
                      <button
                        type="button"
                        onClick={() => handleCopy(key as BulkInputKey)}
                        className="flex h-8 items-center justify-center border border-black bg-white px-2 text-[12px] font-semibold hover:bg-neutral-100"
                      >
                        →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleApply(key)}
                      className="flex h-8 items-center justify-center border border-black bg-neutral-100 px-3 text-[12px] font-semibold hover:bg-neutral-200"
                    >
                      反映
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-black bg-white">
          <div className="flex items-stretch text-[12px]">
            <div className="flex w-20 items-center justify-center border-r border-black bg-neutral-100 px-2 py-3 text-[13px] font-semibold">
              本体
            </div>
            <div className="flex flex-1 flex-col border-r border-black px-3 py-2 text-center">
              <div className="text-[12px] font-semibold">{rangeLabel}</div>
              <div className="text-base font-bold leading-tight">{machineName || "機種名未設定"}</div>
              <div className="mt-2 flex flex-wrap justify-center gap-4 text-[12px]">
                <span>仕入先: {inventory?.supplier ?? "-"}</span>
                <span>タイプ: {inventory?.type ?? "-"}</span>
                <span>種別: {machineKind}</span>
              </div>
            </div>
            <div className="min-w-[180px]">
              <div className="flex border-b border-black">
                <div className="w-20 border-r border-black bg-neutral-100 px-2 py-2 text-center text-[12px] font-semibold">入庫日</div>
                <div className="flex-1 px-2 py-2 text-center text-[12px]">
                  {inventory?.stockInDate ?? inventory?.arrivalDate ?? "-"}
                </div>
              </div>
              <div className="flex">
                <div className="w-20 border-r border-black bg-neutral-100 px-2 py-2 text-center text-[12px] font-semibold">台数</div>
                <div className="flex-1 px-2 py-2 text-center text-[12px]">{units}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-black bg-white">
          <div className="flex items-center justify-between border-b border-black bg-neutral-100 px-3 py-2 text-[12px] font-semibold">
            <span>番号入力一覧</span>
            <label className="flex items-center gap-2">
              <span>台数</span>
              <input
                type="number"
                min={1}
                value={units}
                onChange={(event) => handleUnitsInputChange(event.target.value)}
                className="w-16 border border-black px-2 py-1 text-right text-[12px] focus:border-emerald-600 focus:outline-none"
              />
            </label>
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="min-w-[720px] w-full table-fixed border-collapse text-[12px]">
              <thead className="sticky top-0 z-10 bg-white">
                <tr>
                  {(enableSplit || enableSale) && (
                    <th className="border-b border-r border-black px-2 py-2 text-center">分離</th>
                  )}
                  <th className="border-b border-r border-black px-2 py-2 text-center">種別</th>
                  <th className="border-b border-r border-black px-2 py-2 text-center">No</th>
                  <th className="border-b border-r border-black px-2 py-2 text-center">{columnLabels.board}</th>
                  <th className="border-b border-r border-black px-2 py-2 text-center">{columnLabels.frame}</th>
                  <th className="border-b border-r border-black px-2 py-2 text-center">{columnLabels.main}</th>
                  <th className="border-b border-black px-2 py-2 text-center">{columnLabels.removalDate}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.p} className="odd:bg-white even:bg-neutral-50">
                    {(enableSplit || enableSale) && (
                      <td className="border-b border-r border-black px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(index)}
                          disabled={!canSelect || (!allowIncompleteSelection && !isRowComplete(row))}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setSelectedRows((prev) => {
                              const next = new Set(prev);
                              if (checked) {
                                next.add(index);
                              } else {
                                next.delete(index);
                              }
                              return next;
                            });
                          }}
                          className="h-4 w-4 border-black"
                        />
                      </td>
                    )}
                    <td className="border-b border-r border-black px-2 py-2 text-center font-semibold">{machineKind}</td>
                    <td className="border-b border-r border-black px-2 py-2 text-center font-semibold">{row.p}</td>
                    <td className="border-b border-r border-black px-2 py-1">
                      <input
                        value={row.board}
                        onChange={(event) => updateRowValue(index, "board", event.target.value)}
                        className="w-full border border-black px-2 py-1 text-[12px] focus:border-emerald-600 focus:outline-none"
                      />
                    </td>
                    <td className="border-b border-r border-black px-2 py-1">
                      <input
                        value={row.frame}
                        onChange={(event) => updateRowValue(index, "frame", event.target.value)}
                        className="w-full border border-black px-2 py-1 text-[12px] focus:border-emerald-600 focus:outline-none"
                      />
                    </td>
                    <td className="border-b border-r border-black px-2 py-1">
                      <input
                        value={row.main}
                        onChange={(event) => updateRowValue(index, "main", event.target.value)}
                        className="w-full border border-black px-2 py-1 text-[12px] focus:border-emerald-600 focus:outline-none"
                      />
                    </td>
                    <td className="border-b border-black px-2 py-1">
                      <input
                        type="date"
                        value={row.removalDate}
                        onClick={(event) => showNativePicker(event.currentTarget)}
                        onFocus={(event) => showNativePicker(event.currentTarget)}
                        onChange={(event) => updateRowValue(index, "removalDate", event.target.value)}
                        className="w-full border border-black px-2 py-1 text-[12px] focus:border-emerald-600 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {enableSplit && (
          <div className="border border-black bg-white">
            <div className="flex items-center justify-between border-b border-black bg-neutral-100 px-3 py-2 text-[12px] font-semibold">
              <span>分離</span>
              <span className="text-[11px] font-medium text-neutral-600">番号入力済みのみ対象</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-[12px]">
              <div className="text-neutral-700">選択 {selectedCount} 台</div>
              <button
                type="button"
                onClick={handleSplit}
                disabled={!canSplit || selectedCount === 0}
                aria-disabled={!canSplit || selectedCount === 0}
                className={`border border-black px-4 py-2 text-[12px] font-semibold text-neutral-900 transition ${
                  canSplit && selectedCount > 0
                    ? "bg-neutral-200 hover:bg-neutral-300"
                    : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                }`}
              >
                {splitting ? "分離中..." : "分離する"}
              </button>
            </div>
          </div>
        )}

        {enableSale && (
          <div className="border border-black bg-white">
            <div className="flex items-center justify-between border-b border-black bg-neutral-100 px-3 py-2 text-[12px] font-semibold">
              <span>販売伝票作成</span>
              <span className="text-[11px] font-medium text-neutral-600">番号未入力でも選択可</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-[12px]">
              <div className="text-neutral-700">選択 {selectedCount} 台</div>
              <button
                type="button"
                onClick={handleSell}
                disabled={!canSell}
                aria-disabled={!canSell}
                className={`border border-black px-4 py-2 text-[12px] font-semibold text-neutral-900 transition ${
                  canSell ? "bg-neutral-200 hover:bg-neutral-300" : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                }`}
              >
                {selling ? "作成中..." : "販売伝票作成"}
              </button>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-center gap-3 bg-neutral-100/95 py-3 text-[13px] backdrop-blur">
          <button
            type="button"
            onClick={handlePrev}
            className="border border-black bg-neutral-200 px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-300"
          >
            前へ
          </button>
          <button
            type="button"
            onClick={handleRegister}
            disabled={registering}
            aria-disabled={registering}
            className={`border border-black px-4 py-2 font-semibold text-white transition ${
              registering ? "cursor-not-allowed bg-red-300" : "bg-red-500 hover:bg-red-400"
            }`}
          >
            {registering ? "保存中..." : "番号登録"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="border border-black bg-neutral-200 px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-300"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="border border-black bg-neutral-200 px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-300"
          >
            次へ
          </button>
        </div>

        {ocrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="w-full max-w-4xl border border-black bg-white text-[12px] shadow-lg">
              <div className="flex items-center justify-between border-b border-black bg-neutral-100 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">番号候補の選択</div>
                  <div className="mt-1 text-[11px] text-neutral-700">
                    仕入数：{units}台 ／ 選択数：{selectedCandidateCount}/{units}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOcrModalOpen(false)}
                  className="text-sm text-neutral-700 hover:text-neutral-900"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
                {ocrLoading ? (
                  <div className="py-8 text-center text-[12px] text-neutral-700">番号解析中...</div>
                ) : ocrCandidates.length === 0 ? (
                  <div className="py-8 text-center text-[12px] text-neutral-700">
                    {ocrMessage ?? "番号を検出できませんでした。手入力してください。"}
                  </div>
                ) : (
                  <table className="w-full table-fixed border-collapse border border-black text-[12px]">
                    <thead className="bg-neutral-100">
                      <tr>
                        <th className="w-10 border border-black px-2 py-2 text-center">選択</th>
                        <th className="border border-black px-2 py-2 text-center">検通番号</th>
                        <th className="w-48 border border-black px-2 py-2 text-center">編集</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ocrCandidates.map((candidate) => {
                        const isSelected = selectedCandidateIds.has(candidate.id);
                        return (
                          <tr key={candidate.id} className="odd:bg-white even:bg-neutral-50">
                            <td className="border border-black px-2 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleCandidate(candidate.id)}
                                disabled={!isSelected && selectedCandidateCount >= units}
                              />
                            </td>
                            <td className="border border-black px-2 py-2">{candidate.value || "-"}</td>
                            <td className="border border-black px-2 py-2">
                              <input
                                type="text"
                                value={candidate.value}
                                onChange={(event) => handleCandidateChange(candidate.id, event.target.value)}
                                className="w-full border border-black px-2 py-1 text-[11px]"
                                placeholder="番号を編集"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-black bg-neutral-100 px-4 py-3">
                <div className="text-[11px] text-neutral-700">候補が台数を超える場合は使用する番号を選択してください。</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOcrModalOpen(false)}
                    className="border border-black bg-white px-3 py-1 text-[12px] font-semibold hover:bg-neutral-100"
                  >
                    閉じる
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyOcr}
                    disabled={selectedCandidateCount !== units}
                    className="border border-black bg-emerald-600 px-4 py-1 text-[12px] font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    反映
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
