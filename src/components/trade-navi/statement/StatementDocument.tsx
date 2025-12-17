"use client";

import { calculateStatementTotals } from "@/lib/trade/calcTotals";
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
}: StatementDocumentProps) {
  const totals = calculateStatementTotals(trade.items, trade.taxRate ?? 0.1);

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

  return (
    <div className="statement-sheet">
      <header className="flex flex-col gap-2 border-b-2 border-[#0f1f3c] pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] text-neutral-700">取引ID：{trade.id}</p>
            <h1 className="mt-1 text-xl font-bold text-[#0f1f3c]">売買明細書兼請求書</h1>
          </div>
          <div className="text-right text-[12px] text-neutral-900">
            <p>発行日：{formatDateLabel(issueDate)}</p>
            <p>状態：{trade.status}</p>
          </div>
        </div>
        <p className="text-[12px] text-neutral-800">
          下記の通りご請求申し上げます。内容をご確認の上、ご承認をお願いいたします。
        </p>
      </header>

      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
        <ItemsTable items={trade.items} taxRate={trade.taxRate} />
        <TotalsBox totals={totals} />
      </section>

      <section className="mt-4 rounded border border-slate-400">
        <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">発送先・担当者</div>
        <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
          <div className="space-y-2 text-[12px]">
            <label className="block text-[12px] font-semibold text-neutral-900">発送先 会社名</label>
            {editable ? (
              <EditableCellInput
                value={shipping.companyName ?? ""}
                onChange={(value) => handleShippingFieldChange("companyName", value)}
                placeholder="株式会社〇〇"
              />
            ) : (
              <p className="statement-readonly-field">{shipping.companyName || "-"}</p>
            )}
          </div>
          <div className="space-y-2 text-[12px]">
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
          <div className="space-y-2 text-[12px]">
            <label className="block text-[12px] font-semibold text-neutral-900">住所</label>
            {editable ? (
              <EditableCellInput
                value={shipping.address ?? ""}
                onChange={(value) => handleShippingFieldChange("address", value)}
                placeholder="住所を入力"
              />
            ) : (
              <p className="statement-readonly-field">{shipping.address || "-"}</p>
            )}
          </div>
          <div className="space-y-2 text-[12px]">
            <label className="block text-[12px] font-semibold text-neutral-900">TEL</label>
            {editable ? (
              <EditableCellInput
                value={shipping.tel ?? ""}
                onChange={(value) => handleShippingFieldChange("tel", value)}
                placeholder="03-1234-5678"
              />
            ) : (
              <p className="statement-readonly-field">{shipping.tel || "-"}</p>
            )}
          </div>
          <div className="space-y-2 text-[12px] md:col-span-2">
            <label className="block text-[12px] font-semibold text-neutral-900">担当者</label>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-16 text-neutral-600">{label}</span>
      <span className="flex-1 font-semibold text-neutral-900">{value || "-"}</span>
    </div>
  );
}
