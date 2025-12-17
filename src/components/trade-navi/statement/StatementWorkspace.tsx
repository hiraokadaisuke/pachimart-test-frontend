"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { StatusBadge } from "@/components/transactions/StatusBadge";
import { calculateStatementTotals, formatYen } from "@/lib/trade/calcTotals";
import {
  addBuyerContact,
  ensureContactsLoaded,
  loadTrade,
  approveTrade,
  saveContactsToTrade,
  updateTradeShipping,
  cancelTrade,
} from "@/lib/trade/storage";
import { BuyerContact, ShippingInfo, TradeRecord } from "@/lib/trade/types";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { TradeStatusKey } from "@/components/transactions/status";

import { StatementDocument } from "./StatementDocument";

type StatementWorkspaceProps = {
  tradeId: string;
  pageTitle?: string;
  description?: string;
  backHref?: string;
};

const requiredFields: (keyof ShippingInfo)[] = ["companyName", "address", "tel", "personName"];

export function StatementWorkspace({ tradeId, pageTitle, description, backHref }: StatementWorkspaceProps) {
  const router = useRouter();
  const currentUser = useCurrentDevUser();
  const [trade, setTrade] = useState<TradeRecord | null>(null);
  const [shipping, setShipping] = useState<ShippingInfo>({});
  const [contacts, setContacts] = useState<BuyerContact[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const record = loadTrade(tradeId);
    setTrade(record);
    setShipping(record?.shipping ?? {});
    setContacts(ensureContactsLoaded(record));
  }, [tradeId]);

  const isBuyer = trade?.buyer.userId === currentUser.id;
  const isEditable = trade?.status === "APPROVAL_REQUIRED" && isBuyer;
  const totals = useMemo(
    () => (trade ? calculateStatementTotals(trade.items, trade.taxRate ?? 0.1) : null),
    [trade]
  );

  const missingFields = useMemo(
    () => requiredFields.filter((field) => !(shipping[field]?.toString().trim().length ?? 0)),
    [shipping]
  );
  const canApprove = isEditable && missingFields.length === 0;

  const statusKey = trade ? mapTradeStatus(trade.status) : null;

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (!trade) return;
    const updated = updateTradeShipping(trade.id, shipping, contacts);
    if (updated) {
      setTrade(updated);
      setMessage("発送先情報を保存しました。");
      setError(null);
    } else {
      setError("発送先情報の保存に失敗しました。");
    }
  };

  const handleAddContact = (name: string) => {
    const result = addBuyerContact(tradeId, name);
    if (result.trade && result.contact) {
      setContacts((prev) => [...prev, result.contact!]);
      setShipping((prev) => ({ ...prev, personName: result.contact!.name }));
      setTrade(result.trade);
      setMessage("担当者を追加しました。");
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
    if (missingFields.length > 0) {
      setError("発送先と担当者をすべて入力してください。");
      setMessage(null);
      return;
    }

    const updatedShipping = updateTradeShipping(trade.id, shipping, contacts);
    const updated = approveTrade(trade.id, {
      shipping,
      contacts,
      buyerContactName: shipping.personName,
    });
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
    const updated = cancelTrade(trade.id, "buyer");
    if (updated) {
      setTrade(updated);
      router.push("/trade-navi?tab=purchaseHistory");
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

  return (
    <div className="space-y-4">
      <div className="print-hidden sticky top-0 z-20 -mx-2 flex flex-col gap-2 border-b border-slate-200 bg-white/95 px-2 pb-3 pt-2 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{pageTitle ?? "明細書"}</h1>
            {statusKey && (
              <span className="text-xs">
                <StatusBadge statusKey={statusKey} context="inProgress" />
              </span>
            )}
          </div>
          {description && <p className="text-sm text-neutral-800">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
          >
            一時保存
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
          >
            印刷 / PDF保存
          </button>
          {isEditable && (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={!canApprove}
                className="rounded bg-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                承認して進める
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleBack}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
          >
            戻る
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {trade && totals && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryChip label="取引ID" value={trade.id} />
              <SummaryChip label="買主" value={trade.buyer.companyName} />
              <SummaryChip label="売主" value={trade.seller.companyName} />
              <SummaryChip label="合計（税込）" value={formatYen(totals.total)} highlight />
            </div>
          </div>

          <StatementDocument
            trade={trade}
            editable={isEditable}
            shipping={shipping}
            onShippingChange={setShipping}
            contacts={contacts}
            onContactChange={handleContactChange}
            onAddContact={handleAddContact}
            showValidationErrors={isEditable && !canApprove && missingFields.length > 0}
          />
        </div>
      )}
    </div>
  );
}

function SummaryChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-[12px] ${
        highlight
          ? "border-indigo-200 bg-indigo-50 text-indigo-900"
          : "border-slate-200 bg-white text-neutral-900"
      }`}
    >
      <p className="text-[11px] text-neutral-600">{label}</p>
      <p className="truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function mapTradeStatus(status: TradeRecord["status"]): TradeStatusKey {
  switch (status) {
    case "APPROVAL_REQUIRED":
      return "requesting";
    case "PAYMENT_REQUIRED":
      return "waiting_payment";
    case "CONFIRM_REQUIRED":
      return "navi_in_progress";
    case "COMPLETED":
      return "completed";
    case "CANCELED":
      return "canceled";
    default:
      return "navi_in_progress";
  }
}
