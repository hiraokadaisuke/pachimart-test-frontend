'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import {
  downloadEstimateXlsx,
  parseEstimateImportFile,
} from '@/lib/estimate/xlsx';

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

type SavedEstimateRow = {
  maker: string;
  machineName: string;
  quantity: string;
  price: string;
  memo: string;
};

type EstimateRecord = {
  id: number;
  createdAt: string;
  updatedAt?: string;
  templateName: string;
  title: string;
  rows: SavedEstimateRow[];
};

type EstimateTabKey = 'register' | 'list';

const machineOptions: MachineOption[] = [
  { manufacturer: 'サミー', machineName: 'P北斗無双' },
  { manufacturer: 'サンセイ', machineName: 'P牙狼月虹ノ旅人' },
  { manufacturer: '京楽', machineName: 'P乃木坂46' },
  { manufacturer: '平和', machineName: 'Pルパン三世 2000カラットの涙' },
  { manufacturer: '銀座', machineName: 'P真北斗無双3ジャギの逆襲GEE' },
];

function createInitialRows(count: number): EstimateRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    manufacturer: index === 0 ? '銀座' : '',
    machineName: index === 0 ? 'P真北斗無双3ジャギの逆襲GEE' : '',
    quantity: index === 0 ? '1' : '',
    price: '',
    memo: '',
  }));
}

const tableInputClass =
  'w-full rounded-sm border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none transition hover:border-slate-400 focus:border-sky-400 focus:bg-white';

const hasRowInput = (row: EstimateRow) =>
  Boolean(
    row.manufacturer.trim() ||
      row.machineName.trim() ||
      row.quantity.trim() ||
      row.price.trim() ||
      row.memo.trim(),
  );

const enterNavigationFields = [
  'manufacturer',
  'machineName',
  'quantity',
  'price',
  'memo',
] as const;
type EnterNavigationField = (typeof enterNavigationFields)[number];

const templateHeaders = ['№', 'メーカー名', '機種名', '数量', 'メモ'];
const templateSheetName = 'テンプレート';
const templateRowCount = 50;
const minimumRegisterRowCount = 12;
const estimateRecordsStorageKey = 'estimate:records';
const estimateDraftStorageKey = 'estimate:draft';

const templateColumnWidths = [6, 18, 30, 10, 36];

const hasTemplateExportInput = (row: EstimateRow) =>
  Boolean(
    row.manufacturer.trim() ||
      row.machineName.trim() ||
      row.quantity.trim() ||
      row.memo.trim(),
  );

function downloadTemplateWorkbook(dataRows: string[][], fileName: string) {
  downloadEstimateXlsx({
    fileName,
    sheetName: templateSheetName,
    headers: templateHeaders,
    rows: dataRows,
    columnWidths: templateColumnWidths,
  });
}

function normalizeSavedRows(
  rows: Array<Partial<SavedEstimateRow> & { manufacturer?: string }>,
) {
  return rows.map((row) => ({
    maker: row.maker ?? row.manufacturer ?? '',
    machineName: row.machineName ?? '',
    quantity: row.quantity ?? '',
    price: row.price ?? '',
    memo: row.memo ?? '',
  }));
}

