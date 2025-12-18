"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { StatusBadge } from "@/components/transactions/StatusBadge";
import { TradeStatusKey } from "@/components/transactions/status";
import { calculateStatementTotals, formatYen } from "@/lib/trade/calcTotals";
import { getActorRole } from "@/lib/trade/navigation";
import { canApprove, canCancel } from "@/lib/trade/permissions";
import {
  addBuyerContact,
  ensureContactsLoaded,
  loadTrade,
  approveTrade,
  saveContactsToTrade,
  cancelTrade,
  updateTradeShipping,
} from "@/lib/trade/storage";
import { BuyerContact, ShippingInfo, TradeRecord } from "@/lib/trade/types";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { getTodoPresentation } from "@/lib/trade/todo";
import { deriveTradeStatusFromTodos } from "@/lib/trade/deriveStatus";

import { StatementDocument } from "./StatementDocument";
import { ItemsTable } from "./ItemsTable";
import { TotalsBox } from "./TotalsBox";
import { EditableCellInput } from "./EditableCellInput";
import { ContactSelector } from "./ContactSelector";

type StatementWorkspaceProps = {
  tradeId: string;
  pageTitle?: string;
  description?: string;
  backHref?: string;
};

const requiredFields: (keyof ShippingInfo)[] = ["companyName", "address", "tel", "personName"];
const requiredFieldLabels: Record<keyof ShippingInfo, string> = {
  companyName: "会社名",
  address: "住所",
  tel: "TEL",
  personName: "担当者",
  zip: "郵便番号",
};

