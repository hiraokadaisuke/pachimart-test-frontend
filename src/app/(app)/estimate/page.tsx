"use client";

import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { downloadEstimateXlsx } from "@/lib/estimate/xlsx";

type EstimateRow = {
  id: number;
  manufacturer: string;
  machineName: string;
  quantity: string;
  price: string;
  memo: string;
};

type MachineOption = {
  manufacturer: string;
  machineName: string;
};

const machineOptions: MachineOption[] = [
  { manufacturer: "サミー", machineName: "P北斗無双" },
  { manufacturer: "サンセイ", machineName: "P牙狼月虹ノ旅人" },
  { manufacturer: "京楽", machineName: "P乃木坂46" },
  { manufacturer: "平和", machineName: "Pルパン三世 2000カラットの涙" },
  { manufacturer: "銀座", machineName: "P真北斗無双3ジャギの逆襲GEE" },
];

function createInitialRows(count: number): EstimateRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    manufacturer: index === 0 ? "銀座" : "",
    machineName: index === 0 ? "P真北斗無双3ジャギの逆襲GEE" : "",
    quantity: index === 0 ? "1" : "",
    price: "",
    memo: "",
  }));
}

const tableInputClass =
  "w-full rounded-sm border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none transition hover:border-slate-400 focus:border-sky-400 focus:bg-white";

const hasRowInput = (row: EstimateRow) =>
  Boolean(row.manufacturer.trim() || row.machineName.trim() || row.quantity.trim() || row.price.trim() || row.memo.trim());

const enterNavigationFields = ["manufacturer", "machineName", "quantity", "price", "memo"] as const;
type EnterNavigationField = (typeof enterNavigationFields)[number];

const templateHeaders = ["№", "メーカー名", "機種名", "数量", "メモ"];
const templateSheetName = "テンプレート";
const templateRowCount = 50;

const templateColumnWidths = [6, 18, 30, 10, 36];

const hasTemplateExportInput = (row: EstimateRow) =>
  Boolean(row.manufacturer.trim() || row.machineName.trim() || row.quantity.trim() || row.memo.trim());

function downloadTemplateWorkbook(dataRows: string[][], fileName: string) {
  downloadEstimateXlsx({
    fileName,
    sheetName: templateSheetName,
    headers: templateHeaders,
    rows: dataRows,
    columnWidths: templateColumnWidths,
  });
}

function EstimateImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">取込み</h2>
        <div className="mt-4 space-y-2">
          <label htmlFor="dummy-file" className="text-sm text-slate-700">
            ファイルを選択
          </label>
          <input id="dummy-file" type="file" className="block w-full rounded-md border border-slate-300 text-sm file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-blue-600 bg-blue-600 px-3 text-sm text-white hover:bg-blue-700"
          >
            取込み
          </button>
        </div>
      </div>
    </div>
  );
}