function buildEditableRows(
  savedRows: Array<Partial<SavedEstimateRow> & { manufacturer?: string }>,
  minimumCount = minimumRegisterRowCount,
) {
  const normalizedRows = normalizeSavedRows(savedRows);
  const nextLength = Math.max(minimumCount, normalizedRows.length);

  return Array.from({ length: nextLength }, (_, index) => {
    const row = normalizedRows[index];
    return {
      id: index + 1,
      manufacturer: row?.maker ?? '',
      machineName: row?.machineName ?? '',
      quantity: row?.quantity ?? '',
      price: row?.price ?? '',
      memo: row?.memo ?? '',
    };
  });
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
    return machineOptions.filter((option) =>
      option.machineName.toLowerCase().includes(keyword.toLowerCase()),
    );
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
            <li
              key={option.machineName}
              className="border-b border-slate-200 last:border-0"
            >
              <button
                type="button"
                onClick={() => onSelect(option)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span>{option.machineName}</span>
                <span className="text-xs text-slate-500">
                  {option.manufacturer}
                </span>
              </button>
            </li>
          ))}
          {filteredMachines.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-slate-500">
              候補が見つかりません
            </li>
          )}
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
  const [rows, setRows] = useState<EstimateRow[]>(() =>
    createInitialRows(minimumRegisterRowCount),
  );
  const [activeTab, setActiveTab] = useState<EstimateTabKey>('register');
  const [estimateTitle, setEstimateTitle] = useState('');
  const [estimateRecords, setEstimateRecords] = useState<EstimateRecord[]>([]);
  const [currentEstimateId, setCurrentEstimateId] = useState<number | null>(
    null,
  );
  const [selectedFileName, setSelectedFileName] = useState('ファイル未選択');
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchTargetRowId, setSearchTargetRowId] = useState<number | null>(
    null,
  );
  const [focusedRowId, setFocusedRowId] = useState<number | null>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedRecords = window.localStorage.getItem(
        estimateRecordsStorageKey,
      );
      if (storedRecords) {
        const parsedRecords = JSON.parse(storedRecords) as EstimateRecord[];
        setEstimateRecords(
          parsedRecords.map((record) => ({
            ...record,
            updatedAt: record.updatedAt,
            templateName:
              record.templateName ??
              (record as EstimateRecord & { template?: string }).template ??
              '簡単見積りテンプレート',
            rows: normalizeSavedRows(record.rows ?? []),
          })),
        );
      }

      const storedDraft = window.localStorage.getItem(estimateDraftStorageKey);
      if (storedDraft) {
        const parsedDraft = JSON.parse(storedDraft) as {
          currentEstimateId: number | null;
          estimateTitle: string;
          rows: Array<Partial<SavedEstimateRow> & { manufacturer?: string }>;
        };
        setCurrentEstimateId(parsedDraft.currentEstimateId ?? null);
        setEstimateTitle(parsedDraft.estimateTitle ?? '');
        setRows(buildEditableRows(normalizeSavedRows(parsedDraft.rows ?? [])));
      }
    } catch {
      window.localStorage.removeItem(estimateRecordsStorageKey);
      window.localStorage.removeItem(estimateDraftStorageKey);
    } finally {
      setIsStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isStorageReady || typeof window === 'undefined') return;
    window.localStorage.setItem(
      estimateRecordsStorageKey,
      JSON.stringify(estimateRecords),
    );
  }, [estimateRecords, isStorageReady]);

  useEffect(() => {
    if (!isStorageReady || typeof window === 'undefined') return;
    window.localStorage.setItem(
      estimateDraftStorageKey,
      JSON.stringify({
        currentEstimateId,
        estimateTitle,
        rows: rows.map(
          ({ manufacturer, machineName, quantity, price, memo }) => ({
            maker: manufacturer,
            machineName,
            quantity,
            price,
            memo,
          }),
        ),
      }),
    );
  }, [currentEstimateId, estimateTitle, rows, isStorageReady]);

  const buildSavedRows = () =>
    rows
      .filter(hasRowInput)
      .map(({ manufacturer, machineName, quantity, price, memo }) => ({
        maker: manufacturer.trim(),
        machineName: machineName.trim(),
        quantity: quantity.trim(),
        price: price.trim(),
        memo: memo.trim(),
      }));

  const resetEditor = () => {
    setCurrentEstimateId(null);
    setEstimateTitle('');
    setRows(createInitialRows(minimumRegisterRowCount));
  };

  const createEstimateRecord = (
    id: number,
    createdAt: string,
  ): EstimateRecord => ({
    id,
    createdAt,
    updatedAt: new Date().toISOString(),
    templateName: '簡単見積りテンプレート',
    title: estimateTitle.trim(),
    rows: buildSavedRows(),
  });

  const updateRow = <K extends keyof EstimateRow>(
    rowId: number,
    key: K,
    value: EstimateRow[K],
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId ? { ...row, [key]: value } : row,
      ),
    );
  };

  const handleAddRow = () => {
    setRows((currentRows) => [
      ...currentRows,
      {
        id: currentRows.length + 1,
        manufacturer: '',
        machineName: '',
        quantity: '',
        price: '',
        memo: '',
      },
    ]);
  };

  const openSearchModal = (rowId: number) => {
    setSearchTargetRowId(rowId);
    setSearchKeyword('');
    setIsSearchModalOpen(true);
  };

  const applyMachineToRow = (machine: MachineOption) => {
    if (searchTargetRowId === null) return;
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === searchTargetRowId
          ? {
              ...row,
              machineName: machine.machineName,
              manufacturer: machine.manufacturer,
            }
          : row,
      ),
    );
    setIsSearchModalOpen(false);
  };

  const setFieldRef = (
    rowId: number,
    field: EnterNavigationField,
    element: HTMLInputElement | null,
  ) => {
    fieldRefs.current[`${rowId}:${field}`] = element;
  };

  const handleCellKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: EnterNavigationField,
  ) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const currentFieldIndex = enterNavigationFields.indexOf(field);
    const nextField = enterNavigationFields[currentFieldIndex + 1];

    if (nextField) {
      const nextTarget =
        fieldRefs.current[`${rows[rowIndex]?.id}:${nextField}`];
      nextTarget?.focus();
      return;
    }

    const nextRow = rows[rowIndex + 1];
    if (!nextRow) return;
    fieldRefs.current[`${nextRow.id}:manufacturer`]?.focus();
  };

  const handleOpenProductPage = (row: EstimateRow) => {
    const params = new URLSearchParams({ sort: 'price_asc' });
    if (row.machineName.trim()) {
      params.set('estimateMachineName', row.machineName.trim());
    }
    if (row.manufacturer.trim()) {
      params.set('estimateMaker', row.manufacturer.trim());
    }
    window.open(
      `/market/products?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const handleDownloadTemplate = () => {
    const dataRows = Array.from({ length: templateRowCount }, (_, index) => [
      String(index + 1),
      '',
      '',
      '',
      '',
    ]);
    downloadTemplateWorkbook(dataRows, 'estimate-template.xlsx');
  };

  const handleExportExcel = () => {
    const exportRows = rows
      .filter(hasTemplateExportInput)
      .map((row, index) => [
        String(index + 1),
        row.manufacturer.trim(),
        row.machineName.trim(),
        row.quantity.trim(),
        row.memo.trim(),
      ]);

    downloadTemplateWorkbook(exportRows, 'estimate-export.xlsx');
  };

  const handleSaveAsNewEstimate = () => {
    if (!estimateTitle.trim()) return;

    const nextRecord = createEstimateRecord(
      Date.now(),
      new Date().toISOString(),
    );

    setEstimateRecords((currentRecords) => [nextRecord, ...currentRecords]);
    setCurrentEstimateId(nextRecord.id);
    setStatusMessage({
      type: 'success',
      text: `「${nextRecord.title}」を新規保存しました`,
    });
    setActiveTab('list');
  };

  const handleOverwriteEstimate = () => {
    if (currentEstimateId === null || !estimateTitle.trim()) return;

    let updatedTitle = estimateTitle.trim();
    setEstimateRecords((currentRecords) =>
      currentRecords.map((record) => {
        if (record.id !== currentEstimateId) return record;

        const nextRecord = {
          ...record,
          title: updatedTitle,
          templateName: '簡単見積りテンプレート',
          updatedAt: new Date().toISOString(),
          rows: buildSavedRows(),
        };

        updatedTitle = nextRecord.title;
        return nextRecord;
      }),
    );
    setStatusMessage({
      type: 'success',
      text: `「${updatedTitle}」を上書き保存しました`,
    });
    setActiveTab('list');
  };

  const handleCancelEdit = () => {
    resetEditor();
    setStatusMessage({
      type: 'success',
      text: '編集中の内容をリセットしました',
    });
  };

  const resetRowsWithImportedData = (
    importRows: Array<{
      manufacturer: string;
      machineName: string;
      quantity: string;
      memo: string;
    }>,
  ) => {
    setRows(
      buildEditableRows(
        importRows.map((row) => ({
          manufacturer: row.manufacturer,
          machineName: row.machineName,
          quantity: row.quantity,
          price: '',
          memo: row.memo,
        })),
      ),
    );
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    setStatusMessage(null);

    if (!file) {
      setSelectedFileName('ファイル未選択');
      return;
    }

    setSelectedFileName(file.name);
    setIsImporting(true);

    try {
      const importedRows = await parseEstimateImportFile(file);
      resetRowsWithImportedData(importedRows);
      setCurrentEstimateId(null);
      setStatusMessage({
        type: 'success',
        text: `${importedRows.length}件取り込みました`,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: '取込みに失敗しました。テンプレート形式をご確認ください。',
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleOpenEstimate = (record: EstimateRecord) => {
    setCurrentEstimateId(record.id);
    setEstimateTitle(record.title);
    setRows(buildEditableRows(record.rows));
    setStatusMessage({
      type: 'success',
      text: `「${record.title}」を読み込みました`,
    });
    setActiveTab('register');
  };

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 text-neutral-900">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">簡単見積り</h1>
        <p className="mt-1 text-sm text-slate-600">
          複数機種の価格をまとめて入力できます。
        </p>
      </header>

      <div className="mb-4 inline-flex rounded-md border border-slate-300 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('register')}
          className={`rounded px-4 py-1.5 text-sm font-medium transition ${
            activeTab === 'register'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          登録
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`rounded px-4 py-1.5 text-sm font-medium transition ${
            activeTab === 'list'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          一覧
        </button>
      </div>

      {activeTab === 'register' && (
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
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
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
            </div>
            {(isImporting || statusMessage) && (
              <div className="w-full text-sm">
                {isImporting ? (
                  <p className="text-slate-600">取込中...</p>
                ) : statusMessage ? (
                  <p
                    className={
                      statusMessage.type === 'error'
                        ? 'text-red-600'
                        : 'text-emerald-600'
                    }
                  >
                    {statusMessage.text}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="w-16 border-b border-slate-200 px-2 py-2 font-semibold">
                    番号
                  </th>
                  <th className="w-36 border-b border-slate-200 px-2 py-2 font-semibold">
                    メーカー
                  </th>
                  <th className="min-w-80 border-b border-slate-200 px-2 py-2 font-semibold">
                    機種名
                  </th>
                  <th className="w-24 border-b border-slate-200 px-2 py-2 font-semibold">
                    台数
                  </th>
                  <th className="w-36 border-b border-slate-200 px-2 py-2 font-semibold">
                    価格
                  </th>
                  <th className="min-w-72 border-b border-slate-200 px-2 py-2 font-semibold">
                    メモ
                  </th>
                  <th className="w-32 border-b border-slate-200 px-2 py-2 font-semibold">
                    相場確認
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    onFocusCapture={() => setFocusedRowId(row.id)}
                    onBlurCapture={(event) => {
                      if (
                        !event.currentTarget.contains(
                          event.relatedTarget as Node | null,
                        )
                      ) {
                        setFocusedRowId(null);
                      }
                    }}
                    className={`border-b border-slate-200 last:border-0 ${
                      focusedRowId === row.id
                        ? 'bg-sky-200/60'
                        : hasRowInput(row)
                          ? 'bg-sky-100'
                          : 'bg-white'
                    }`}
                  >
                    <td className="px-1.5 py-1.5 text-slate-600">
                      {index + 1}
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="text"
                        ref={(element) =>
                          setFieldRef(row.id, 'manufacturer', element)
                        }
                        value={row.manufacturer}
                        onChange={(event) =>
                          updateRow(row.id, 'manufacturer', event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleCellKeyDown(event, index, 'manufacturer')
                        }
                        className={tableInputClass}
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          ref={(element) =>
                            setFieldRef(row.id, 'machineName', element)
                          }
                          value={row.machineName}
                          onChange={(event) =>
                            updateRow(row.id, 'machineName', event.target.value)
                          }
                          onKeyDown={(event) =>
                            handleCellKeyDown(event, index, 'machineName')
                          }
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
                        ref={(element) =>
                          setFieldRef(row.id, 'quantity', element)
                        }
                        value={row.quantity}
                        onChange={(event) =>
                          updateRow(row.id, 'quantity', event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleCellKeyDown(event, index, 'quantity')
                        }
                        className={`${tableInputClass} w-16`}
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="number"
                        placeholder="価格入力"
                        ref={(element) => setFieldRef(row.id, 'price', element)}
                        value={row.price}
                        onChange={(event) =>
                          updateRow(row.id, 'price', event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleCellKeyDown(event, index, 'price')
                        }
                        className={`${tableInputClass} text-right`}
                      />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input
                        type="text"
                        ref={(element) => setFieldRef(row.id, 'memo', element)}
                        value={row.memo}
                        onChange={(event) =>
                          updateRow(row.id, 'memo', event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleCellKeyDown(event, index, 'memo')
                        }
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

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex min-w-[16rem] flex-col gap-1 text-sm text-slate-700">
              <span className="font-medium">タイトル</span>
              <input
                type="text"
                value={estimateTitle}
                onChange={(event) => setEstimateTitle(event.target.value)}
                placeholder="例：3/18見積り"
                className="h-9 rounded-md border border-slate-300 px-3 text-sm text-slate-800 outline-none transition focus:border-sky-400"
              />
            </label>
            <div className="flex min-h-9 items-end pb-2">
              <p className="text-xs text-slate-500">
                {currentEstimateId !== null
                  ? `編集中: ${estimateTitle.trim() || '未設定タイトル'}（既存データ）`
                  : '新規作成中'}
              </p>
            </div>
            {currentEstimateId !== null && (
              <button
                type="button"
                onClick={handleOverwriteEstimate}
                disabled={!estimateTitle.trim()}
                className="inline-flex h-9 items-center rounded-md border border-emerald-600 bg-emerald-600 px-4 text-sm text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-emerald-300 disabled:bg-emerald-300"
              >
                上書き保存
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveAsNewEstimate}
              disabled={!estimateTitle.trim()}
              className="inline-flex h-9 items-center rounded-md border border-blue-600 bg-blue-600 px-4 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-blue-300 disabled:bg-blue-300"
            >
              新規保存
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
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
      )}

      {activeTab === 'list' && (
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            登録済み見積り一覧
          </h2>
          {estimateRecords.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              データはありません
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="w-40 border-b border-slate-200 px-3 py-2 font-semibold">
                      登録日
                    </th>
                    <th className="w-64 border-b border-slate-200 px-3 py-2 font-semibold">
                      テンプレート
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 font-semibold">
                      タイトル
                    </th>
                    <th className="w-24 border-b border-slate-200 px-3 py-2 font-semibold">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estimateRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-slate-200 last:border-0"
                    >
                      <td className="px-3 py-2 text-slate-700">
                        {new Date(record.createdAt).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {record.templateName}
                      </td>
                      <td className="px-3 py-2 text-slate-900">
                        {record.title}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEstimate(record)}
                          className="inline-flex h-7 items-center rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          開く
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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
