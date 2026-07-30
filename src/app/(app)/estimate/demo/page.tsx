'use client';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  FileDown,
  GripVertical,
  ListPlus,
  Mail,
  Navigation,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type EstimateRow = {
  id: number;
  maker: string;
  machine: string;
  quantity: string;
  price: string;
  memo: string;
};

type WorkflowKind = 'send' | 'listing' | 'navi';
type WorkflowStep = 1 | 2 | 3;

type WorkflowForm = {
  destination: string;
  contact: string;
  date: string;
  option: string;
  note: string;
};

const storageKey = 'estimate-workflow-demo:rows';
const inputClass =
  'h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700';

const initialRows: EstimateRow[] = [
  {
    id: 1,
    maker: '銀座',
    machine: 'P真北斗無双3ジャギの逆襲GEE',
    quantity: '2',
    price: '138000',
    memo: '枠色は要確認',
  },
  {
    id: 2,
    maker: 'サミー',
    machine: 'スマスロ北斗の拳',
    quantity: '3',
    price: '265000',
    memo: '8月上旬出庫予定',
  },
  {
    id: 3,
    maker: '三共',
    machine: 'eフィーバーからくりサーカス2 魔王ver.',
    quantity: '1',
    price: '420000',
    memo: '',
  },
  {
    id: 4,
    maker: '平和',
    machine: 'L ToLOVEるダークネス',
    quantity: '2',
    price: '315000',
    memo: '書類あり',
  },
  ...Array.from({ length: 6 }, (_, index) => ({
    id: index + 5,
    maker: '',
    machine: '',
    quantity: '',
    price: '',
    memo: '',
  })),
];

