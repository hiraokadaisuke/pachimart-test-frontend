"use client";

import { calculateStatementTotals, formatYen } from "@/lib/trade/calcTotals";
import { BuyerContact, ShippingInfo, TradeRecord } from "@/lib/trade/types";

import { ContactSelector } from "./ContactSelector";
import { EditableCellInput } from "./EditableCellInput";
import { ItemsTable } from "./ItemsTable";
import { TotalsBox } from "./TotalsBox";

type StatementDocumentProps = {
  trade: TradeRecord;
  editable?: boolean;
  shipping: ShippingInfo;
  onShippingChange?: (next: ShippingInfo) => void;
  contacts?: BuyerContact[];
  onContactChange?: (name: string) => void;
  onAddContact?: (name: string) => void;
  showValidationErrors?: boolean;
};

const formatDateLabel = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const fallbackTerms =
  "支払条件や返品規定などの固定文言をここに記載します。納品後7日以内の初期不良のみ対応。その他は双方協議の上決定します。";

export function StatementDocument({
  trade,
  editable = false,
  shipping,
  onShippingChange,
  contacts = [],
  onContactChange,
  onAddContact,
  showValidationErrors = false,
}: StatementDocumentProps) {
  const totals = calculateStatementTotals(trade.items, trade.taxRate ?? 0.1);
  const shippingRequired: (keyof ShippingInfo)[] = ["companyName", "address", "tel", "personName"];
  const shippingMissing = shippingRequired.filter((field) => !(shipping[field]?.toString().trim().length));
  const headlineItem = trade.items.find((item) => item.category === "本体") ?? trade.items[0];
  const statusLabelMap: Record<TradeRecord["status"], string> = {
    APPROVAL_REQUIRED: "承認待ち",
    PAYMENT_REQUIRED: "入金待ち",
    CONFIRM_REQUIRED: "発送準備中",
    COMPLETED: "完了",
    CANCELED: "キャンセル",
    DRAFT: "下書き",
    SENT: "送信済み",
  };

  const handleShippingFieldChange = <K extends keyof ShippingInfo>(key: K, value: string) => {
    onShippingChange?.({
      ...shipping,
      [key]: value,
    });
  };

  const handleContactSelect = (value: string) => {
    handleShippingFieldChange("personName", value);
    onContactChange?.(value);
  };

  const issueDate =
    trade.contractDate ??
    (trade.updatedAt ? trade.updatedAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const issueStatus = statusLabelMap[trade.status] ?? trade.status;

  return (
    <div className="statement-sheet">
      <header className="flex flex-col gap-2 border-b-2 border-[#0f1f3c] pb-3">
        <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[12px] text-neutral-700">取引ID：{trade.id}</p>
            <h1 className="mt-1 text-xl font-bold text-[#0f1f3c]">届いた依頼 明細書</h1>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-right text-[12px] text-neutral-900">
            <p>発行日：{formatDateLabel(issueDate)}</p>
            <p>状態：{issueStatus}</p>
          </div>
        </div>
        <p className="text-[12px] text-neutral-800">
          売主が入力した依頼内容を確認し、発送先と担当者を入力のうえ承認してください。
        </p>
      </header>

      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded border border-slate-400">
          <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">取引概要</div>
          <div className="grid grid-cols-1 gap-2 p-3 text-[12px] md:grid-cols-2">
            <CompactFact label="機種カテゴリ" value={headlineItem?.category ?? "-"} />
            <CompactFact label="メーカー" value={headlineItem?.maker ?? "-"} />
            <CompactFact label="機種名" value={headlineItem?.itemName ?? "-"} />
            <CompactFact label="台数" value={headlineItem?.qty != null ? `${headlineItem.qty} 台` : "-"} />
            <CompactFact label="単価" value={headlineItem?.unitPrice != null ? formatYen(headlineItem.unitPrice) : "-"} />
            <CompactFact label="合計金額（税込）" value={formatYen(totals.total)} />
            <CompactFact label="備考" value={headlineItem?.note ?? trade.remarks ?? "-"} />
            <CompactFact label="税率" value={`${((trade.taxRate ?? 0.1) * 100).toFixed(0)}%`} />
          </div>
        </div>
        <div className="rounded border border-slate-400">
          <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">スケジュール / 支払条件</div>
          <div className="grid grid-cols-1 gap-2 p-3 text-[12px] md:grid-cols-2">
            <CompactFact label="発送予定日" value={formatDateLabel(trade.shipmentDate ?? trade.removalDate)} />
            <CompactFact label="先撤去日" value={formatDateLabel(trade.preRemovalDate ?? trade.removalDate)} />
            <CompactFact label="支払条件" value={trade.paymentTerms ?? trade.paymentMethod ?? "未設定"} />
            <CompactFact label="成約日" value={formatDateLabel(trade.contractDate)} />
            <CompactFact label="作成日時" value={formatDateLabel(trade.createdAt)} />
            <CompactFact label="更新日時" value={formatDateLabel(trade.updatedAt)} />
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
        <ItemsTable items={trade.items} taxRate={trade.taxRate} />
        <TotalsBox totals={totals} />
      </section>

      <section className="mt-4 rounded border border-slate-400">
        <div className="flex items-center justify-between bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">
          <span>発送先・担当者</span>
          {showValidationErrors && shippingMissing.length > 0 && (
            <span className="text-[11px] text-red-100">未入力の項目があります</span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
          <div className="space-y-1 text-[12px]">
            <label className="block text-[12px] font-semibold text-neutral-900">発送先 会社名</label>
            {editable ? (
              <EditableCellInput
                value={shipping.companyName ?? ""}
                onChange={(value) => handleShippingFieldChange("companyName", value)}
                placeholder="株式会社〇〇"
                className={showValidationErrors && shippingMissing.includes("companyName") ? "ring-1 ring-red-400" : ""}
              />
            ) : (
              <p className="statement-readonly-field">{shipping.companyName || "-"}</p>
            )}
            {showValidationErrors && shippingMissing.includes("companyName") && (
              <p className="text-[11px] text-red-600">必須入力です</p>
            )}
          </div>
          <div className="space-y-1 text-[12px]">
            <label className="block text-[12px] font-semibold text-neutral-900">郵便番号</label>
            {editable ? (
              <EditableCellInput
                value={shipping.zip ?? ""}
                onChange={(value) => handleShippingFieldChange("zip", value)}
                placeholder="000-0000"
              />
            ) : (
              <p className="statement-readonly-field">{shipping.zip || "-"}</p>
            )}
          </div>
          <div className="space-y-1 text-[12px]">
            <label className="block text-[12px] font-semibold text-neutral-900">住所</label>
            {editable ? (
              <EditableCellInput
                value={shipping.address ?? ""}
                onChange={(value) => handleShippingFieldChange("address", value)}
                placeholder="都道府県から建物名まで入力"
                className={showValidationErrors && shippingMissing.includes("address") ? "ring-1 ring-red-400" : ""}
              />
            ) : (
              <p className="statement-readonly-field">{shipping.address || "-"}</p>
            )}
            {showValidationErrors && shippingMissing.includes("address") && (
              <p className="text-[11px] text-red-600">必須入力です</p>
            )}
          </div>
          <div className="space-y-1 text-[12px]">
            <label className="block text-[12px] font-semibold text-neutral-900">TEL</label>
            {editable ? (
              <EditableCellInput
                value={shipping.tel ?? ""}
                onChange={(value) => handleShippingFieldChange("tel", value)}
                placeholder="03-1234-5678"
                className={showValidationErrors && shippingMissing.includes("tel") ? "ring-1 ring-red-400" : ""}
              />
            ) : (
              <p className="statement-readonly-field">{shipping.tel || "-"}</p>
            )}
            {showValidationErrors && shippingMissing.includes("tel") && (
              <p className="text-[11px] text-red-600">必須入力です</p>
            )}
          </div>
          <div className="space-y-1 text-[12px] md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-semibold text-neutral-900">担当者（買主）</label>
              {trade.buyerContactName && !editable && (
                <span className="text-[11px] text-neutral-500">前回入力：{trade.buyerContactName}</span>
              )}
            </div>
            {editable ? (
              <ContactSelector
                contacts={contacts}
                value={shipping.personName}
                onChange={handleContactSelect}
                onAdd={(name) => onAddContact?.(name)}
                disabled={!editable}
              />
            ) : (
              <p className="statement-readonly-field">{shipping.personName || "-"}</p>
            )}
            {showValidationErrors && shippingMissing.includes("personName") && (
              <p className="text-[11px] text-red-600">担当者名を入力してください</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded border border-slate-400">
          <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">売主</div>
          <div className="space-y-1 p-3 text-[12px] text-neutral-900">
            <InfoRow label="会社名" value={trade.seller.companyName} />
            <InfoRow label="住所" value={trade.seller.address ?? "-"} />
            <InfoRow label="TEL" value={trade.seller.tel ?? "-"} />
            <InfoRow label="FAX" value={trade.seller.fax ?? "-"} />
            <InfoRow label="担当者" value={trade.seller.contactName ?? "-"} />
          </div>
        </div>

        <div className="rounded border border-slate-400">
          <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">買主</div>
          <div className="space-y-1 p-3 text-[12px] text-neutral-900">
            <InfoRow label="会社名" value={trade.buyer.companyName} />
            <InfoRow label="住所" value={trade.buyer.address ?? "-"} />
            <InfoRow label="TEL" value={trade.buyer.tel ?? "-"} />
            <InfoRow label="FAX" value={trade.buyer.fax ?? "-"} />
            <InfoRow label="担当者" value={trade.buyer.contactName ?? "-"} />
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
        <div className="rounded border border-slate-400">
          <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">取引条件</div>
          <div className="h-full bg-slate-50 px-3 py-3 text-[12px] leading-relaxed text-neutral-900">
            {(trade.termsText ?? fallbackTerms).split("\n").map((line, idx) => (
              <p key={`${line}-${idx}`} className="mb-1">
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded border border-slate-400">
          <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">備考</div>
          <div className="bg-white px-3 py-3 text-[12px] text-neutral-900">
            {trade.remarks ? (
              <p className="whitespace-pre-line leading-relaxed">{trade.remarks}</p>
            ) : (
              <p className="text-neutral-500">特記事項なし</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[62px] flex-col justify-center gap-1 rounded border border-slate-200 bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <span className="text-[11px] text-neutral-600">{label}</span>
      <span className="text-[13px] font-semibold text-neutral-900">{value || "-"}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-16 text-neutral-600">{label}</span>
      <span className="flex-1 font-semibold text-neutral-900">{value || "-"}</span>
    </div>
  );
}