export function StatementWorkspace({ tradeId, pageTitle, description, backHref }: StatementWorkspaceProps) {
  const router = useRouter();
  const currentUser = useCurrentDevUser();
  const [trade, setTrade] = useState<TradeRecord | null>(null);
  const [shipping, setShipping] = useState<ShippingInfo>({});
  const [contacts, setContacts] = useState<BuyerContact[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditingShipping, setIsEditingShipping] = useState(false);

  useEffect(() => {
    const record = loadTrade(tradeId);
    setTrade(record);
    setShipping(record?.buyerShippingAddress ?? record?.shipping ?? {});
    setContacts(ensureContactsLoaded(record));
  }, [tradeId]);

  const actorRole = trade ? getActorRole(trade, currentUser.id) : "none";
  const isEditable = trade ? canApprove(trade, currentUser.id) : false;
  const todoView = trade
    ? getTodoPresentation(trade, actorRole === "seller" ? "seller" : "buyer")
    : null;
  const statusKey: TradeStatusKey | null = todoView?.todoKind ?? null;

  const totals = useMemo(
    () => (trade ? calculateStatementTotals(trade.items, trade.taxRate ?? 0.1) : null),
    [trade]
  );

  const missingFields = useMemo(
    () => requiredFields.filter((field) => !shipping[field] || (shipping[field] ?? "").toString().trim() === ""),
    [shipping]
  );

  const hasShippingDetails = missingFields.length === 0;

  useEffect(() => {
    if (!hasShippingDetails) {
      setIsEditingShipping(true);
    }
  }, [hasShippingDetails]);

  const approveDisabled = !isEditable || missingFields.length > 0 || todoView?.section !== "approval";
  const cancelDisabled = !trade || !canCancel(trade, currentUser.id);

  const handlePrint = () => {
    window.print();
  };

  const handleAddContact = (name: string) => {
    const result = addBuyerContact(tradeId, name);
    if (result.trade && result.contact) {
      setContacts((prev) => [...prev, result.contact!]);
      setShipping((prev) => ({ ...prev, personName: result.contact!.name }));
      setTrade(result.trade);
      setMessage("担当者を追加しました。");
      setError(null);
    }
  };

  const handleContactChange = (value: string) => {
    setShipping((prev) => ({ ...prev, personName: value }));
    const scopedContacts = ensureContactsLoaded(trade);
    if (scopedContacts.length) {
      const normalized = value
        ? scopedContacts.some((contact) => contact.name === value)
          ? scopedContacts
          : [...scopedContacts, { contactId: value, name: value }]
        : scopedContacts;
      setContacts(normalized);
      if (value) saveContactsToTrade(tradeId, normalized);
    }
  };

  const handleApprove = () => {
    if (!trade) return;

    const missing = requiredFields.filter((field) => !shipping[field] || (shipping[field] ?? "").toString().trim() === "");
    if (missing.length > 0) {
      setError("発送先と担当者をすべて入力してください。");
      setMessage(null);
      return;
    }

    const updatedShipping = updateTradeShipping(trade.id, shipping, contacts);
    const updated = approveTrade(trade.id, currentUser.id);

    if (updatedShipping) setShipping(updatedShipping.shipping);

    if (updated) {
      setTrade(updated);
      setMessage("承認しました。ステータスを更新しました。");
      setError(null);
      router.push("/trade-navi?tab=purchaseHistory");
    }
  };

  const handleCancel = () => {
    if (!trade) return;

    const canceled = cancelTrade(trade.id, currentUser.id);
    if (canceled) {
      setTrade(canceled);
      setMessage("依頼をキャンセルしました。");
      setError(null);

      const nextTab = actorRole === "seller" ? "salesHistory" : "purchaseHistory";
      router.push(`/trade-navi?tab=${nextTab}`);
    }
  };

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  if (!trade) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        明細書データが見つかりませんでした。
      </div>
    );
  }

  const headerDescription = (description ?? todoView?.description) || undefined;
  const derivedStatus = deriveTradeStatusFromTodos(trade);

  const cancelBanner =
    derivedStatus === "CANCELED"
      ? `キャンセル済（${trade.canceledBy === "seller" ? "売手" : trade.canceledBy === "buyer" ? "買手" : "不明"}）`
      : null;

  const isApprovalReadOnlyForSeller = todoView?.section === "approval" && actorRole === "seller";

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{pageTitle ?? "明細書"}</h1>
            {statusKey && (
              <span className="text-xs">
                <StatusBadge statusKey={statusKey} context="inProgress" />
              </span>
            )}
          </div>

          {headerDescription && <p className="text-sm text-neutral-800">{headerDescription}</p>}
          {isApprovalReadOnlyForSeller && <p className="text-[11px] text-neutral-600">買主のみ入力・承認できます</p>}
          {cancelBanner && <p className="text-xs font-semibold text-red-700">{cancelBanner}</p>}
        </div>

        <div className="print-hidden flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
            >
              印刷 / PDF保存
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
            >
              戻る
            </button>
            {actorRole !== "none" && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelDisabled}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                キャンセル
              </button>
            )}
          </div>

          {todoView?.todoKind === "application_sent" &&
            todoView?.primaryAction &&
            todoView?.activeTodo &&
            todoView.primaryAction.role === actorRole && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={approveDisabled}
                className="rounded bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {todoView.primaryAction.label}
              </button>
            )}

          {isEditable && approveDisabled && (
            <p className="w-full text-[11px] text-red-700">
              承認には {missingFields.map((field) => requiredFieldLabels[field]).join(" / ")} の入力が必要です。
            </p>
          )}
        </div>
      </div>

      {message && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {totals && (
        <div className="space-y-4">
          <div className="space-y-3 print:hidden">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 text-[12px] text-neutral-900 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryTile label="買主" value={trade.buyer.companyName} />
                <SummaryTile label="売主" value={trade.seller.companyName} />
                <SummaryTile label="合計（税込）" value={formatYen(totals.total)} emphasize />
              </div>
            </div>

            <ShippingSection
              shipping={shipping}
              onShippingChange={setShipping}
              isEditing={isEditingShipping}
              onEditToggle={setIsEditingShipping}
              onContactChange={handleContactChange}
              contacts={contacts}
              onAddContact={handleAddContact}
              highlightMissing={!hasShippingDetails}
            />

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
              <ItemsTable items={trade.items} taxRate={trade.taxRate} />
              <TotalsBox totals={totals} />
            </div>
          </div>

          <div className="hidden print:block">
            <StatementDocument
              trade={trade}
              editable={false}
              shipping={shipping}
              onShippingChange={setShipping}
              contacts={contacts}
              onContactChange={handleContactChange}
              onAddContact={handleAddContact}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTile({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold text-neutral-600">{label}</p>
      <p className={`mt-1 truncate text-sm font-bold ${emphasize ? "text-indigo-700" : "text-neutral-900"}`}>{value}</p>
    </div>
  );
}

function ShippingSection({
  shipping,
  onShippingChange,
  isEditing,
  onEditToggle,
  contacts,
  onContactChange,
  onAddContact,
  highlightMissing,
}: {
  shipping: ShippingInfo;
  onShippingChange: (next: ShippingInfo) => void;
  isEditing: boolean;
  onEditToggle: (next: boolean) => void;
  contacts: BuyerContact[];
  onContactChange: (name: string) => void;
  onAddContact: (name: string) => void;
  highlightMissing?: boolean;
}) {
  const handleFieldChange = <K extends keyof ShippingInfo>(key: K, value: string) => {
    onShippingChange({
      ...shipping,
      [key]: value,
    });
  };

  const actionLabel = isEditing ? "入力完了" : "編集";

  return (
    <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-neutral-900">発送先・担当者</p>
          <p className="text-[11px] text-neutral-600">入力済みの場合は確認用にテキスト表示します</p>
          {highlightMissing && (
            <p className="text-[11px] font-semibold text-red-700">発送先・担当者の入力が必要です</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onEditToggle(!isEditing)}
          className="text-[11px] font-semibold text-indigo-700 hover:underline"
        >
          {actionLabel}
        </button>
      </div>

      <div className="grid gap-3 text-[12px] sm:grid-cols-2">
        <ShippingField
          label="会社名"
          value={shipping.companyName}
          placeholder="株式会社〇〇"
          isEditing={isEditing}
          onChange={(val) => handleFieldChange("companyName", val)}
        />
        <ShippingField
          label="郵便番号"
          value={shipping.zip}
          placeholder="000-0000"
          isEditing={isEditing}
          onChange={(val) => handleFieldChange("zip", val)}
        />
        <ShippingField
          label="住所"
          value={shipping.address}
          placeholder="住所を入力"
          isEditing={isEditing}
          onChange={(val) => handleFieldChange("address", val)}
        />
        <ShippingField
          label="TEL"
          value={shipping.tel}
          placeholder="03-1234-5678"
          isEditing={isEditing}
          onChange={(val) => handleFieldChange("tel", val)}
        />
        <div className="sm:col-span-2">
          <p className="text-[11px] font-semibold text-neutral-600">担当者</p>
          {isEditing ? (
            <div className="mt-1">
              <ContactSelector
                contacts={contacts}
                value={shipping.personName}
                onChange={onContactChange}
                onAdd={onAddContact}
                disabled={!isEditing}
              />
            </div>
          ) : (
            <p className="mt-1 rounded bg-slate-50 px-3 py-2 text-neutral-900">{shipping.personName || "-"}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ShippingField({
  label,
  value,
  placeholder,
  isEditing,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-neutral-600">{label}</p>
      {isEditing ? (
        <EditableCellInput value={value ?? ""} onChange={onChange} placeholder={placeholder} />
      ) : (
        <p className="rounded bg-slate-50 px-3 py-2 text-neutral-900">{value || "-"}</p>
      )}
    </div>
  );
}