function MachineSearchModal({
  open,
  keyword,
  onKeywordChange,
  onClose,
  onSelect,
}: {
  open: boolean;
  keyword: string;
  onKeywordChange: (value: string) => void;
  onClose: () => void;
  onSelect: (machine: MachineOption) => void;
}) {
  const filteredMachines = useMemo(() => {
    if (!keyword.trim()) return machineOptions;
    return machineOptions.filter((option) => option.machineName.toLowerCase().includes(keyword.toLowerCase()));
  }, [keyword]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
      <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">機種を選択</h2>
        <input
          type="text"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="機種名で検索"
          className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <ul className="mt-3 max-h-72 overflow-y-auto rounded-md border border-slate-200">
          {filteredMachines.map((option) => (
            <li key={option.machineName} className="border-b border-slate-200 last:border-0">
              <button
                type="button"
                onClick={() => onSelect(option)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span>{option.machineName}</span>
                <span className="text-xs text-slate-500">{option.manufacturer}</span>
              </button>
            </li>
          ))}
          {filteredMachines.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">候補が見つかりません</li>}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EstimatePage() {
  const [rows, setRows] = useState<EstimateRow[]>(() => createInitialRows(12));
  const [selectedFileName, setSelectedFileName] = useState("ファイル未選択");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchTargetRowId, setSearchTargetRowId] = useState<number | null>(null);
  const [focusedRowId, setFocusedRowId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateRow = <K extends keyof EstimateRow>(rowId: number, key: K, value: EstimateRow[K]) => {
    setRows((currentRows) => currentRows.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  };

  const handleAddRow = () => {
    setRows((currentRows) => [
      ...currentRows,
      { id: currentRows.length + 1, manufacturer: "", machineName: "", quantity: "", price: "", memo: "" },
    ]);
  };

  const openSearchModal = (rowId: number) => {
    setSearchTargetRowId(rowId);
    setSearchKeyword("");
    setIsSearchModalOpen(true);
  };

  const applyMachineToRow = (machine: MachineOption) => {
    if (searchTargetRowId === null) return;
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === searchTargetRowId ? { ...row, machineName: machine.machineName, manufacturer: machine.manufacturer } : row,
      ),
    );
    setIsSearchModalOpen(false);
  };

  const setFieldRef = (rowId: number, field: EnterNavigationField, element: HTMLInputElement | null) => {
    fieldRefs.current[`${rowId}:${field}`] = element;
  };

  const handleCellKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: EnterNavigationField) => {
    if (event.key !== "Enter") return;
    event.preventDefault();

    const currentFieldIndex = enterNavigationFields.indexOf(field);
    const nextField = enterNavigationFields[currentFieldIndex + 1];

    if (nextField) {
      const nextTarget = fieldRefs.current[`${rows[rowIndex]?.id}:${nextField}`];
      nextTarget?.focus();
      return;
    }

    const nextRow = rows[rowIndex + 1];
    if (!nextRow) return;
    fieldRefs.current[`${nextRow.id}:manufacturer`]?.focus();
  };

  const handleOpenProductPage = (row: EstimateRow) => {
    const params = new URLSearchParams({ sort: "price_asc" });
    if (row.machineName.trim()) {
      params.set("estimateMachineName", row.machineName.trim());
    }
    if (row.manufacturer.trim()) {
      params.set("estimateMaker", row.manufacturer.trim());
    }
    window.open(`/market/products?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  const handleDownloadTemplate = () => {
    const dataRows = Array.from({ length: templateRowCount }, (_, index) => [String(index + 1), "", "", "", ""]);
    downloadTemplateWorkbook(dataRows, "estimate-template.xlsx");
  };

  const handleExportExcel = () => {
    const exportRows = rows
      .filter(hasTemplateExportInput)
      .map((row, index) => [String(index + 1), row.manufacturer.trim(), row.machineName.trim(), row.quantity.trim(), row.memo.trim()]);

    downloadTemplateWorkbook(exportRows, "estimate-export.xlsx");
  };

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 text-neutral-900">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">簡単見積り</h1>
        <p className="mt-1 text-sm text-slate-600">複数機種の価格をまとめて入力できます。</p>
      </header>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              行を追加
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              テンプレDL
            </button>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              取込み
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setSelectedFileName(file?.name ?? "ファイル未選択");
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              ファイルを選択
            </button>
            <span
              className="inline-flex h-9 min-w-[20rem] max-w-[34rem] items-center rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700"
              title={selectedFileName}
            >
              <span className="truncate">{selectedFileName}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              取込み
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="w-16 border-b border-slate-200 px-2 py-2 font-semibold">番号</th>
                <th className="w-36 border-b border-slate-200 px-2 py-2 font-semibold">メーカー</th>
                <th className="min-w-80 border-b border-slate-200 px-2 py-2 font-semibold">機種名</th>
                <th className="w-24 border-b border-slate-200 px-2 py-2 font-semibold">台数</th>
                <th className="w-36 border-b border-slate-200 px-2 py-2 font-semibold">価格</th>
                <th className="min-w-72 border-b border-slate-200 px-2 py-2 font-semibold">メモ</th>
                <th className="w-32 border-b border-slate-200 px-2 py-2 font-semibold">相場確認</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  onFocusCapture={() => setFocusedRowId(row.id)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setFocusedRowId(null);
                    }
                  }}
                  className={`border-b border-slate-200 last:border-0 ${
                    focusedRowId === row.id ? "bg-sky-200/60" : hasRowInput(row) ? "bg-sky-100" : "bg-white"
                  }`}
                >
                  <td className="px-1.5 py-1.5 text-slate-600">{index + 1}</td>
                  <td className="px-1.5 py-1.5">
                    <input
                      type="text"
                      ref={(element) => setFieldRef(row.id, "manufacturer", element)}
                      value={row.manufacturer}
                      onChange={(event) => updateRow(row.id, "manufacturer", event.target.value)}
                      onKeyDown={(event) => handleCellKeyDown(event, index, "manufacturer")}
                      className={tableInputClass}
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        ref={(element) => setFieldRef(row.id, "machineName", element)}
                        value={row.machineName}
                        onChange={(event) => updateRow(row.id, "machineName", event.target.value)}
                        onKeyDown={(event) => handleCellKeyDown(event, index, "machineName")}
                        className={tableInputClass}
                      />
                      <button
                        type="button"
                        onClick={() => openSearchModal(row.id)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
                        aria-label="機種検索"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-1.5 py-1.5">
                    <input
                      type="number"
                      min={1}
                      ref={(element) => setFieldRef(row.id, "quantity", element)}
                      value={row.quantity}
                      onChange={(event) => updateRow(row.id, "quantity", event.target.value)}
                      onKeyDown={(event) => handleCellKeyDown(event, index, "quantity")}
                      className={`${tableInputClass} w-16`}
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <input
                      type="number"
                      placeholder="価格入力"
                      ref={(element) => setFieldRef(row.id, "price", element)}
                      value={row.price}
                      onChange={(event) => updateRow(row.id, "price", event.target.value)}
                      onKeyDown={(event) => handleCellKeyDown(event, index, "price")}
                      className={`${tableInputClass} text-right`}
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <input
                      type="text"
                      ref={(element) => setFieldRef(row.id, "memo", element)}
                      value={row.memo}
                      onChange={(event) => updateRow(row.id, "memo", event.target.value)}
                      onKeyDown={(event) => handleCellKeyDown(event, index, "memo")}
                      className={tableInputClass}
                    />
                  </td>
                  <td className="px-1.5 py-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenProductPage(row)}
                      className="inline-flex h-7 items-center rounded-md border border-sky-300 bg-white px-2.5 text-xs font-medium text-sky-700 transition hover:bg-sky-50"
                    >
                      相場確認
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-blue-600 bg-blue-600 px-4 text-sm text-white hover:bg-blue-700"
          >
            登録
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"
          >
            Excel出力
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"
          >
            掲載新規登録
          </button>
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-slate-100 px-4 text-sm text-slate-400"
          >
            見積書作成（今後対応予定）
          </button>
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-slate-100 px-4 text-sm text-slate-400"
          >
            請求書作成（今後対応予定）
          </button>
        </div>
      </section>

      <EstimateImportModal open={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <MachineSearchModal
        open={isSearchModalOpen}
        keyword={searchKeyword}
        onKeywordChange={setSearchKeyword}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={applyMachineToRow}
      />
    </main>
  );
}
