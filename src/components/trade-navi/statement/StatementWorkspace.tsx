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

  useEffect(() => {
    const record = loadTrade(tradeId);
    setTrade(record);
    setShipping(record?.buyerShippingAddress ?? record?.shipping ?? {});
    setContacts(ensureContactsLoaded(record));
  }, [tradeId]);

  const actorRole = trade ? getActorRole(trade, currentUser.id) : "none";
  const isBuyer = actorRole === "buyer";
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

  const approveDisabled = !isEditable || missingFields.length > 0 || todoView?.section !== "approval";
  const cancelDisabled = !trade || !canCancel(trade, currentUser.id);

  const handlePrint = () => {
    window.print();
  };

  const handleShippingFieldChange = <K extends keyof ShippingInfo>(key: K, value: string) => {
    setShipping((prev) => ({ ...prev, [key]: value }));
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
      router.push("/navi?tab=purchaseHistory");
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
      router.push(`/navi?tab=${nextTab}`);
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
  const allowShippingEdit = isEditable && todoView?.section === "approval" && actorRole === "buyer";

  const primaryItem = trade.items[0];
  const quantity = trade.quantity ?? trade.items.reduce((sum, item) => sum + (item.qty ?? 0), 0) || primaryItem?.qty || 1;
  const unitPrice =
    primaryItem?.unitPrice ?? (primaryItem?.amount && quantity ? Math.round(primaryItem.amount / quantity) : undefined);

  const findAmountByCategory = (category: string, fallbackLabel?: string) => {
    const item = trade.items.find((candidate) => candidate.category === category || candidate.itemName === fallbackLabel);
    if (!item) return null;
    const qty = item.qty ?? 1;
    const amount = item.amount ?? (item.unitPrice ?? 0) * qty;
    return { label: item.itemName ?? fallbackLabel ?? category, amount };
  };

  const findAmountByLabel = (label: string) => {
    const item = trade.items.find((candidate) => candidate.itemName === label);
    if (!item) return null;
    const qty = item.qty ?? 1;
    const amount = item.amount ?? (item.unitPrice ?? 0) * qty;
    return { label: item.itemName ?? label, amount };
  };

  const amountOf = (item?: { amount?: number; unitPrice?: number; qty?: number | null }) => {
    if (!item) return 0;
    const qty = item.qty ?? 1;
    return item.amount ?? (item.unitPrice ?? 0) * qty;
  };

  const shippingFee = findAmountByCategory("送料", "送料");
  const handlingFee = findAmountByCategory("手数料", "出庫手数料");
  const cardboardFee = findAmountByLabel("段ボール") ?? findAmountByCategory("資材", "段ボール");
  const nailSheetFee = findAmountByLabel("釘シート");
  const insuranceFee = findAmountByCategory("保険", "保険");

  const productSubtotal = trade.items
    .filter((item) => !item.category || item.category === "本体")
    .reduce((sum, item) => sum + amountOf(item), 0);

  const formatDateLabel = (value?: string) => value || "-";

  const memoText = primaryItem?.note ?? "-";
  const notesText = trade.remarks ?? "-";
  const termsText = trade.termsText ?? "-";

  const machineShipmentLabel =
    trade.shipmentDate || trade.shippingMethod
      ? [formatDateLabel(trade.shipmentDate), trade.shippingMethod ?? trade.receiveMethod]
          .filter(Boolean)
          .join(" / ")
      : "-";

  const documentShipmentLabel =
    trade.documentSentDate || trade.documentReceivedDate
      ? [formatDateLabel(trade.documentSentDate), trade.documentReceivedDate && `到着予定 ${trade.documentReceivedDate}`]
          .filter(Boolean)
          .join(" / ")
      : "-";

  return (
    <div className="space-y-6">
      <div className="print-hidden space-y-4">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{pageTitle ?? "ナビ確認"}</h1>
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-slate-50"
              >
                明細書としてPDF保存/印刷
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
                  見送り / キャンセル
                </button>
              )}

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
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-500">売主</p>
                <p className="text-sm font-semibold text-slate-900">{trade.seller.companyName}</p>
              </div>
              <div className="rounded border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-500">買主</p>
                <p className="text-sm font-semibold text-slate-900">{trade.buyer.companyName}</p>
              </div>
              <div className="rounded border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-500">更新日</p>
                <p className="text-sm font-semibold text-slate-900">{formatDateLabel(trade.updatedAt)}</p>
              </div>
              <div className="rounded border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <p className="text-[11px] font-semibold text-neutral-500">合計（税込）</p>
                <p className="text-base font-bold text-indigo-700">{formatYen(totals.total)}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                    <h2 className="text-base font-semibold text-slate-900">売却先</h2>
                    <span className="text-xs font-semibold text-neutral-600">買手情報</span>
                  </div>
                  <div className="space-y-3 px-4 py-3 text-sm text-neutral-900">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold text-neutral-600">会社名</p>
                        <p className="font-semibold text-slate-900">{trade.buyer.companyName}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-neutral-600">電話番号</p>
                        <p className="text-neutral-900">{shipping.tel || trade.buyer.tel || "-"}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-neutral-600">発送先住所</p>
                      {allowShippingEdit ? (
                        <textarea
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                          value={shipping.address ?? ""}
                          onChange={(e) => handleShippingFieldChange("address", e.target.value)}
                          placeholder="住所を入力"
                        />
                      ) : (
                        <p className="whitespace-pre-line text-neutral-900">{shipping.address || trade.buyer.address || "-"}</p>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-neutral-600">担当者</p>
                        {allowShippingEdit ? (
                          <ContactSelector
                            contacts={contacts}
                            value={shipping.personName}
                            onChange={handleContactChange}
                            onAdd={(name) => handleAddContact(name)}
                          />
                        ) : (
                          <p className="text-neutral-900">{shipping.personName || trade.buyer.contactName || "-"}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-neutral-600">郵便番号</p>
                        {allowShippingEdit ? (
                          <input
                            type="text"
                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                            value={shipping.zip ?? ""}
                            onChange={(e) => handleShippingFieldChange("zip", e.target.value)}
                            placeholder="000-0000"
                          />
                        ) : (
                          <p className="text-neutral-900">{shipping.zip || "-"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                    <h2 className="text-base font-semibold text-slate-900">物件情報</h2>
                    <span className="text-xs font-semibold text-neutral-600">商品</span>
                  </div>
                  <div className="grid gap-3 px-4 py-3 text-sm text-neutral-900 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-600">メーカー</p>
                      <p className="font-semibold text-slate-900">{trade.makerName ?? primaryItem?.maker ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-600">機種名</p>
                      <p className="text-neutral-900">{trade.itemName ?? primaryItem?.itemName ?? "取引商品"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-600">台数</p>
                      <p className="text-neutral-900">{quantity}台</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-neutral-600">単価</p>
                      <p className="text-neutral-900">{unitPrice ? formatYen(unitPrice) : "-"}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-300 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                    <h2 className="text-base font-semibold text-slate-900">取引条件</h2>
                    <span className="text-xs font-semibold text-neutral-600">ナビ作成と同じ順序</span>
                  </div>
                  <div className="overflow-x-auto px-2 py-3">
                    <table className="min-w-full border border-slate-300 text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs text-neutral-700">
                          <th className="w-40 px-3 py-1.5">項目</th>
                          <th className="px-3 py-1.5">内容</th>
                        </tr>
                      </thead>
                      <tbody className="text-neutral-900">
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">単価</th>
                          <td className="px-3 py-2">{unitPrice ? formatYen(unitPrice) : "-"}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">台数</th>
                          <td className="px-3 py-2">{quantity}台</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">撤去日</th>
                          <td className="px-3 py-2">-</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">機械発送予定日</th>
                          <td className="px-3 py-2">{machineShipmentLabel}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">書類発送予定日</th>
                          <td className="px-3 py-2">{documentShipmentLabel}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">支払日</th>
                          <td className="px-3 py-2">{formatDateLabel(trade.paymentDate)}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">機械運賃</th>
                          <td className="px-3 py-2">{shippingFee ? formatYen(shippingFee.amount) : "-"}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">出庫手数料</th>
                          <td className="px-3 py-2">{handlingFee ? formatYen(handlingFee.amount) : "-"}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">段ボール</th>
                          <td className="px-3 py-2">{cardboardFee ? formatYen(cardboardFee.amount) : "-"}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">釘シート</th>
                          <td className="px-3 py-2">{nailSheetFee ? formatYen(nailSheetFee.amount) : "-"}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">保険</th>
                          <td className="px-3 py-2">{insuranceFee ? formatYen(insuranceFee.amount) : "-"}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">特記事項</th>
                          <td className="px-3 py-2">{notesText}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">取引条件（テキスト）</th>
                          <td className="px-3 py-2 whitespace-pre-line">{termsText}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">メモ</th>
                          <td className="px-3 py-2 whitespace-pre-line">{memoText}</td>
                        </tr>
                        <tr className="border-t border-slate-300">
                          <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-neutral-900">担当者</th>
                          <td className="px-3 py-2">{shipping.personName || trade.handlerName || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900">ステータス</h3>
                    {statusKey && <StatusBadge statusKey={statusKey} context="inProgress" />}
                  </div>
                  <p className="mt-2 text-sm text-neutral-800">
                    {headerDescription ?? "取引内容を確認し、必要に応じて承認や見送りを行ってください。"}
                  </p>
                </section>

                <section className="space-y-3 rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">金額内訳</h3>
                    <span className="text-xs font-semibold text-neutral-700">自動計算</span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">商品代金</span>
                      <span className="font-semibold text-slate-900">{formatYen(productSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">送料</span>
                      <span className="font-semibold text-slate-900">{shippingFee ? formatYen(shippingFee.amount) : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">出庫手数料</span>
                      <span className="font-semibold text-slate-900">{handlingFee ? formatYen(handlingFee.amount) : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">段ボール</span>
                      <span className="font-semibold text-slate-900">{cardboardFee ? formatYen(cardboardFee.amount) : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">釘シート</span>
                      <span className="font-semibold text-slate-900">{nailSheetFee ? formatYen(nailSheetFee.amount) : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">保険</span>
                      <span className="font-semibold text-slate-900">{insuranceFee ? formatYen(insuranceFee.amount) : "-"}</span>
                    </div>
                    <div className="h-px bg-slate-300" aria-hidden />
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">小計</span>
                      <span className="font-semibold text-slate-900">{formatYen(totals.totalWithoutTax)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">消費税</span>
                      <span className="font-semibold text-slate-900">{formatYen(totals.tax)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-800">合計</span>
                      <span className="text-base font-bold text-sky-700">{formatYen(totals.total)}</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="print-only">
        <StatementDocument
          trade={trade}
          editable={allowShippingEdit}
          shipping={shipping}
          onShippingChange={handleShippingFieldChange}
          contacts={contacts}
          onContactChange={handleContactChange}
          onAddContact={handleAddContact}
        />
      </div>
    </div>
  );
}
