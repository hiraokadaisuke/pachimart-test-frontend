"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { StatusBadge } from "@/components/transactions/StatusBadge";
import { TradeStatusKey } from "@/components/transactions/status";
import { calculateStatementTotals, formatYen } from "@/lib/trade/calcTotals";
import { getInProgressDescription } from "@/lib/trade/copy";
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

import { StatementDocument } from "./StatementDocument";

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

  useEffect(() => {
    const record = loadTrade(tradeId);
    setTrade(record);
    setShipping(record?.buyerShippingAddress ?? record?.shipping ?? {});
    setContacts(ensureContactsLoaded(record));
  }, [tradeId]);

  const actorRole = trade ? getActorRole(trade, currentUser.id) : "none";
  const isBuyer = actorRole === "buyer";
  const isEditable = trade ? canApprove(trade, currentUser.id) : false;

  const totals = useMemo(
    () => (trade ? calculateStatementTotals(trade.items, trade.taxRate ?? 0.1) : null),
    [trade]
  );

  const statusKey = trade ? mapTradeStatus(trade.status) : null;

  const missingFields = useMemo(
    () => requiredFields.filter((field) => !shipping[field] || (shipping[field] ?? "").toString().trim() === ""),
    [shipping]
  );

  const approveDisabled = !isEditable || missingFields.length > 0;
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

  const defaultDescription = getInProgressDescription(actorRole === "seller" ? "sell" : "buy", trade.status);
  const headerDescription = (description ?? defaultDescription) || undefined;

  const cancelBanner =
    trade.status === "CANCELED"
      ? `キャンセル済（${trade.canceledBy === "seller" ? "売手" : trade.canceledBy === "buyer" ? "買手" : "不明"}）`
      : null;

  const isApprovalReadOnlyForSeller = trade.status === "APPROVAL_REQUIRED" && actorRole === "seller";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
        <div>
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

        <div className="print-hidden flex flex-wrap items-center gap-2">
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
          </div>

          <div className="flex items-center gap-2">
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

            {isBuyer && trade.status === "APPROVAL_REQUIRED" && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={approveDisabled}
                className="rounded bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                承認
              </button>
            )}
          </div>

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
          <div className="rounded border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-3 text-[12px] text-neutral-900 md:max-w-[420px]">
              <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-2 py-2">
                <span className="text-neutral-700">買主</span>
                <span className="font-semibold">{trade.buyer.companyName}</span>
              </div>
              <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-2 py-2">
                <span className="text-neutral-700">売主</span>
                <span className="font-semibold">{trade.seller.companyName}</span>
              </div>
              <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-2 py-2">
                <span className="text-neutral-700">発行日</span>
                <span className="font-semibold">{trade.contractDate ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-2 py-2">
                <span className="text-neutral-700">合計（税込）</span>
                <span className="text-base font-bold text-indigo-700">{formatYen(totals.total)}</span>
              </div>
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
          />
        </div>
      )}
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
      return "payment_confirmed";
    case "COMPLETED":
      return "completed";
    case "CANCELED":
      return "canceled";
  }
  const exhaustiveCheck: never = status;
  return exhaustiveCheck;
}
