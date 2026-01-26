"use client";

import { calculateStatementTotals, formatYen } from "@/lib/dealings/calcTotals";
import { buildTradeDiffNotes } from "@/lib/dealings/diff";
import { deriveTradeStatusFromTodos } from "@/lib/dealings/deriveStatus";
import { BuyerContact, Dealing, ShippingInfo } from "@/lib/dealings/types";

import { ContactSelector } from "./ContactSelector";
import { EditableCellInput } from "./EditableCellInput";
import { ItemsTable } from "./ItemsTable";
import { TotalsBox } from "./TotalsBox";

type StatementDocumentProps = {
  dealing: Dealing;
  editable?: boolean;
  shipping: ShippingInfo;
  onShippingChange?: (next: ShippingInfo) => void;
  contacts?: BuyerContact[];
  onContactChange?: (name: string) => void;
  onAddContact?: (name: string) => void;
};

const formatDateLabel = (value?: string) => {
  if (!value) return "未入力";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const formatDateTimeLabel = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fallbackTerms =
  "支払条件や返品規定などの固定文言をここに記載します。納品後7日以内の初期不良のみ対応。その他は双方協議の上決定します。";

export function StatementDocument({
  dealing,
  editable = false,
  shipping,
  onShippingChange,
  contacts = [],
  onContactChange,
  onAddContact,
}: StatementDocumentProps) {
  const totals = calculateStatementTotals(dealing.items, dealing.taxRate ?? 0.1);

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
    dealing.contractDate ??
    (dealing.updatedAt ? dealing.updatedAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const derivedStatus = deriveTradeStatusFromTodos(dealing);

  const primaryItem = dealing.items[0];
  const paymentTerms = dealing.paymentTerms ?? dealing.paymentMethod ?? "支払条件未設定";
  const diffNotes = buildTradeDiffNotes(dealing, dealing.listingSnapshot ?? null);

  return (
    <div className="statement-sheet">
      <header className="flex flex-col gap-2 border-b-2 border-[#0f1f3c] pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] text-neutral-700">取引ID：{dealing.id}</p>
            <h1 className="mt-1 text-xl font-bold text-[#0f1f3c]">売買明細書兼請求書</h1>
          </div>
          <div className="text-right text-[12px] text-neutral-900">
            <p>発行日：{formatDateLabel(issueDate)}</p>
            <p>状態：{derivedStatus}</p>
          </div>
        </div>
        <p className="text-[12px] text-neutral-800">
          下記の通りご請求申し上げます。内容をご確認の上、ご承認をお願いいたします。
        </p>
      </header>

      <section className="mt-4 rounded border border-slate-400 bg-white">
        <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">取引概要</div>
        <div className="grid grid-cols-1 gap-2 p-3 text-[12px] md:grid-cols-2">
          <InfoRow label="取引ID" value={dealing.id} dense />
          <InfoRow label="合計金額（税込）" value={formatYen(totals.total)} emphasize />
          <InfoRow label="機種カテゴリ" value={dealing.category ?? primaryItem?.category ?? "-"} />
          <InfoRow label="メーカー" value={dealing.makerName ?? primaryItem?.maker ?? "-"} />
          <InfoRow label="機種名" value={dealing.itemName ?? primaryItem?.itemName ?? "-"} />
          <InfoRow
            label="台数"
            value={dealing.quantity?.toString() ?? primaryItem?.qty?.toString() ?? "-"}
            note={diffNotes.quantityNote}
          />
          <InfoRow
            label="単価（参考）"
            value={primaryItem?.unitPrice ? formatYen(primaryItem.unitPrice) : "-"}
            note={diffNotes.unitPriceNote}
          />
          <InfoRow label="支払条件" value={paymentTerms} />
          <InfoRow label="機械発送日" value={formatDateLabel(dealing.shipmentDate)} />
          <InfoRow
            label="受渡方法"
            value={dealing.receiveMethod ?? dealing.shippingMethod ?? "-"}
            note={diffNotes.storageNote}
          />
          <InfoRow label="備考" value={dealing.remarks ?? "特記事項なし"} multiline />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
        <ItemsTable items={dealing.items} taxRate={dealing.taxRate} />
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
            <InfoRow label="会社名" value={dealing.seller.companyName} />
            <InfoRow label="住所" value={dealing.seller.address ?? "-"} />
            <InfoRow label="TEL" value={dealing.seller.tel ?? "-"} />
            <InfoRow label="FAX" value={dealing.seller.fax ?? "-"} />
            <InfoRow label="担当者" value={dealing.seller.contactName ?? "-"} />
          </div>
        </div>

        <div className="rounded border border-slate-400">
          <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">買主</div>
          <div className="space-y-1 p-3 text-[12px] text-neutral-900">
            <InfoRow label="会社名" value={dealing.buyer.companyName} />
            <InfoRow label="住所" value={dealing.buyer.address ?? "-"} />
            <InfoRow label="TEL" value={dealing.buyer.tel ?? "-"} />
            <InfoRow label="FAX" value={dealing.buyer.fax ?? "-"} />
            <InfoRow label="担当者" value={dealing.buyer.contactName ?? "-"} />
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded border border-slate-400">
          <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">スケジュール / 発送</div>
          <div className="space-y-2 p-3 text-[12px] text-neutral-900">
            <InfoRow label="機械発送日" value={formatDateLabel(dealing.shipmentDate)} />
            <InfoRow label="受渡方法" value={dealing.receiveMethod ?? "-"} />
            <InfoRow label="発送手段" value={dealing.shippingMethod ?? "-"} />
            <InfoRow label="書類発送日" value={formatDateLabel(dealing.documentSentDate)} />
            <InfoRow label="書類到着予定" value={formatDateLabel(dealing.documentReceivedDate)} />
            <InfoRow label="現場担当" value={dealing.handlerName ?? "-"} />
          </div>
        </div>

        <div className="rounded border border-slate-400">
          <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">金額・支払条件</div>
          <div className="space-y-2 p-3 text-[12px] text-neutral-900">
            <InfoRow label="支払方法" value={dealing.paymentMethod ?? "-"} />
            <InfoRow label="支払条件" value={paymentTerms} />
            <InfoRow label="成約日" value={formatDateLabel(dealing.contractDate)} />
            <InfoRow label="支払日" value={formatDateLabel(dealing.paymentDate)} />
            <InfoRow label="合計金額（税込）" value={formatYen(totals.total)} emphasize />
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
        <div className="rounded border border-slate-400">
          <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">取引条件</div>
          <div className="h-full bg-slate-50 px-3 py-3 text-[12px] leading-relaxed text-neutral-900">
            {(dealing.termsText ?? fallbackTerms).split("\n").map((line, idx) => (
              <p key={`${line}-${idx}`} className="mb-1">
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded border border-slate-400">
          <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">備考</div>
          <div className="bg-white px-3 py-3 text-[12px] text-neutral-900">
            {dealing.remarks ? (
              <p className="whitespace-pre-line leading-relaxed">{dealing.remarks}</p>
            ) : (
              <p className="text-neutral-500">特記事項なし</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-4 rounded border border-slate-400">
        <div className="bg-[#0f1f3c] px-3 py-2 text-[12px] font-semibold text-white">タイムスタンプ</div>
        <div className="grid grid-cols-1 gap-2 p-3 text-[12px] md:grid-cols-2">
          <InfoRow label="作成日時" value={formatDateTimeLabel(dealing.createdAt)} dense />
          <InfoRow label="更新日時" value={formatDateTimeLabel(dealing.updatedAt)} dense />
          <InfoRow label="成約日" value={formatDateLabel(dealing.contractDate)} dense />
          <InfoRow label="キャンセル日時" value={formatDateTimeLabel(dealing.canceledAt)} dense />
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  label,
  value,
  multiline = false,
  emphasize = false,
  dense = false,
  note,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  emphasize?: boolean;
  dense?: boolean;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className={`w-24 shrink-0 text-neutral-600 ${dense ? "text-[11px]" : ""}`}>{label}</span>
      <span
        className={`flex-1 whitespace-pre-line ${emphasize ? "font-bold text-indigo-700" : "font-semibold text-neutral-900"} ${
          multiline ? "leading-relaxed" : ""
        }`}
      >
        {value || "-"}
        {note && <p className="text-[11px] font-normal text-neutral-600">{note}</p>}
      </span>
    </div>
  );
}
