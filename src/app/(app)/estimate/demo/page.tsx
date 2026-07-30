'use client';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Download,
  ListPlus,
  Mail,
  Navigation,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

type EstimateRow = {
  id: number;
  maker: string;
  machine: string;
  quantity: string;
  price: string;
  memo: string;
};

type WorkflowKind = 'send' | 'listing' | 'navi';

type SendForm = {
  company: string;
  contact: string;
  validUntil: string;
  attachment: 'PDF' | 'Excel' | 'PDF・Excel';
  message: string;
  notifyInApp: boolean;
  notifyByEmail: boolean;
};

type ListingCommon = {
  previousInstallation: string;
  inquiryContact: string;
  splitSale: string;
  pickup: string;
  nailSheet: string;
  shipping: string;
  manual: string;
  handlingFee: string;
  shippingDate: string;
  warehouse: string;
  publishStatus: '下書き' | '公開';
};

type ListingItem = {
  sourceId: number;
  exhibitType: 'パチンコ' | 'スロット';
  previousInstallation: string;
  maker: string;
  machine: string;
  quantity: string;
  bodyType: '本体' | '枠のみ' | 'セルのみ';
  unitPrice: string;
  removalDate: string;
  remarks: string;
  frameColor: string;
  inquiryContact: string;
  splitSale: string;
  pickup: string;
  nailSheet: string;
  shipping: string;
  manual: string;
  handlingFee: string;
  shippingDate: string;
  warehouse: string;
};

type NaviCommon = {
  buyerCompany: string;
  machineShippingMethod: '元払い' | '着払い' | '引取';
  machineShippingDate: string;
  documentShippingMethod: 'PDF送付' | '元払い' | '着払い' | '引取' | '同梱' | '不要';
  paymentDate: string;
  paymentTime: string;
  shippingUnit: string;
  shippingQuantity: string;
  handlingUnit: string;
  handlingQuantity: string;
  cardboardUnit: string;
  cardboardQuantity: string;
  nailSheetUnit: string;
  nailSheetQuantity: string;
  otherUnit: string;
  otherQuantity: string;
  insurance: string;
  tradeConditionCode: string;
  tradeConditionText: string;
  sellerContact: string;
  safePayment: '利用する' | '利用しない';
};

type NaviItem = {
  sourceId: number;
  gameType: 'パチンコ' | 'スロット';
  maker: string;
  machine: string;
  bodyType: '本体' | '枠のみ' | 'セルのみ';
  removalStatus: '未撤去' | '撤去済';
  removalDate: string;
  memo: string;
  specialNotes: string;
  frameColor: string;
  quantity: string;
  unitPrice: string;
};

const storageKey = 'estimate-workflow-demo:rows:v2';
const today = '2026-07-30';
const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100';
const compactInputClass =
  'h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700';
const requiredMark = <span className="ml-1 text-rose-500">必須</span>;

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

const listingCsvHeaders = [
  '出品種別',
  '前設置',
  'メーカー',
  '機種名',
  '出品数',
  '種別',
  '販売単価(税抜)',
  '撤去日',
  '備考欄',
  '枠色',
  '問い合わせ先担当者',
  'バラ売り',
  '引き取り',
  '釘シート',
  '送料',
  '取扱説明書',
  '出庫手数料',
  '発送指定日',
  '保管先倉庫',
] as const;