function toNumber(value: string) {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasInput(row: EstimateRow) {
  return Boolean(
    row.maker.trim() ||
      row.machine.trim() ||
      row.quantity.trim() ||
      row.price.trim() ||
      row.memo.trim(),
  );
}

function formatYen(value: number) {
  return `${value.toLocaleString('ja-JP')}円`;
}

function workflowName(kind: WorkflowKind) {
  if (kind === 'send') return '見積りを送信';
  if (kind === 'listing') return '一括掲載';
  return '一括ナビ作成';
}

function workflowDefaults(kind: WorkflowKind): WorkflowForm {
  if (kind === 'send') {
    return {
      destination: '株式会社サンプル商事',
      contact: '山田様',
      date: '',
      option: 'PDF',
      note: 'お世話になっております。下記機種のお見積りをご確認ください。',
    };
  }
  if (kind === 'listing') {
    return {
      destination: 'パチマート・関西',
      contact: '大阪倉庫',
      date: '',
      option: '下書き',
      note: '掲載前に内容を確認してください。',
    };
  }
  return {
    destination: '株式会社サンプル商事',
    contact: '山田様',
    date: '',
    option: '直接決済',
    note: '',
  };
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function PreviewTable({ rows }: { rows: EstimateRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-600">
          <tr>
            <th className="px-3 py-2 font-semibold">機種</th>
            <th className="w-20 px-3 py-2 text-right font-semibold">台数</th>
            <th className="w-32 px-3 py-2 text-right font-semibold">単価</th>
            <th className="w-36 px-3 py-2 text-right font-semibold">小計</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-200">
              <td className="px-3 py-2">
                <p className="font-medium text-slate-900">{row.machine}</p>
                <p className="text-xs text-slate-500">{row.maker}</p>
              </td>
              <td className="px-3 py-2 text-right">{toNumber(row.quantity)}台</td>
              <td className="px-3 py-2 text-right">{formatYen(toNumber(row.price))}</td>
              <td className="px-3 py-2 text-right font-semibold">
                {formatYen(toNumber(row.quantity) * toNumber(row.price))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkflowModal({
  kind,
  step,
  rows,
  title,
  form,
  onChange,
  onStepChange,
  onClose,
  onComplete,
}: {
  kind: WorkflowKind;
  step: WorkflowStep;
  rows: EstimateRow[];
  title: string;
  form: WorkflowForm;
  onChange: (next: WorkflowForm) => void;
  onStepChange: (step: WorkflowStep) => void;
  onClose: () => void;
  onComplete: () => void;
}) {
  const Icon = kind === 'send' ? Mail : kind === 'listing' ? ListPlus : Navigation;
  const totalQuantity = rows.reduce((sum, row) => sum + toNumber(row.quantity), 0);
  const totalAmount = rows.reduce(
    (sum, row) => sum + toNumber(row.quantity) * toNumber(row.price),
    0,
  );
  const destinationLabel = kind === 'listing' ? '掲載エリア' : '会社名';
  const contactLabel = kind === 'listing' ? '倉庫' : '担当者';
  const dateLabel =
    kind === 'send' ? '見積有効期限' : kind === 'listing' ? '撤去日' : '支払予定日';
  const optionLabel =
    kind === 'send' ? '添付形式' : kind === 'listing' ? '登録状態' : '決済方法';
  const options =
    kind === 'send'
      ? ['PDF', 'Excel', 'PDF・Excel']
      : kind === 'listing'
        ? ['下書き', '公開']
        : ['直接決済', 'あんしん決済'];
  const steps = [
    { number: 1 as const, label: '対象を確認' },
    { number: 2 as const, label: '条件を設定' },
    { number: 3 as const, label: '最終確認' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-900 p-2 text-white">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{workflowName(kind)}</h2>
              <p className="mt-1 text-sm text-slate-500">
                UI・操作確認用です。実際の送信や登録は行いません。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="grid grid-cols-3 gap-3">
            {steps.map((item) => {
              const current = step === item.number;
              const done = step > item.number;
              return (
                <div
                  key={item.number}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    current
                      ? 'border-sky-300 bg-white font-semibold text-sky-800'
                      : done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-transparent text-slate-400'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      current
                        ? 'bg-sky-600 text-white'
                        : done
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200'
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : item.number}
                  </span>
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                一覧でチェックした機種を対象にしています。対象を変更する場合は一度閉じてください。
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard label="対象機種" value={`${rows.length}機種`} />
                <SummaryCard label="合計台数" value={`${totalQuantity}台`} />
                <SummaryCard label="合計金額" value={formatYen(totalAmount)} />
              </div>
              <PreviewTable rows={rows} />
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className={labelClass}>{destinationLabel} *</span>
                  {kind === 'listing' ? (
                    <select
                      className={inputClass}
                      value={form.destination}
                      onChange={(event) =>
                        onChange({ ...form, destination: event.target.value })
                      }
                    >
                      <option value="">選択してください</option>
                      <option value="パチマート・関東">関東</option>
                      <option value="パチマート・関西">関西</option>
                      <option value="パチマート・九州">九州</option>
                    </select>
                  ) : (
                    <input
                      className={inputClass}
                      value={form.destination}
                      onChange={(event) =>
                        onChange({ ...form, destination: event.target.value })
                      }
                      placeholder="会社名を検索・入力"
                    />
                  )}
                </label>
                <label>
                  <span className={labelClass}>{contactLabel}</span>
                  <input
                    className={inputClass}
                    value={form.contact}
                    onChange={(event) => onChange({ ...form, contact: event.target.value })}
                    placeholder={kind === 'listing' ? '例：大阪倉庫' : '担当者名'}
                  />
                </label>
                <label>
                  <span className={labelClass}>{dateLabel}</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.date}
                    onChange={(event) => onChange({ ...form, date: event.target.value })}
                  />
                </label>
                <label>
                  <span className={labelClass}>{optionLabel}</span>
                  <select
                    className={inputClass}
                    value={form.option}
                    onChange={(event) => onChange({ ...form, option: event.target.value })}
                  >
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option === '下書き' ? '下書きで登録（推奨）' : option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className={labelClass}>
                    {kind === 'send'
                      ? '送信メッセージ'
                      : kind === 'listing'
                        ? '掲載共通メモ'
                        : '取引備考'}
                  </span>
                  <textarea
                    className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    value={form.note}
                    onChange={(event) => onChange({ ...form, note: event.target.value })}
                  />
                </label>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold">実装イメージ</h3>
                <p className="text-xs leading-5 text-slate-600">
                  {kind === 'send'
                    ? '相手にはパチマート内通知とメールで案内し、機種ごとに承諾・見送り・価格相談を返せる想定です。'
                    : kind === 'listing'
                      ? '共通条件を一括設定し、枠・書類・出庫手数料など不足項目だけを登録後に個別確認します。'
                      : '選択した複数機種を、1件の取引ナビ内の明細としてまとめて登録します。'}
                </p>
                <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-3 text-xs">
                  <input type="checkbox" defaultChecked />
                  {kind === 'send'
                    ? 'メールでも通知する'
                    : kind === 'listing'
                      ? 'バラ売り可'
                      : '1件のナビにまとめる'}
                </label>
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                  正式実装時は既存の会社・倉庫・担当者データを検索候補に利用します。
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard label="対象機種" value={`${rows.length}機種`} />
                <SummaryCard label="合計台数" value={`${totalQuantity}台`} />
                <SummaryCard label="合計金額" value={formatYen(totalAmount)} />
              </div>
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <PreviewTable rows={rows} />
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
                  <h3 className="text-sm font-bold">設定内容</h3>
                  {[
                    ['タイトル', title || '未設定'],
                    ['処理', workflowName(kind)],
                    [destinationLabel, form.destination || '未設定'],
                    [contactLabel, form.contact || '未設定'],
                    [dateLabel, form.date || '未設定'],
                    [optionLabel, form.option],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2 last:border-0"
                    >
                      <span className="text-slate-500">{label}</span>
                      <span className="text-right font-semibold text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                デモのため、確定しても実際の送信・掲載・ナビ登録は行われません。
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => onStepChange((step - 1) as WorkflowStep)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> {step === 1 ? '閉じる' : '戻る'}
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={step === 2 && !form.destination.trim()}
              onClick={() => onStepChange((step + 1) as WorkflowStep)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              次へ <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Check className="h-4 w-4" /> デモ処理を確定
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EstimateWorkflowDemoPage() {
  const [rows, setRows] = useState<EstimateRow[]>(initialRows);
  const [selectedIds, setSelectedIds] = useState<number[]>([1, 2, 3]);
  const [title, setTitle] = useState('8月上旬 販売見積り');
  const [workflow, setWorkflow] = useState<WorkflowKind | null>(null);
  const [step, setStep] = useState<WorkflowStep>(1);
  const [form, setForm] = useState<WorkflowForm>(workflowDefaults('send'));
  const [toast, setToast] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedRows = window.localStorage.getItem(storageKey);
      if (storedRows) setRows(JSON.parse(storedRows) as EstimateRow[]);
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady || typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(rows));
  }, [rows, storageReady]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filledRows = useMemo(() => rows.filter(hasInput), [rows]);
  const targetRows = useMemo(() => {
    const selected = filledRows.filter((row) => selectedIds.includes(row.id));
    return selected.length > 0 ? selected : filledRows;
  }, [filledRows, selectedIds]);
  const totalQuantity = targetRows.reduce(
    (sum, row) => sum + toNumber(row.quantity),
    0,
  );
  const totalAmount = targetRows.reduce(
    (sum, row) => sum + toNumber(row.quantity) * toNumber(row.price),
    0,
  );

  const updateRow = <K extends keyof EstimateRow>(
    rowId: number,
    key: K,
    value: EstimateRow[K],
  ) => {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
    );
  };

  const openWorkflow = (kind: WorkflowKind) => {
    if (targetRows.length === 0) {
      setToast('対象となる機種を1件以上入力してください');
      return;
    }
    setWorkflow(kind);
    setStep(1);
    setForm(workflowDefaults(kind));
  };

  const downloadCsv = () => {
    const data = [
      ['メーカー', '機種名', '台数', '単価', '小計', 'メモ'],
      ...filledRows.map((row) => [
        row.maker,
        row.machine,
        row.quantity,
        row.price,
        String(toNumber(row.quantity) * toNumber(row.price)),
        row.memo,
      ]),
    ];
    const csv = data
      .map((line) =>
        line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'estimate-workflow-demo.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 py-8 text-slate-900">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">簡単見積り</h1>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
              拡張機能デモ
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            見積りから送信・掲載・取引ナビ作成まで、同じデータを引き継ぎます。
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          <strong>開発確認用：</strong>実際の送信・掲載・ナビ登録は行いません。
          <br />入力内容は、このブラウザ内だけに保存されます。
        </div>
      </header>

      {toast && (
        <div className="fixed right-5 top-24 z-[80] flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-xl">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <div className="mb-4 inline-flex rounded-md border border-slate-300 bg-slate-100 p-1">
        <span className="rounded bg-slate-800 px-4 py-1.5 text-sm font-medium text-white">登録</span>
        <span className="px-4 py-1.5 text-sm font-medium text-slate-500">一覧</span>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setRows((current) => [
                  ...current,
                  {
                    id: current.reduce((max, row) => Math.max(max, row.id), 0) + 1,
                    maker: '',
                    machine: '',
                    quantity: '',
                    price: '',
                    memo: '',
                  },
                ])
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> 行を追加
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => {
                setRows((current) =>
                  current.filter((row) => !selectedIds.includes(row.id)),
                );
                setSelectedIds([]);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-rose-300 bg-white px-3 text-sm text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <Trash2 className="h-4 w-4" /> 選択削除
            </button>
            <button
              type="button"
              onClick={() => setToast('テンプレートDLは既存機能を利用する想定です')}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50"
            >
              <FileDown className="h-4 w-4" /> テンプレDL
            </button>
          </div>
          <button
            type="button"
            onClick={() => setToast('ファイル取込は既存機能を利用する想定です')}
            className="inline-flex h-9 min-w-48 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50"
          >
            ファイルを選択
          </button>
        </div>

        <p className="px-4 pt-3 text-xs text-slate-500">
          チェックした機種だけを各機能へ引き継ぎます。未選択の場合は入力済みの全機種が対象です。
        </p>

        <div className="overflow-x-auto p-4 pt-3">
          <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="w-12 border border-slate-200 px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filledRows.length > 0 &&
                      filledRows.every((row) => selectedIds.includes(row.id))
                    }
                    onChange={(event) =>
                      setSelectedIds(
                        event.target.checked ? filledRows.map((row) => row.id) : [],
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-sky-600"
                    aria-label="入力済みの全機種を選択"
                  />
                </th>
                <th className="w-16 border border-slate-200 px-2 py-2">番号</th>
                <th className="w-36 border border-slate-200 px-2 py-2">メーカー</th>
                <th className="min-w-80 border border-slate-200 px-2 py-2">機種名</th>
                <th className="w-24 border border-slate-200 px-2 py-2">台数</th>
                <th className="w-36 border border-slate-200 px-2 py-2">価格</th>
                <th className="w-40 border border-slate-200 px-2 py-2 text-right">小計</th>
                <th className="min-w-64 border border-slate-200 px-2 py-2">メモ</th>
                <th className="w-28 border border-slate-200 px-2 py-2">相場確認</th>
                <th className="w-14 border border-slate-200 px-2 py-2 text-center">移動</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const selected = selectedIds.includes(row.id);
                const subtotal = toNumber(row.quantity) * toNumber(row.price);
                return (
                  <tr key={row.id} className={selected ? 'bg-sky-50' : 'bg-white'}>
                    <td className="border border-slate-200 px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!hasInput(row)}
                        onChange={(event) =>
                          setSelectedIds((current) =>
                            event.target.checked
                              ? [...new Set([...current, row.id])]
                              : current.filter((id) => id !== row.id),
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 disabled:opacity-30"
                      />
                    </td>
                    <td className="border border-slate-200 px-2 py-1.5 text-slate-600">{index + 1}</td>
                    <td className="border border-slate-200 p-1.5">
                      <input
                        className={inputClass}
                        value={row.maker}
                        onChange={(event) => updateRow(row.id, 'maker', event.target.value)}
                      />
                    </td>
                    <td className="border border-slate-200 p-1.5">
                      <div className="flex gap-1.5">
                        <input
                          className={inputClass}
                          value={row.machine}
                          onChange={(event) =>
                            updateRow(row.id, 'machine', event.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setToast('既存の機種検索を利用する想定です')}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700"
                          aria-label="機種検索"
                        >
                          <Search className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="border border-slate-200 p-1.5">
                      <input
                        type="number"
                        min={1}
                        className={inputClass}
                        value={row.quantity}
                        onChange={(event) =>
                          updateRow(row.id, 'quantity', event.target.value)
                        }
                      />
                    </td>
                    <td className="border border-slate-200 p-1.5">
                      <input
                        type="number"
                        min={0}
                        className={`${inputClass} text-right`}
                        value={row.price}
                        placeholder="価格入力"
                        onChange={(event) => updateRow(row.id, 'price', event.target.value)}
                      />
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right font-semibold">
                      {subtotal ? subtotal.toLocaleString('ja-JP') : '-'}
                    </td>
                    <td className="border border-slate-200 p-1.5">
                      <input
                        className={inputClass}
                        value={row.memo}
                        onChange={(event) => updateRow(row.id, 'memo', event.target.value)}
                      />
                    </td>
                    <td className="border border-slate-200 p-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const params = new URLSearchParams({ sort: 'price_asc' });
                          if (row.machine.trim()) {
                            params.set('estimateMachineName', row.machine.trim());
                          }
                          if (row.maker.trim()) {
                            params.set('estimateMaker', row.maker.trim());
                          }
                          window.open(
                            `/market/products?${params.toString()}`,
                            '_blank',
                            'noopener,noreferrer',
                          );
                        }}
                        className="inline-flex h-8 items-center rounded-md border border-sky-300 bg-white px-2.5 text-xs font-medium text-sky-700 hover:bg-sky-50"
                      >
                        相場確認
                      </button>
                    </td>
                    <td className="border border-slate-200 p-1.5 text-center">
                      <GripVertical className="mx-auto h-4 w-4 text-slate-400" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_auto] xl:items-end">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[280px] flex-1">
                <span className={labelClass}>タイトル</span>
                <input
                  className={inputClass}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>
              <div className="flex gap-2">
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span className="text-xs text-slate-500">対象 </span>
                  <strong>{targetRows.length}機種</strong>
                </div>
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span className="text-xs text-slate-500">台数 </span>
                  <strong>{totalQuantity}台</strong>
                </div>
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span className="text-xs text-slate-500">合計 </span>
                  <strong>{formatYen(totalAmount)}</strong>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setToast('デモ内容をブラウザに保存しました')}
                className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium hover:bg-slate-100"
              >
                <Save className="h-4 w-4" /> 保存
              </button>
              <button
                type="button"
                onClick={downloadCsv}
                className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium hover:bg-slate-100"
              >
                <FileDown className="h-4 w-4" /> Excel出力
              </button>
              <button
                type="button"
                onClick={() => openWorkflow('send')}
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Send className="h-4 w-4" /> 見積りを送信
              </button>
              <button
                type="button"
                onClick={() => openWorkflow('listing')}
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
              >
                <ListPlus className="h-4 w-4" /> 一括掲載
              </button>
              <button
                type="button"
                onClick={() => openWorkflow('navi')}
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Navigation className="h-4 w-4" /> 一括ナビ作成
              </button>
            </div>
          </div>
        </div>
      </section>

      {workflow && (
        <WorkflowModal
          kind={workflow}
          step={step}
          rows={targetRows}
          title={title}
          form={form}
          onChange={setForm}
          onStepChange={setStep}
          onClose={() => {
            setWorkflow(null);
            setStep(1);
          }}
          onComplete={() => {
            setToast(`${workflowName(workflow)}のデモ処理が完了しました`);
            setWorkflow(null);
            setStep(1);
          }}
        />
      )}
    </main>
  );
}