function toNumber(value: string) {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatYen(value: number) {
  return `${value.toLocaleString('ja-JP')}円`;
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

function inferGameType(machine: string): 'パチンコ' | 'スロット' {
  const normalized = machine.trim().toLowerCase();
  return normalized.startsWith('p') || normalized.startsWith('e')
    ? 'パチンコ'
    : 'スロット';
}

function toListingItem(row: EstimateRow): ListingItem {
  return {
    sourceId: row.id,
    exhibitType: inferGameType(row.machine),
    previousInstallation: '関東',
    maker: row.maker,
    machine: row.machine,
    quantity: row.quantity,
    bodyType: '本体',
    unitPrice: row.price,
    removalDate: '',
    remarks: row.memo,
    frameColor: '',
    inquiryContact: '平岡大祐',
    splitSale: '可',
    pickup: '可',
    nailSheet: '表示しない',
    shipping: '表示しない',
    manual: '表示しない',
    handlingFee: '表示しない',
    shippingDate: '表示しない',
    warehouse: '',
  };
}

function toNaviItem(row: EstimateRow): NaviItem {
  return {
    sourceId: row.id,
    gameType: inferGameType(row.machine),
    maker: row.maker,
    machine: row.machine,
    bodyType: '本体',
    removalStatus: '未撤去',
    removalDate: '',
    memo: row.memo,
    specialNotes: '',
    frameColor: '',
    quantity: row.quantity,
    unitPrice: row.price,
  };
}

function feeTotal(unit: string, quantity: string) {
  return toNumber(unit) * toNumber(quantity);
}

function workflowName(kind: WorkflowKind) {
  if (kind === 'send') return '見積りを送信';
  if (kind === 'listing') return '一括掲載';
  return '一括ナビ作成';
}

function workflowDescription(kind: WorkflowKind) {
  if (kind === 'send') return '相手へ見積りを送り、内容確認や回答につなげます。';
  if (kind === 'listing') return '見積りの情報を引き継ぎ、CSVの不足項目を補って掲載します。';
  return '共通の取引条件と機種別情報を入力し、機種ごとにナビを作成します。';
}

function Field({
  label,
  required,
  hint,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className={labelClass}>
        {label}
        {required ? requiredMark : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-4 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ChoiceGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`inline-flex h-9 items-center rounded-md border px-3 text-sm transition ${
            value === option
              ? 'border-sky-500 bg-sky-50 font-semibold text-sky-800'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {value === option ? <Check className="mr-1.5 h-3.5 w-3.5" /> : null}
          {option}
        </button>
      ))}
    </div>
  );
}

function TargetTable({ rows }: { rows: EstimateRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-600">
          <tr>
            <th className="px-3 py-2 font-semibold">メーカー・機種名</th>
            <th className="w-20 px-3 py-2 text-right font-semibold">台数</th>
            <th className="w-32 px-3 py-2 text-right font-semibold">単価</th>
            <th className="w-36 px-3 py-2 text-right font-semibold">小計</th>
            <th className="min-w-48 px-3 py-2 font-semibold">メモ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-200">
              <td className="px-3 py-2">
                <p className="font-medium text-slate-900">{row.machine || '機種名未入力'}</p>
                <p className="text-xs text-slate-500">{row.maker || 'メーカー未入力'}</p>
              </td>
              <td className="px-3 py-2 text-right">{toNumber(row.quantity)}台</td>
              <td className="px-3 py-2 text-right">{formatYen(toNumber(row.price))}</td>
              <td className="px-3 py-2 text-right font-semibold">
                {formatYen(toNumber(row.quantity) * toNumber(row.price))}
              </td>
              <td className="px-3 py-2 text-xs text-slate-600">{row.memo || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SendSettings({ form, onChange }: { form: SendForm; onChange: (form: SendForm) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
      <Section title="送信先" description="パチマートの登録会社・担当者から選ぶ想定です。">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="会社名" required>
            <input
              className={inputClass}
              value={form.company}
              onChange={(event) => onChange({ ...form, company: event.target.value })}
              placeholder="会社名を検索"
            />
          </Field>
          <Field label="担当者">
            <input
              className={inputClass}
              value={form.contact}
              onChange={(event) => onChange({ ...form, contact: event.target.value })}
              placeholder="担当者名"
            />
          </Field>
          <Field label="見積有効期限">
            <input
              type="date"
              className={inputClass}
              value={form.validUntil}
              onChange={(event) => onChange({ ...form, validUntil: event.target.value })}
            />
          </Field>
          <Field label="添付形式">
            <select
              className={inputClass}
              value={form.attachment}
              onChange={(event) =>
                onChange({ ...form, attachment: event.target.value as SendForm['attachment'] })
              }
            >
              <option>PDF</option>
              <option>Excel</option>
              <option>PDF・Excel</option>
            </select>
          </Field>
          <Field label="送信メッセージ" className="sm:col-span-2">
            <textarea
              className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              value={form.message}
              onChange={(event) => onChange({ ...form, message: event.target.value })}
            />
          </Field>
        </div>
      </Section>
      <Section title="通知方法">
        <div className="space-y-3 text-sm">
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={form.notifyInApp}
              onChange={(event) => onChange({ ...form, notifyInApp: event.target.checked })}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <strong className="block">パチマート内で通知</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                相手の通知一覧に見積りを表示します。
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={form.notifyByEmail}
              onChange={(event) => onChange({ ...form, notifyByEmail: event.target.checked })}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <strong className="block">メールでも通知</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                登録メールアドレスへ案内を送ります。
              </span>
            </span>
          </label>
        </div>
      </Section>
    </div>
  );
}

function ListingCommonSettings({
  form,
  onChange,
}: {
  form: ListingCommon;
  onChange: (form: ListingCommon) => void;
}) {
  const displayOptions = ['表示しない', '無料', '有料'] as const;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
        ここで入力した値を、選択したすべての機種へ一括反映します。機種ごとに異なる内容は次の画面で修正できます。
      </div>
      <Section title="掲載先・担当" description="CSVの共通カラムとして一括設定する項目です。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="前設置">
            <select
              className={inputClass}
              value={form.previousInstallation}
              onChange={(event) => onChange({ ...form, previousInstallation: event.target.value })}
            >
              <option value="">選択してください</option>
              <option>北海道</option>
              <option>東北</option>
              <option>関東</option>
              <option>中部</option>
              <option>関西</option>
              <option>中国</option>
              <option>四国</option>
              <option>九州</option>
            </select>
          </Field>
          <Field label="問い合わせ先担当者">
            <input
              className={inputClass}
              value={form.inquiryContact}
              onChange={(event) => onChange({ ...form, inquiryContact: event.target.value })}
            />
          </Field>
          <Field label="保管先倉庫">
            <input
              className={inputClass}
              value={form.warehouse}
              onChange={(event) => onChange({ ...form, warehouse: event.target.value })}
              placeholder="例：大阪倉庫"
            />
          </Field>
          <Field label="バラ売り">
            <select className={inputClass} value={form.splitSale} onChange={(event) => onChange({ ...form, splitSale: event.target.value })}>
              <option>可</option><option>不可</option>
            </select>
          </Field>
          <Field label="引き取り">
            <select className={inputClass} value={form.pickup} onChange={(event) => onChange({ ...form, pickup: event.target.value })}>
              <option>可</option><option>不可</option>
            </select>
          </Field>
          <Field label="発送指定日">
            <select className={inputClass} value={form.shippingDate} onChange={(event) => onChange({ ...form, shippingDate: event.target.value })}>
              <option>表示しない</option><option>翌日発送</option><option>翌々日発送</option><option>要相談</option>
            </select>
          </Field>
        </div>
      </Section>
      <Section title="付帯条件" description="CSVの釘シート・送料・取扱説明書・出庫手数料へ反映します。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {([
            ['nailSheet', '釘シート'],
            ['shipping', '送料'],
            ['manual', '取扱説明書'],
            ['handlingFee', '出庫手数料'],
          ] as const).map(([key, label]) => (
            <Field key={key} label={label}>
              <select
                className={inputClass}
                value={form[key]}
                onChange={(event) => onChange({ ...form, [key]: event.target.value })}
              >
                {displayOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </Field>
          ))}
        </div>
      </Section>
      <Section title="登録方法">
        <Field label="掲載状態" hint="正式実装では、誤掲載防止のため初期値を下書きにする想定です。">
          <ChoiceGroup
            value={form.publishStatus}
            options={['下書き', '公開'] as const}
            onChange={(value) => onChange({ ...form, publishStatus: value })}
          />
        </Field>
      </Section>
    </div>
  );
}

function ListingItemEditor({
  items,
  onChange,
}: {
  items: ListingItem[];
  onChange: (items: ListingItem[]) => void;
}) {
  const updateItem = <K extends keyof ListingItem>(sourceId: number, key: K, value: ListingItem[K]) => {
    onChange(items.map((item) => (item.sourceId === sourceId ? { ...item, [key]: value } : item)));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        メーカー・機種名・出品数・販売単価・備考は見積りから引き継いでいます。CSVの不足項目を機種ごとに確認してください。
      </div>
      {items.map((item, index) => (
        <section key={item.sourceId} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-sky-700">掲載 {index + 1}</p>
              <h3 className="mt-0.5 font-bold text-slate-900">{item.machine}</h3>
              <p className="text-xs text-slate-500">{item.maker}</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {item.quantity || '0'}台
            </span>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Field label="出品種別" required>
              <select className={compactInputClass} value={item.exhibitType} onChange={(event) => updateItem(item.sourceId, 'exhibitType', event.target.value as ListingItem['exhibitType'])}>
                <option>パチンコ</option><option>スロット</option>
              </select>
            </Field>
            <Field label="前設置">
              <input className={compactInputClass} value={item.previousInstallation} onChange={(event) => updateItem(item.sourceId, 'previousInstallation', event.target.value)} />
            </Field>
            <Field label="種別" required>
              <select className={compactInputClass} value={item.bodyType} onChange={(event) => updateItem(item.sourceId, 'bodyType', event.target.value as ListingItem['bodyType'])}>
                <option>本体</option><option>枠のみ</option><option>セルのみ</option>
              </select>
            </Field>
            <Field label="撤去日">
              <input type="date" className={compactInputClass} value={item.removalDate} onChange={(event) => updateItem(item.sourceId, 'removalDate', event.target.value)} />
            </Field>
            <Field label="出品数" required>
              <input type="number" min="1" className={compactInputClass} value={item.quantity} onChange={(event) => updateItem(item.sourceId, 'quantity', event.target.value)} />
            </Field>
            <Field label="販売単価（税抜）" required>
              <input type="number" min="0" className={compactInputClass} value={item.unitPrice} onChange={(event) => updateItem(item.sourceId, 'unitPrice', event.target.value)} />
            </Field>
            <Field label="枠色">
              <input className={compactInputClass} value={item.frameColor} onChange={(event) => updateItem(item.sourceId, 'frameColor', event.target.value)} placeholder="例：メインパネル" />
            </Field>
            <Field label="問い合わせ先担当者">
              <input className={compactInputClass} value={item.inquiryContact} onChange={(event) => updateItem(item.sourceId, 'inquiryContact', event.target.value)} />
            </Field>
            <Field label="保管先倉庫">
              <input className={compactInputClass} value={item.warehouse} onChange={(event) => updateItem(item.sourceId, 'warehouse', event.target.value)} />
            </Field>
            <Field label="バラ売り">
              <select className={compactInputClass} value={item.splitSale} onChange={(event) => updateItem(item.sourceId, 'splitSale', event.target.value)}><option>可</option><option>不可</option></select>
            </Field>
            <Field label="引き取り">
              <select className={compactInputClass} value={item.pickup} onChange={(event) => updateItem(item.sourceId, 'pickup', event.target.value)}><option>可</option><option>不可</option></select>
            </Field>
            <Field label="発送指定日">
              <select className={compactInputClass} value={item.shippingDate} onChange={(event) => updateItem(item.sourceId, 'shippingDate', event.target.value)}><option>表示しない</option><option>翌日発送</option><option>翌々日発送</option><option>要相談</option></select>
            </Field>
            <Field label="釘シート">
              <select className={compactInputClass} value={item.nailSheet} onChange={(event) => updateItem(item.sourceId, 'nailSheet', event.target.value)}><option>表示しない</option><option>無料</option><option>有料</option></select>
            </Field>
            <Field label="送料">
              <select className={compactInputClass} value={item.shipping} onChange={(event) => updateItem(item.sourceId, 'shipping', event.target.value)}><option>表示しない</option><option>無料</option><option>有料</option></select>
            </Field>
            <Field label="取扱説明書">
              <select className={compactInputClass} value={item.manual} onChange={(event) => updateItem(item.sourceId, 'manual', event.target.value)}><option>表示しない</option><option>無料</option><option>有料</option></select>
            </Field>
            <Field label="出庫手数料">
              <select className={compactInputClass} value={item.handlingFee} onChange={(event) => updateItem(item.sourceId, 'handlingFee', event.target.value)}><option>表示しない</option><option>無料</option><option>有料</option></select>
            </Field>
            <Field label="備考欄" className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <textarea className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" value={item.remarks} onChange={(event) => updateItem(item.sourceId, 'remarks', event.target.value)} />
            </Field>
          </div>
        </section>
      ))}
    </div>
  );
}

function ListingPreview({ items, status }: { items: ListingItem[]; status: ListingCommon['publishStatus'] }) {
  const rows = items.map((item) => [
    item.exhibitType,
    item.previousInstallation,
    item.maker,
    item.machine,
    item.quantity,
    item.bodyType,
    item.unitPrice,
    item.removalDate,
    item.remarks,
    item.frameColor,
    item.inquiryContact,
    item.splitSale,
    item.pickup,
    item.nailSheet,
    item.shipping,
    item.manual,
    item.handlingFee,
    item.shippingDate,
    item.warehouse,
  ]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="掲載件数" value={`${items.length}件`} />
        <SummaryCard label="合計台数" value={`${items.reduce((sum, item) => sum + toNumber(item.quantity), 0)}台`} />
        <SummaryCard label="登録状態" value={status} />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="font-bold">掲載CSVプレビュー</h3>
            <p className="mt-1 text-xs text-slate-500">添付CSVと同じ19カラムで確認できます。</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">横スクロール</span>
        </div>
        <div className="max-h-[46vh] overflow-auto">
          <table className="min-w-[2500px] border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-100 text-left text-slate-700">
              <tr>
                {listingCsvHeaders.map((header) => <th key={header} className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 font-semibold">{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={items[rowIndex].sourceId} className="border-b border-slate-200">
                  {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="max-w-72 whitespace-pre-wrap border-r border-slate-100 px-3 py-2 align-top">{cell || '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FeeRow({
  label,
  required,
  unit,
  quantity,
  onUnitChange,
  onQuantityChange,
}: {
  label: string;
  required?: boolean;
  unit: string;
  quantity: string;
  onUnitChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[130px_1fr_1fr_140px] items-end gap-3 border-b border-slate-100 py-3 last:border-0">
      <div className="pb-2 text-sm font-semibold text-slate-700">
        {label}{required ? requiredMark : null}
      </div>
      <Field label="単価">
        <div className="relative">
          <input type="number" min="0" className={`${compactInputClass} pr-8 text-right`} value={unit} onChange={(event) => onUnitChange(event.target.value)} placeholder="0" />
          <span className="absolute right-3 top-2 text-xs text-slate-400">円</span>
        </div>
      </Field>
      <Field label="数量">
        <input type="number" min="0" className={`${compactInputClass} text-right`} value={quantity} onChange={(event) => onQuantityChange(event.target.value)} placeholder="0" />
      </Field>
      <div className="pb-2 text-right">
        <p className="text-[11px] text-slate-500">合計金額</p>
        <p className="mt-1 font-bold text-slate-900">{formatYen(feeTotal(unit, quantity))}</p>
      </div>
    </div>
  );
}

function NaviCommonSettings({
  form,
  onChange,
  totalQuantity,
}: {
  form: NaviCommon;
  onChange: (form: NaviCommon) => void;
  totalQuantity: number;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
        共通条件は1回だけ入力し、選択した機種ごとに別々のナビを作成する想定です。台数・単価・物件情報は次の画面で機種別に確認します。
      </div>
      <Section title="取引先情報" description="買手の担当者と発送先は、買手が承認するときに入力します。">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="取引先（買手）会社名" required hint="取引依頼を送信する会社を選択してください。">
            <div className="relative">
              <input className={`${inputClass} pl-10`} value={form.buyerCompany} onChange={(event) => onChange({ ...form, buyerCompany: event.target.value })} placeholder="会社名を検索" />
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            </div>
          </Field>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <dl className="space-y-2">
              <div className="flex gap-4"><dt className="w-20 font-semibold text-slate-600">担当者</dt><dd>未入力（買手が承認時に入力）</dd></div>
              <div className="flex gap-4"><dt className="w-20 font-semibold text-slate-600">発送先</dt><dd>未入力（買手が承認時に入力）</dd></div>
              <div className="flex gap-4"><dt className="w-20 font-semibold text-slate-600">自社</dt><dd>株式会社王宮（入力者情報）</dd></div>
            </dl>
          </div>
        </div>
      </Section>

      <Section title="発送・支払条件" description="機種ごとに作成するナビへ、同じ条件を反映します。">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border border-slate-200 p-4">
            <Field label="機械の発送方法" required>
              <ChoiceGroup value={form.machineShippingMethod} options={['元払い', '着払い', '引取'] as const} onChange={(value) => onChange({ ...form, machineShippingMethod: value })} />
            </Field>
            <Field label="機械発送日" required>
              <input type="date" className={inputClass} value={form.machineShippingDate} onChange={(event) => onChange({ ...form, machineShippingDate: event.target.value })} />
            </Field>
          </div>
          <div className="space-y-4 rounded-lg border border-slate-200 p-4">
            <Field label="書類の発送方法" required>
              <select className={inputClass} value={form.documentShippingMethod} onChange={(event) => onChange({ ...form, documentShippingMethod: event.target.value as NaviCommon['documentShippingMethod'] })}>
                <option>PDF送付</option><option>元払い</option><option>着払い</option><option>引取</option><option>同梱</option><option>不要</option>
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="支払日" required>
                <input type="date" className={inputClass} value={form.paymentDate} onChange={(event) => onChange({ ...form, paymentDate: event.target.value })} />
              </Field>
              <Field label="支払時間">
                <select className={inputClass} value={form.paymentTime} onChange={(event) => onChange({ ...form, paymentTime: event.target.value })}>
                  <option value="">—</option><option>午前中</option><option>15時まで</option><option>営業時間内</option>
                </select>
              </Field>
            </div>
          </div>
        </div>
      </Section>

      <Section title="送料・付帯費用" description={`現在の対象は合計${totalQuantity}台です。数量の初期値へ反映しています。`}>
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <FeeRow label="機械の送料" required unit={form.shippingUnit} quantity={form.shippingQuantity} onUnitChange={(value) => onChange({ ...form, shippingUnit: value })} onQuantityChange={(value) => onChange({ ...form, shippingQuantity: value })} />
            <FeeRow label="出庫手数料" required unit={form.handlingUnit} quantity={form.handlingQuantity} onUnitChange={(value) => onChange({ ...form, handlingUnit: value })} onQuantityChange={(value) => onChange({ ...form, handlingQuantity: value })} />
            <FeeRow label="段ボール" unit={form.cardboardUnit} quantity={form.cardboardQuantity} onUnitChange={(value) => onChange({ ...form, cardboardUnit: value })} onQuantityChange={(value) => onChange({ ...form, cardboardQuantity: value })} />
            <FeeRow label="釘シート" unit={form.nailSheetUnit} quantity={form.nailSheetQuantity} onUnitChange={(value) => onChange({ ...form, nailSheetUnit: value })} onQuantityChange={(value) => onChange({ ...form, nailSheetQuantity: value })} />
            <FeeRow label="その他" unit={form.otherUnit} quantity={form.otherQuantity} onUnitChange={(value) => onChange({ ...form, otherUnit: value })} onQuantityChange={(value) => onChange({ ...form, otherQuantity: value })} />
          </div>
        </div>
        <div className="mt-4 max-w-sm">
          <Field label="保険（非課税）">
            <div className="relative">
              <input type="number" min="0" className={`${inputClass} pr-9 text-right`} value={form.insurance} onChange={(event) => onChange({ ...form, insurance: event.target.value })} />
              <span className="absolute right-3 top-3 text-xs text-slate-400">円</span>
            </div>
          </Field>
        </div>
      </Section>

      <Section title="取引条件">
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <Field label="取引条件" required>
              <select className={inputClass} value={form.tradeConditionCode} onChange={(event) => onChange({ ...form, tradeConditionCode: event.target.value })}>
                <option>0427～</option><option>標準条件</option><option>現状渡し</option>
              </select>
            </Field>
            <button type="button" className="text-left text-sm font-semibold text-sky-700 hover:underline">取引条件の登録はこちら</button>
          </div>
          <Field label="条件本文">
            <textarea className="min-h-44 w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" value={form.tradeConditionText} onChange={(event) => onChange({ ...form, tradeConditionText: event.target.value })} />
          </Field>
        </div>
      </Section>

      <Section title="担当者（売手）・決済方法">
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="担当者（売手）" required hint="取引締結書等に表示する売手側の担当者です。">
            <select className={inputClass} value={form.sellerContact} onChange={(event) => onChange({ ...form, sellerContact: event.target.value })}>
              <option>平岡大祐</option><option>担当者A</option><option>担当者B</option>
            </select>
          </Field>
          <Field label="安心決済利用">
            <ChoiceGroup value={form.safePayment} options={['利用する', '利用しない'] as const} onChange={(value) => onChange({ ...form, safePayment: value })} />
          </Field>
        </div>
      </Section>
    </div>
  );
}

function NaviItemEditor({ items, onChange }: { items: NaviItem[]; onChange: (items: NaviItem[]) => void }) {
  const updateItem = <K extends keyof NaviItem>(sourceId: number, key: K, value: NaviItem[K]) => {
    onChange(items.map((item) => (item.sourceId === sourceId ? { ...item, [key]: value } : item)));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        以下の物件情報はナビごとに異なるため、機種別に入力します。見積りのメーカー・機種名・台数・単価・メモは引き継いでいます。
      </div>
      {items.map((item, index) => (
        <section key={item.sourceId} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-violet-700">作成予定ナビ {index + 1}</p>
              <h3 className="mt-0.5 font-bold text-slate-900">{item.machine}</h3>
              <p className="text-xs text-slate-500">{item.maker}</p>
            </div>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">1件のナビとして作成</span>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Field label="分類" required>
              <ChoiceGroup value={item.gameType} options={['パチンコ', 'スロット'] as const} onChange={(value) => updateItem(item.sourceId, 'gameType', value)} />
            </Field>
            <Field label="種別" required>
              <select className={compactInputClass} value={item.bodyType} onChange={(event) => updateItem(item.sourceId, 'bodyType', event.target.value as NaviItem['bodyType'])}>
                <option>本体</option><option>枠のみ</option><option>セルのみ</option>
              </select>
            </Field>
            <Field label="撤去状況" required>
              <ChoiceGroup value={item.removalStatus} options={['未撤去', '撤去済'] as const} onChange={(value) => updateItem(item.sourceId, 'removalStatus', value)} />
            </Field>
            <Field label="撤去日" hint="日付が決まっている場合に入力します。">
              <input type="date" className={compactInputClass} value={item.removalDate} onChange={(event) => updateItem(item.sourceId, 'removalDate', event.target.value)} />
            </Field>
            <Field label="メーカー" required>
              <input className={compactInputClass} value={item.maker} onChange={(event) => updateItem(item.sourceId, 'maker', event.target.value)} />
            </Field>
            <Field label="機種名" required className="sm:col-span-2">
              <input className={compactInputClass} value={item.machine} onChange={(event) => updateItem(item.sourceId, 'machine', event.target.value)} />
            </Field>
            <Field label="枠色">
              <input className={compactInputClass} value={item.frameColor} onChange={(event) => updateItem(item.sourceId, 'frameColor', event.target.value)} />
            </Field>
            <Field label="台数" required>
              <input type="number" min="1" className={compactInputClass} value={item.quantity} onChange={(event) => updateItem(item.sourceId, 'quantity', event.target.value)} />
            </Field>
            <Field label="売却単価" required>
              <div className="relative">
                <input type="number" min="0" className={`${compactInputClass} pr-8 text-right`} value={item.unitPrice} onChange={(event) => updateItem(item.sourceId, 'unitPrice', event.target.value)} />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400">円</span>
              </div>
            </Field>
            <Field label="備考" className="sm:col-span-2">
              <textarea className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" value={item.memo} onChange={(event) => updateItem(item.sourceId, 'memo', event.target.value)} />
            </Field>
            <Field label="特記事項" className="sm:col-span-2">
              <textarea className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" value={item.specialNotes} onChange={(event) => updateItem(item.sourceId, 'specialNotes', event.target.value)} />
            </Field>
          </div>
        </section>
      ))}
    </div>
  );
}

function NaviPreview({ items, form }: { items: NaviItem[]; form: NaviCommon }) {
  const productTotal = items.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice), 0);
  const taxableFees =
    feeTotal(form.shippingUnit, form.shippingQuantity) +
    feeTotal(form.handlingUnit, form.handlingQuantity) +
    feeTotal(form.cardboardUnit, form.cardboardQuantity) +
    feeTotal(form.nailSheetUnit, form.nailSheetQuantity) +
    feeTotal(form.otherUnit, form.otherQuantity);
  const subtotal = productTotal + taxableFees;
  const tax = Math.floor(subtotal * 0.1);
  const grandTotal = subtotal + tax + toNumber(form.insurance);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="作成するナビ" value={`${items.length}件`} />
          <SummaryCard label="合計台数" value={`${items.reduce((sum, item) => sum + toNumber(item.quantity), 0)}台`} />
          <SummaryCard label="商品代金合計" value={formatYen(productTotal)} />
        </div>
        <Section title="作成予定ナビ一覧" description="選択した機種ごとに1件ずつ作成します。">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-600">
                <tr><th className="px-3 py-2">機種</th><th className="px-3 py-2">分類・種別</th><th className="px-3 py-2 text-right">台数</th><th className="px-3 py-2 text-right">単価</th><th className="px-3 py-2">撤去</th></tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.sourceId} className="border-t border-slate-200">
                    <td className="px-3 py-2"><p className="font-semibold">{item.machine}</p><p className="text-xs text-slate-500">{item.maker}</p></td>
                    <td className="px-3 py-2">{item.gameType}・{item.bodyType}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}台</td>
                    <td className="px-3 py-2 text-right">{formatYen(toNumber(item.unitPrice))}</td>
                    <td className="px-3 py-2">{item.removalStatus}{item.removalDate ? `（${item.removalDate}）` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
        <Section title="共通条件">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ['取引先（買手）', form.buyerCompany],
              ['機械発送', `${form.machineShippingMethod}・${form.machineShippingDate}`],
              ['書類発送', form.documentShippingMethod],
              ['支払日', `${form.paymentDate}${form.paymentTime ? ` ${form.paymentTime}` : ''}`],
              ['取引条件', form.tradeConditionCode],
              ['担当者（売手）', form.sellerContact],
              ['安心決済', form.safePayment],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold">{value || '未設定'}</dd></div>
            ))}
          </dl>
        </Section>
      </div>
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-0">
        <h3 className="text-lg font-bold">金額内訳</h3>
        <p className="mt-1 text-xs text-slate-500">共通入力内容から試算しています。</p>
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm">
          {[
            ['商品代金合計', productTotal],
            ['機械送料', feeTotal(form.shippingUnit, form.shippingQuantity)],
            ['出庫手数料', feeTotal(form.handlingUnit, form.handlingQuantity)],
            ['段ボール', feeTotal(form.cardboardUnit, form.cardboardQuantity)],
            ['釘シート', feeTotal(form.nailSheetUnit, form.nailSheetQuantity)],
            ['その他', feeTotal(form.otherUnit, form.otherQuantity)],
            ['小計（税抜）', subtotal],
            ['消費税（10%）', tax],
            ['保険（非課税）', toNumber(form.insurance)],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><span className="font-semibold">{formatYen(Number(value))}</span></div>
          ))}
          <div className="flex justify-between border-t-2 border-slate-300 pt-4 text-lg font-bold"><span>合計</span><span>{formatYen(grandTotal)}</span></div>
        </div>
      </aside>
    </div>
  );
}

function WorkflowModal({
  kind,
  rows,
  title,
  onClose,
  onComplete,
}: {
  kind: WorkflowKind;
  rows: EstimateRow[];
  title: string;
  onClose: () => void;
  onComplete: (message: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [sendForm, setSendForm] = useState<SendForm>({
    company: '株式会社サンプル商事',
    contact: '山田様',
    validUntil: '2026-08-06',
    attachment: 'PDF',
    message: 'お世話になっております。下記機種のお見積りをご確認ください。',
    notifyInApp: true,
    notifyByEmail: true,
  });
  const [listingCommon, setListingCommon] = useState<ListingCommon>({
    previousInstallation: '関東',
    inquiryContact: '平岡大祐',
    splitSale: '可',
    pickup: '可',
    nailSheet: '表示しない',
    shipping: '表示しない',
    manual: '表示しない',
    handlingFee: '表示しない',
    shippingDate: '表示しない',
    warehouse: '',
    publishStatus: '下書き',
  });
  const [listingItems, setListingItems] = useState<ListingItem[]>(() => rows.map(toListingItem));
  const totalQuantity = rows.reduce((sum, row) => sum + toNumber(row.quantity), 0);
  const [naviCommon, setNaviCommon] = useState<NaviCommon>({
    buyerCompany: '株式会社サンプル商事',
    machineShippingMethod: '元払い',
    machineShippingDate: today,
    documentShippingMethod: 'PDF送付',
    paymentDate: today,
    paymentTime: '',
    shippingUnit: '0',
    shippingQuantity: String(totalQuantity),
    handlingUnit: '0',
    handlingQuantity: String(totalQuantity),
    cardboardUnit: '0',
    cardboardQuantity: '0',
    nailSheetUnit: '0',
    nailSheetQuantity: '0',
    otherUnit: '0',
    otherQuantity: '0',
    insurance: '0',
    tradeConditionCode: '0427～',
    tradeConditionText: '※ 欠品・欠損等のご連絡は、商品到着日より３日以内にお願い致します。\n　それ以降の返品・交換は一切出来ません。\n※ 遊技に支障のない焦げ、キズ、劣化等に関しましては、保障対象外とさせて頂きます。\n　尚、申請後（仮申請・QR読み取り含む）に関しましても保障対象外とさせて頂きます。\n※ ご入金は、発送日の午前中までにお願い致します。\n　確認が取れない場合は、発送日を変更させて頂きます。',
    sellerContact: '平岡大祐',
    safePayment: '利用する',
  });
  const [naviItems, setNaviItems] = useState<NaviItem[]>(() => rows.map(toNaviItem));

  const isSend = kind === 'send';
  const maxStep = isSend ? 3 : 4;
  const steps = isSend
    ? ['対象を確認', '送信設定', '最終確認']
    : kind === 'listing'
      ? ['対象を確認', '共通設定', '機種別情報', 'CSV確認']
      : ['対象を確認', '共通条件', '機種別情報', '最終確認'];
  const totalAmount = rows.reduce((sum, row) => sum + toNumber(row.quantity) * toNumber(row.price), 0);
  const Icon = kind === 'send' ? Mail : kind === 'listing' ? ListPlus : Navigation;

  const applyListingCommon = () => {
    setListingItems((current) =>
      current.map((item) => ({
        ...item,
        previousInstallation: listingCommon.previousInstallation,
        inquiryContact: listingCommon.inquiryContact,
        splitSale: listingCommon.splitSale,
        pickup: listingCommon.pickup,
        nailSheet: listingCommon.nailSheet,
        shipping: listingCommon.shipping,
        manual: listingCommon.manual,
        handlingFee: listingCommon.handlingFee,
        shippingDate: listingCommon.shippingDate,
        warehouse: listingCommon.warehouse,
      })),
    );
  };

  const canAdvance = () => {
    if (step === 2 && kind === 'send') return sendForm.company.trim().length > 0;
    if (step === 2 && kind === 'navi') {
      return Boolean(
        naviCommon.buyerCompany.trim() &&
          naviCommon.machineShippingDate &&
          naviCommon.paymentDate &&
          naviCommon.tradeConditionCode &&
          naviCommon.sellerContact,
      );
    }
    if (step === 3 && kind === 'listing') {
      return listingItems.every((item) => item.maker.trim() && item.machine.trim() && toNumber(item.quantity) > 0 && toNumber(item.unitPrice) >= 0);
    }
    if (step === 3 && kind === 'navi') {
      return naviItems.every((item) => item.maker.trim() && item.machine.trim() && toNumber(item.quantity) > 0 && toNumber(item.unitPrice) > 0);
    }
    return true;
  };

  const goNext = () => {
    if (!canAdvance()) return;
    if (kind === 'listing' && step === 2) applyListingCommon();
    setStep((current) => Math.min(maxStep, current + 1));
  };

  const finish = () => {
    const message =
      kind === 'send'
        ? `「${title || '無題の見積り'}」を送信するデモを完了しました`
        : kind === 'listing'
          ? `${listingItems.length}件を${listingCommon.publishStatus}で一括掲載するデモを完了しました`
          : `${naviItems.length}件のナビを一括作成するデモを完了しました`;
    onComplete(message);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/50 p-2 sm:p-4">
      <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-900 p-2.5 text-white"><Icon className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-bold sm:text-xl">{workflowName(kind)}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{workflowDescription(kind)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="閉じる"><X className="h-5 w-5" /></button>
        </header>

        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className={`grid gap-2 ${maxStep === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {steps.map((label, index) => {
              const number = index + 1;
              const current = step === number;
              const done = step > number;
              return (
                <div key={label} className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-2 text-xs sm:px-3 sm:text-sm ${current ? 'border-sky-300 bg-sky-50 font-semibold text-sky-800' : done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}`}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${current ? 'bg-sky-600 text-white' : done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{done ? <Check className="h-3.5 w-3.5" /> : number}</span>
                  <span className="truncate">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">一覧でチェックした機種を対象にしています。対象を変更する場合は一度閉じてください。</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard label="対象機種" value={`${rows.length}機種`} />
                <SummaryCard label="合計台数" value={`${totalQuantity}台`} />
                <SummaryCard label="商品代金合計" value={formatYen(totalAmount)} />
              </div>
              <TargetTable rows={rows} />
              {kind === 'listing' ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600">見積りから引き継ぐ項目：メーカー、機種名、出品数、販売単価、メモ。残りはCSVカラムに合わせて次画面で入力します。</div> : null}
              {kind === 'navi' ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600">作成方式：選択した機種ごとに1件ずつナビを作成し、共通条件を各ナビへコピーします。</div> : null}
            </div>
          ) : null}

          {kind === 'send' && step === 2 ? <SendSettings form={sendForm} onChange={setSendForm} /> : null}
          {kind === 'send' && step === 3 ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <TargetTable rows={rows} />
              <Section title="送信内容">
                <dl className="space-y-3 text-sm">
                  {[
                    ['タイトル', title || '未設定'],
                    ['会社名', sendForm.company],
                    ['担当者', sendForm.contact || '未設定'],
                    ['有効期限', sendForm.validUntil || '未設定'],
                    ['添付形式', sendForm.attachment],
                    ['通知', [sendForm.notifyInApp ? 'パチマート内' : '', sendForm.notifyByEmail ? 'メール' : ''].filter(Boolean).join('・') || 'なし'],
                  ].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>)}
                </dl>
              </Section>
            </div>
          ) : null}

          {kind === 'listing' && step === 2 ? <ListingCommonSettings form={listingCommon} onChange={setListingCommon} /> : null}
          {kind === 'listing' && step === 3 ? <ListingItemEditor items={listingItems} onChange={setListingItems} /> : null}
          {kind === 'listing' && step === 4 ? <ListingPreview items={listingItems} status={listingCommon.publishStatus} /> : null}

          {kind === 'navi' && step === 2 ? <NaviCommonSettings form={naviCommon} onChange={setNaviCommon} totalQuantity={totalQuantity} /> : null}
          {kind === 'navi' && step === 3 ? <NaviItemEditor items={naviItems} onChange={setNaviItems} /> : null}
          {kind === 'navi' && step === 4 ? <NaviPreview items={naviItems} form={naviCommon} /> : null}
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <button type="button" onClick={step === 1 ? onClose : () => setStep((current) => Math.max(1, current - 1))} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" />{step === 1 ? '閉じる' : '戻る'}</button>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-amber-700 sm:flex"><CircleAlert className="h-4 w-4" />実際の送信・登録は行いません</span>
            {step < maxStep ? (
              <button type="button" disabled={!canAdvance()} onClick={goNext} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">次へ<ArrowRight className="h-4 w-4" /></button>
            ) : (
              <button type="button" onClick={finish} className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"><Check className="h-4 w-4" />デモ処理を確定</button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function EstimateWorkflowDemoPage() {
  const [rows, setRows] = useState<EstimateRow[]>(initialRows);
  const [selectedIds, setSelectedIds] = useState<number[]>([1, 2, 3]);
  const [title, setTitle] = useState('8月上旬 販売見積り');
  const [workflow, setWorkflow] = useState<WorkflowKind | null>(null);
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
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filledRows = useMemo(() => rows.filter(hasInput), [rows]);
  const targetRows = useMemo(() => {
    const selected = filledRows.filter((row) => selectedIds.includes(row.id));
    return selected.length > 0 ? selected : filledRows;
  }, [filledRows, selectedIds]);
  const totalQuantity = targetRows.reduce((sum, row) => sum + toNumber(row.quantity), 0);
  const totalAmount = targetRows.reduce((sum, row) => sum + toNumber(row.quantity) * toNumber(row.price), 0);

  const updateRow = <K extends keyof EstimateRow>(rowId: number, key: K, value: EstimateRow[K]) => {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  };

  const addRow = () => {
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
    ]);
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    setRows((current) => current.filter((row) => !selectedIds.includes(row.id)));
    setSelectedIds([]);
    setToast(`${selectedIds.length}行を削除しました`);
  };

  const openWorkflow = (kind: WorkflowKind) => {
    if (targetRows.length === 0) {
      setToast('対象となる機種を1件以上入力してください');
      return;
    }
    setWorkflow(kind);
  };

  const downloadCsv = () => {
    const data = [
      ['メーカー', '機種名', '台数', '単価', '小計', 'メモ'],
      ...filledRows.map((row) => [row.maker, row.machine, row.quantity, row.price, String(toNumber(row.quantity) * toNumber(row.price)), row.memo]),
    ];
    const csv = data.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
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
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">拡張機能デモ</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">見積りの入力内容を、送信・掲載・取引ナビ作成へ引き継ぎます。</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900"><strong>開発確認用：</strong>既存機能、API、DBには接続していません。<br />入力内容はこのデモ画面内だけで利用します。</div>
      </header>

      {toast ? <div className="fixed right-5 top-24 z-[80] flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-xl"><Check className="h-4 w-4" />{toast}</div> : null}

      <div className="mb-4 inline-flex rounded-md border border-slate-300 bg-slate-100 p-1"><span className="rounded bg-slate-800 px-4 py-1.5 text-sm font-medium text-white">登録</span><span className="px-4 py-1.5 text-sm font-medium text-slate-500">一覧</span></div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addRow} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"><Plus className="h-4 w-4" />行を追加</button>
            <button type="button" onClick={deleteSelected} disabled={selectedIds.length === 0} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-rose-300 bg-white px-3 text-sm text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"><Trash2 className="h-4 w-4" />選択削除</button>
            <button type="button" className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50">テンプレDL</button>
          </div>
          <div className="flex min-w-[300px] flex-1 items-center justify-end gap-2"><button type="button" className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50">ファイルを選択</button><span className="inline-flex h-9 min-w-[220px] items-center rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">ファイル未選択</span></div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1180px] border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-700">
              <tr>
                <th className="w-12 border-b border-slate-200 px-3 py-2 text-center"><input type="checkbox" checked={filledRows.length > 0 && filledRows.every((row) => selectedIds.includes(row.id))} onChange={(event) => setSelectedIds(event.target.checked ? filledRows.map((row) => row.id) : [])} /></th>
                <th className="w-14 border-b border-slate-200 px-2 py-2">番号</th><th className="w-40 border-b border-slate-200 px-2 py-2">メーカー</th><th className="min-w-80 border-b border-slate-200 px-2 py-2">機種名</th><th className="w-24 border-b border-slate-200 px-2 py-2">台数</th><th className="w-36 border-b border-slate-200 px-2 py-2">価格</th><th className="min-w-72 border-b border-slate-200 px-2 py-2">メモ</th><th className="w-28 border-b border-slate-200 px-2 py-2">相場確認</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className={`border-b border-slate-200 ${hasInput(row) ? 'bg-sky-50/60' : 'bg-white'}`}>
                  <td className="px-3 py-1.5 text-center"><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? Array.from(new Set([...current, row.id])) : current.filter((id) => id !== row.id))} /></td>
                  <td className="px-2 py-1.5 text-slate-500">{index + 1}</td>
                  <td className="px-2 py-1.5"><input className={compactInputClass} value={row.maker} onChange={(event) => updateRow(row.id, 'maker', event.target.value)} /></td>
                  <td className="px-2 py-1.5"><div className="flex gap-1.5"><input className={compactInputClass} value={row.machine} onChange={(event) => updateRow(row.id, 'machine', event.target.value)} /><button type="button" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700"><Search className="h-4 w-4" /></button></div></td>
                  <td className="px-2 py-1.5"><input type="number" min="1" className={`${compactInputClass} text-right`} value={row.quantity} onChange={(event) => updateRow(row.id, 'quantity', event.target.value)} /></td>
                  <td className="px-2 py-1.5"><input type="number" min="0" className={`${compactInputClass} text-right`} value={row.price} onChange={(event) => updateRow(row.id, 'price', event.target.value)} placeholder="価格入力" /></td>
                  <td className="px-2 py-1.5"><input className={compactInputClass} value={row.memo} onChange={(event) => updateRow(row.id, 'memo', event.target.value)} /></td>
                  <td className="px-2 py-1.5"><button type="button" className="inline-flex h-8 items-center rounded-md border border-sky-300 bg-white px-2.5 text-xs font-medium text-sky-700 hover:bg-sky-50">相場確認</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_auto] xl:items-end">
            <div className="flex flex-wrap items-end gap-3">
              <Field label="タイトル" className="min-w-[260px] flex-1"><input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：8月上旬 販売見積り" /></Field>
              <button type="button" className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">保存</button>
              <button type="button" onClick={downloadCsv} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" />Excel出力</button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-4"><div><p className="text-xs font-semibold text-slate-500">選択中</p><p className="text-sm font-bold">{targetRows.length}機種・{totalQuantity}台・{formatYen(totalAmount)}</p></div><span className="text-[11px] text-slate-500">未選択時は入力済み全件</span></div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => openWorkflow('send')} className="inline-flex h-10 items-center gap-2 rounded-md border border-sky-600 bg-white px-4 text-sm font-semibold text-sky-700 hover:bg-sky-50"><Mail className="h-4 w-4" />見積りを送信</button>
                <button type="button" onClick={() => openWorkflow('listing')} className="inline-flex h-10 items-center gap-2 rounded-md border border-amber-500 bg-amber-50 px-4 text-sm font-semibold text-amber-800 hover:bg-amber-100"><ListPlus className="h-4 w-4" />一括掲載</button>
                <button type="button" onClick={() => openWorkflow('navi')} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"><Navigation className="h-4 w-4" />一括ナビ作成</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          ['見積りを送信', '送信先・期限・添付形式・通知方法を確認して送信します。'],
          ['一括掲載', 'CSVの19カラムに不足する共通項目と機種別項目を補います。'],
          ['一括ナビ作成', '取引条件を1回入力し、機種ごとに別ナビをまとめて作成します。'],
        ].map(([heading, description]) => <div key={heading} className="rounded-lg border border-slate-200 bg-white px-4 py-3"><p className="text-sm font-bold">{heading}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>)}
      </div>

      {workflow ? <WorkflowModal key={workflow} kind={workflow} rows={targetRows} title={title} onClose={() => setWorkflow(null)} onComplete={(message) => { setWorkflow(null); setToast(message); }} /> : null}
    </main>
  );
}
